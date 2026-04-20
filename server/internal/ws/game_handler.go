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
	mu           sync.RWMutex
	clients      map[string]*Client // keyed by userID
	clientGameID map[string]string  // userID → game session ID they are watching
	manager      *game.Manager
}

func newGameHub(gm *game.Manager) *gameHub {
	return &gameHub{
		clients:      make(map[string]*Client),
		clientGameID: make(map[string]string),
		manager:      gm,
	}
}

func (h *gameHub) register(c *Client, gameID string) {
	h.mu.Lock()
	h.clients[c.UserID] = c
	h.clientGameID[c.UserID] = gameID
	h.mu.Unlock()
}

func (h *gameHub) unregister(c *Client) {
	h.mu.Lock()
	gameID := h.clientGameID[c.UserID]
	delete(h.clients, c.UserID)
	delete(h.clientGameID, c.UserID)
	h.mu.Unlock()
	// Clean up the session if it has ended and no players remain.
	if gameID != "" {
		h.cleanupIfEmpty(gameID)
	}
}

// cleanupIfEmpty removes a session from the manager when it has ended
// and all players have disconnected.
func (h *gameHub) cleanupIfEmpty(gameID string) {
	sess, ok := h.manager.Get(gameID)
	if !ok || !sess.Ended {
		return
	}
	h.mu.RLock()
	for _, p := range sess.Players {
		if p == nil {
			continue
		}
		if _, ok := h.clients[p.UserID]; ok {
			h.mu.RUnlock()
			return // at least one player still connected
		}
	}
	h.mu.RUnlock()
	h.manager.Remove(gameID)
}

func (h *gameHub) broadcastToSession(s *game.Session, msgType string, data any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, p := range s.Players {
		if p == nil {
			continue
		}
		if c, ok := h.clients[p.UserID]; ok {
			// Only send if the client is still watching this session.
			if h.clientGameID[p.UserID] == s.ID {
				c.Send(msgType, data)
			}
		}
	}
}

// allConnectedVoted returns true when every player currently connected to
// this session has cast a rematch vote.
func (h *gameHub) allConnectedVoted(sess *game.Session, voterIDs []string) bool {
	voterSet := make(map[string]bool, len(voterIDs))
	for _, id := range voterIDs {
		voterSet[id] = true
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	connectedCount := 0
	for _, p := range sess.Players {
		if p == nil {
			continue
		}
		if _, ok := h.clients[p.UserID]; ok {
			if h.clientGameID[p.UserID] == sess.ID {
				connectedCount++
				if !voterSet[p.UserID] {
					return false
				}
			}
		}
	}
	return connectedCount > 0
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

	h.register(c, gameID)
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
			"scores":      []int{s.Scores[0], s.Scores[1]},
		})
		// Session is cleaned up by cleanupIfEmpty when the last player disconnects.
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
		h.broadcastTeam(sess, c.UserID, req.Text)

	case "game:rematch":
		sess.VoteRematch(c.UserID)
		voterIDs := sess.RematchVoterIDs()
		h.broadcastToSession(sess, "game:rematch_votes", map[string]any{
			"votes": voterIDs,
		})
		if h.allConnectedVoted(sess, voterIDs) {
			newSess := sess.NewRematchSession()
			h.wireSession(newSess)
			h.manager.Add(newSess)

			// Notify each connected player of their role in the new game.
			h.mu.RLock()
			for _, p := range sess.Players {
				if p == nil {
					continue
				}
				if client, ok := h.clients[p.UserID]; ok {
					client.Send("game:starting", map[string]any{
						"gameId": newSess.ID,
						"role":   string(p.Role),
					})
				}
			}
			h.mu.RUnlock()

			// Don't remove old session here — cleanupIfEmpty handles it
			// as players navigate to the new game and disconnect.
			newSess.Start()
		}
	}
}

// wireSession attaches broadcast callbacks to a new session.
func (h *gameHub) wireSession(s *game.Session) {
	s.OnUpdate = func(sess *game.Session) {
		h.broadcastToSession(sess, "game:update", sess.Snapshot())
	}
	s.OnEnd = func(sess *game.Session, winTeam int, reason game.EndReason) {
		h.broadcastToSession(sess, "game:ended", map[string]any{
			"winningTeam": winTeam,
			"reason":      reason,
			"scores":      []int{sess.Scores[0], sess.Scores[1]},
		})
		// Session is cleaned up by cleanupIfEmpty when the last player disconnects.
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
