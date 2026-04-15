package ws

import (
	"net/http"

	"github.com/connorleung/bughouse-server/internal/game"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// Handler exposes HTTP handlers for the lobby and game WebSocket endpoints.
type Handler struct {
	Lobby *lobbyHub
	Game  *gameHub
}

func NewHandler(lm *lobby.Manager, gm *game.Manager) *Handler {
	return &Handler{
		Lobby: newLobbyHub(lm, gm),
		Game:  newGameHub(gm),
	}
}

func (h *Handler) HandleLobby(w http.ResponseWriter, r *http.Request) {
	h.Lobby.ServeHTTP(w, r)
}

func (h *Handler) HandleGame(w http.ResponseWriter, r *http.Request) {
	h.Game.ServeHTTP(w, r)
}
