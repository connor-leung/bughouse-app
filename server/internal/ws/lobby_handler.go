package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/connorleung/bughouse-server/internal/game"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// lobbyHub tracks all connected lobby clients and broadcasts updates.
type lobbyHub struct {
	mu          sync.RWMutex
	clients     map[string]*Client // keyed by userID
	manager     *lobby.Manager
	gameManager *game.Manager
}

func newLobbyHub(m *lobby.Manager, gm *game.Manager) *lobbyHub {
	return &lobbyHub{
		clients:     make(map[string]*Client),
		manager:     m,
		gameManager: gm,
	}
}

func (h *lobbyHub) register(c *Client) {
	h.mu.Lock()
	h.clients[c.UserID] = c
	h.mu.Unlock()
}

func (h *lobbyHub) unregister(c *Client) {
	h.mu.Lock()
	delete(h.clients, c.UserID)
	h.mu.Unlock()
}

func (h *lobbyHub) broadcast(msgType string, data any) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, c := range h.clients {
		c.Send(msgType, data)
	}
}

// ServeHTTP handles the /lobby WebSocket endpoint.
func (h *lobbyHub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c, err := Upgrade(w, r)
	if err != nil {
		log.Printf("lobby upgrade error: %v", err)
		return
	}
	c.DisplayName = r.URL.Query().Get("displayName")

	h.register(c)
	defer h.unregister(c)

	// Send current lobby list immediately
	c.Send("lobby:list", h.manager.List())

	go c.WritePump()
	c.ReadPump(func(env Envelope) {
		h.handleMessage(c, env)
	})
}

func (h *lobbyHub) handleMessage(c *Client, env Envelope) {
	switch env.Type {
	case "lobby:list":
		c.Send("lobby:list", h.manager.List())

	case "lobby:create":
		var req struct {
			Name        string            `json:"name"`
			TimeControl lobby.TimeControl `json:"timeControl"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil || req.Name == "" {
			c.Send("lobby:error", map[string]string{"message": "invalid create request"})
			return
		}
		l := h.manager.Create(req.Name, c.UserID, c.DisplayName, req.TimeControl)
		c.Send("lobby:created", l)
		h.broadcast("lobby:list", h.manager.List())

	case "lobby:join":
		var req struct {
			LobbyID   string `json:"lobbyId"`
			SlotIndex int    `json:"slotIndex"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil {
			c.Send("lobby:error", map[string]string{"message": "invalid join request"})
			return
		}
		l, ok := h.manager.Get(req.LobbyID)
		if !ok {
			c.Send("lobby:error", map[string]string{"message": "lobby not found"})
			return
		}
		if err := l.Join(c.UserID, c.DisplayName, req.SlotIndex); err != nil {
			c.Send("lobby:error", map[string]string{"message": err.Error()})
			return
		}
		h.broadcast("lobby:updated", l)

	case "lobby:leave":
		var req struct {
			LobbyID string `json:"lobbyId"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil {
			return
		}
		if l, ok := h.manager.Get(req.LobbyID); ok {
			l.Leave(c.UserID)
			if l.PlayerCount() == 0 {
				h.manager.Delete(req.LobbyID)
				h.broadcast("lobby:list", h.manager.List())
			} else {
				h.broadcast("lobby:updated", l)
			}
		}

	case "lobby:start":
		var req struct {
			LobbyID string `json:"lobbyId"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil {
			return
		}
		l, ok := h.manager.Get(req.LobbyID)
		if !ok || l.HostUserID != c.UserID || !l.IsFull() {
			c.Send("lobby:error", map[string]string{"message": "cannot start game"})
			return
		}

		// Create the game session before notifying players
		sess := game.NewSession(l.ID, l.Slots, l.TimeControl)
		h.gameManager.Add(sess)
		l.Status = lobby.StatusInProgress

		// Notify each player of their assigned role
		h.mu.RLock()
		for i, slot := range l.Slots {
			if slot == nil {
				continue
			}
			if player, exists := h.clients[slot.UserID]; exists {
				player.Send("game:starting", map[string]any{
					"gameId": l.ID,
					"role":   l.Slots[i].Role,
				})
			}
		}
		h.mu.RUnlock()
		h.broadcast("lobby:list", h.manager.List())
	}
}
