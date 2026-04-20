package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/connorleung/bughouse-server/internal/game"
	"github.com/connorleung/bughouse-server/internal/lobby"
	"github.com/connorleung/bughouse-server/internal/ws"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	secret := os.Getenv("WS_SECRET")

	lobbyManager := lobby.NewManager()
	gameManager := game.NewManager()
	handler := ws.NewHandler(lobbyManager, gameManager)

	// validTicket checks that ?ticket=<timestamp>.<hmac> was signed with WS_SECRET
	// and is no older than 60 seconds. When WS_SECRET is unset (local dev), always valid.
	validTicket := func(r *http.Request) bool {
		if secret == "" {
			return true
		}
		parts := strings.SplitN(r.URL.Query().Get("ticket"), ".", 2)
		if len(parts) != 2 {
			return false
		}
		ts, err := strconv.ParseInt(parts[0], 10, 64)
		if err != nil || time.Now().Unix()-ts > 60 {
			return false
		}
		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(parts[0]))
		expected := hex.EncodeToString(mac.Sum(nil))
		return hmac.Equal([]byte(parts[1]), []byte(expected))
	}

	requireToken := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !validTicket(r) {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			next(w, r)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("/lobby", requireToken(handler.HandleLobby))
	mux.HandleFunc("/game/", requireToken(handler.HandleGame))
	mux.HandleFunc("/test-game", requireToken(game.HandleTestGame(gameManager)))

	cors := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	log.Printf("Bughouse server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, cors(mux)); err != nil {
		log.Fatal(err)
	}
}
