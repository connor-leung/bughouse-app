package main

import (
	"log"
	"net/http"
	"os"

	"github.com/connorleung/bughouse-server/internal/game"
	"github.com/connorleung/bughouse-server/internal/lobby"
	"github.com/connorleung/bughouse-server/internal/ws"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	lobbyManager := lobby.NewManager()
	gameManager := game.NewManager()
	handler := ws.NewHandler(lobbyManager, gameManager)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/lobby", handler.HandleLobby)
	mux.HandleFunc("/game/", handler.HandleGame)
	mux.HandleFunc("/test-game", game.HandleTestGame(gameManager))

	log.Printf("Bughouse server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
