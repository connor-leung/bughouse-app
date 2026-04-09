package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/connorleung/bughouse-server/internal/game"
)

// gameHub manages WebSocket clients inside a game session.
type gameHub struct {
	mu      sync.RWMutex
	clients map[string]*Client // keyed by userID
	manager *game.Manager
}

func newGameHub(gm *game.Manager) *gameHub {
	return &gameHub{
		clients: make(map[string]*Client),
		manager: gm,
	}
}

func (h *gameHub) register(c *Client) {
	h.mu.Lock()
	h.clients[c.UserID] = c
	h.mu.Unlock()
}

func (h *gameHub) unregister(c *Client) {
	h.mu.Lock()
	delete(h.clients, c.UserID)
	h.mu.Unlock()
}

func (h *gameHub) broadcastToSession(s *game.Session, msgType string, data any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, p := range s.Players {
		if p == nil {
			continue
		}
		if c, ok := h.clients[p.UserID]; ok {
			c.Send(msgType, data)
		}
	}
}

// ServeHTTP handles /game/{gameId} WebSocket connections.
func (h *gameHub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Extract game ID from path: /game/{id}
	gameID := strings.TrimPrefix(r.URL.Path, "/game/")
	if gameID == "" {
		http.Error(w, "missing game id", http.StatusBadRequest)
		return
	}

	c, err := Upgrade(w, r)
	if err != nil {
		log.Printf("game upgrade error: %v", err)
		return
	}

	sess, ok := h.manager.Get(gameID)
	if !ok {
		c.Send("error", map[string]string{"message": "game not found"})
		c.Close()
		return
	}

	h.register(c)
	defer h.unregister(c)

	// Hook up session callbacks to broadcast via this hub.
	// Chain OnEnd so any pre-existing handler (e.g. bot stopCh) still fires.
	prevOnEnd := sess.OnEnd
	sess.OnUpdate = func(s *game.Session) {
		h.broadcastToSession(s, "game:update", s.Snapshot())
	}
	sess.OnEnd = func(s *game.Session, winTeam int, reason game.EndReason) {
		if prevOnEnd != nil {
			prevOnEnd(s, winTeam, reason)
		}
		h.broadcastToSession(s, "game:ended", map[string]any{
			"winningTeam": winTeam,
			"reason":      reason,
		})
		h.manager.Remove(s.ID)
	}

	// Send full state on connect
	c.Send("game:state", sess.Snapshot())

	go c.WritePump()
	c.ReadPump(func(env Envelope) {
		h.handleMessage(c, sess, env)
	})
}

func (h *gameHub) handleMessage(c *Client, sess *game.Session, env Envelope) {
	switch env.Type {
	case "game:move", "game:drop":
		var req game.MoveRequest
		if err := json.Unmarshal(env.Data, &req); err != nil {
			c.Send("error", map[string]string{"message": "invalid move request"})
			return
		}
		if err := sess.ApplyMove(c.UserID, req); err != nil {
			c.Send("error", map[string]string{"message": err.Error()})
		}

	case "game:resign":
		sess.Resign(c.UserID)

	case "game:message":
		var req struct {
			Text string `json:"text"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil || req.Text == "" {
			return
		}
		// Broadcast to teammates only
		h.broadcastTeam(sess, c.UserID, req.Text)
	}
}

func (h *gameHub) broadcastTeam(sess *game.Session, senderID, text string) {
	senderTeam := 0
	senderName := ""
	for _, p := range sess.Players {
		if p != nil && p.UserID == senderID {
			senderTeam = p.Role.Team()
			senderName = p.DisplayName
			break
		}
	}
	if senderTeam == 0 {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, p := range sess.Players {
		if p == nil || p.Role.Team() != senderTeam {
			continue
		}
		if c, ok := h.clients[p.UserID]; ok {
			c.Send("game:message", map[string]any{
				"senderId":   senderID,
				"senderName": senderName,
				"text":       text,
			})
		}
	}
}
