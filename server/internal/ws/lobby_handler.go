package ws

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/connorleung/bughouse-server/internal/game"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// lobbyHub tracks all connected lobby clients and broadcasts updates.
type lobbyHub struct {
	mu               sync.RWMutex
	clients          map[string]*Client // keyed by userID
	manager          *lobby.Manager
	gameManager      *game.Manager
	cancelCountdowns map[string]context.CancelFunc
	countdownMu      sync.Mutex
}

func newLobbyHub(m *lobby.Manager, gm *game.Manager) *lobbyHub {
	return &lobbyHub{
		clients:          make(map[string]*Client),
		manager:          m,
		gameManager:      gm,
		cancelCountdowns: make(map[string]context.CancelFunc),
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
			// Cancel any countdown since lobby is no longer full/all-ready
			h.cancelCountdown(req.LobbyID)
			if l.Status == lobby.StatusStarting {
				l.Status = lobby.StatusWaiting
			}
			if l.PlayerCount() == 0 {
				h.manager.Delete(req.LobbyID)
				h.broadcast("lobby:list", h.manager.List())
			} else {
				h.broadcast("lobby:updated", l)
			}
		}

	case "lobby:ready":
		var req struct {
			LobbyID string `json:"lobbyId"`
		}
		if err := json.Unmarshal(env.Data, &req); err != nil {
			return
		}
		l, ok := h.manager.Get(req.LobbyID)
		if !ok || l.Status == lobby.StatusInProgress {
			return
		}

		// Only players in a slot can ready up
		inLobby := false
		for _, s := range l.Slots {
			if s != nil && s.UserID == c.UserID {
				inLobby = true
				break
			}
		}
		if !inLobby {
			return
		}

		// Toggle ready state
		if l.IsReady(c.UserID) {
			l.SetUnready(c.UserID)
			h.cancelCountdown(req.LobbyID)
			if l.Status == lobby.StatusStarting {
				l.Status = lobby.StatusWaiting
			}
			h.broadcast("lobby:updated", l)
		} else {
			l.SetReady(c.UserID)
			if l.AllReady() {
				l.Status = lobby.StatusStarting
				h.broadcast("lobby:updated", l)

				ctx, cancel := context.WithCancel(context.Background())
				h.countdownMu.Lock()
				h.cancelCountdowns[req.LobbyID] = cancel
				h.countdownMu.Unlock()

				go func(lobbyID string, lob *lobby.Lobby) {
					select {
					case <-time.After(3 * time.Second):
						h.countdownMu.Lock()
						delete(h.cancelCountdowns, lobbyID)
						h.countdownMu.Unlock()
						h.startGame(lob)
					case <-ctx.Done():
					}
				}(req.LobbyID, l)
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
		h.cancelCountdown(req.LobbyID)
		h.startGame(l)
	}
}

func (h *lobbyHub) startGame(l *lobby.Lobby) {
	sess := game.NewSession(l.ID, l.Slots, l.TimeControl)
	h.gameManager.Add(sess)
	l.Status = lobby.StatusInProgress

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

func (h *lobbyHub) cancelCountdown(lobbyID string) {
	h.countdownMu.Lock()
	defer h.countdownMu.Unlock()
	if cancel, ok := h.cancelCountdowns[lobbyID]; ok {
		cancel()
		delete(h.cancelCountdowns, lobbyID)
	}
}
