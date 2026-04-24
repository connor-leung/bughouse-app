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

func (h *gameHub) unregister(c *Client, gameID string) {
	h.mu.Lock()
	// Only evict if this client is still the active one for this userID.
	// A newer connection for the same user may have already replaced it.
	if stored, ok := h.clients[c.UserID]; ok && stored == c {
		log.Printf("[hub] unregister %s from %s (active client)", c.UserID, gameID)
		delete(h.clients, c.UserID)
		delete(h.clientGameID, c.UserID)
	} else {
		log.Printf("[hub] unregister %s from %s (superseded, skipping delete)", c.UserID, gameID)
	}
	h.mu.Unlock()
	h.cleanupIfEmpty(gameID)
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
			if h.clientGameID[p.UserID] == gameID {
				h.mu.RUnlock()
				return // at least one player still watching this session
			}
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

	log.Printf("[game] new connection: user=%s gameId=%s", c.UserID, gameID)
	sess, ok := h.manager.Get(gameID)
	if !ok {
		log.Printf("[game] session not found: %s", gameID)
		c.Send("error", map[string]string{"message": "game not found"})
		c.Close()
		return
	}

	log.Printf("[game] session found, registering client %s", c.UserID)
	h.register(c, gameID)
	defer h.unregister(c, gameID)

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
		// Push updated snapshot so clients get the final scores immediately.
		h.broadcastToSession(s, "game:update", s.Snapshot())
		// Session is cleaned up by cleanupIfEmpty when the last player disconnects.
	}

	// Send full state on connect
	log.Printf("[game] sending game:state to %s for session %s", c.UserID, gameID)
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
		log.Printf("[rematch] vote from %s on session %s", c.UserID, sess.ID)
		sess.VoteRematch(c.UserID)
		voterIDs := sess.RematchVoterIDs()
		log.Printf("[rematch] voters: %v", voterIDs)
		h.broadcastToSession(sess, "game:rematch_votes", map[string]any{
			"votes": voterIDs,
		})
		if h.allConnectedVoted(sess, voterIDs) {
			log.Printf("[rematch] all connected voted — creating new session")
			newSess := sess.NewRematchSession()
			log.Printf("[rematch] new session ID: %s", newSess.ID)
			if sess.OnRematch != nil {
				sess.OnRematch(newSess)
				log.Printf("[rematch] OnRematch callback fired (bots spawned)")
			}
			h.wireSession(newSess)
			h.manager.Add(newSess)
			log.Printf("[rematch] new session added to manager")

			// Build a userID → new role map from the rematch session.
			newRoleFor := make(map[string]string, 4)
			for _, np := range newSess.Players {
				if np != nil {
					newRoleFor[np.UserID] = string(np.Role)
				}
			}

			// Notify each connected player of their role in the new game.
			h.mu.RLock()
			for _, p := range sess.Players {
				if p == nil {
					continue
				}
				if client, ok := h.clients[p.UserID]; ok {
					client.Send("game:starting", map[string]any{
						"gameId": newSess.ID,
						"role":   newRoleFor[p.UserID],
					})
				}
			}
			h.mu.RUnlock()
			log.Printf("[rematch] game:starting sent to clients")

			// Don't remove old session here — cleanupIfEmpty handles it
			// as players navigate to the new game and disconnect.
			newSess.Start()
			log.Printf("[rematch] newSess.Start() called")
		} else {
			log.Printf("[rematch] not all connected voted yet")
		}
	}
}

// wireSession attaches broadcast callbacks to a new session.
// It chains any existing OnEnd (e.g. bot cleanup set by OnRematch).
func (h *gameHub) wireSession(s *game.Session) {
	s.OnUpdate = func(sess *game.Session) {
		h.broadcastToSession(sess, "game:update", sess.Snapshot())
	}
	prevOnEnd := s.OnEnd
	s.OnEnd = func(sess *game.Session, winTeam int, reason game.EndReason) {
		if prevOnEnd != nil {
			prevOnEnd(sess, winTeam, reason)
		}
		h.broadcastToSession(sess, "game:ended", map[string]any{
			"winningTeam": winTeam,
			"reason":      reason,
			"scores":      []int{sess.Scores[0], sess.Scores[1]},
		})
		h.broadcastToSession(sess, "game:update", sess.Snapshot())
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
