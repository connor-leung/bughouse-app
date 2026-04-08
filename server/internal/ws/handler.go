package ws

import (
	"log"
	"net/http"

	"github.com/connorleung/bughouse-server/internal/lobby"
)

// Handler wires HTTP upgrade → WebSocket connections to the right services.
type Handler struct {
	lobbyManager *lobby.Manager
}

func NewHandler(lm *lobby.Manager) *Handler {
	return &Handler{lobbyManager: lm}
}

func (h *Handler) HandleLobby(w http.ResponseWriter, r *http.Request) {
	// TODO: upgrade to WebSocket and hand off to LobbyClient
	log.Println("lobby ws endpoint hit — implementation in Phase 3")
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *Handler) HandleGame(w http.ResponseWriter, r *http.Request) {
	// TODO: upgrade to WebSocket and hand off to GameClient
	log.Println("game ws endpoint hit — implementation in Phase 4")
	http.Error(w, "not implemented", http.StatusNotImplemented)
}
