package game

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strings"

	"github.com/connorleung/bughouse-server/internal/lobby"
)

// HandleTestGame creates a game with 3 bots for a single human player.
// The human is assigned Board 1 White. Call via GET /test-game?userId=xxx&displayName=xxx
func HandleTestGame(gm *Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("userId")
		displayName := r.URL.Query().Get("displayName")
		if userID == "" {
			userID = "test-user"
		}
		if displayName == "" {
			displayName = "You"
		}

		// Resign any prior test-game sessions for this user so old bot
		// goroutines are stopped and sessions are cleaned up.
		for _, old := range gm.FindByPlayer(userID) {
			if strings.HasPrefix(old.ID, "T") {
				old.Resign(userID)
			}
		}

		tc := lobby.TimeControl{Minutes: 3, IncrementSeconds: 0}

		// Human is slot 0 (board1White); bots fill slots 1-3
		slots := [4]*lobby.PlayerSlot{
			{UserID: userID, DisplayName: displayName, Role: lobby.Board1White},
			{UserID: "bot-1", DisplayName: "Bot 1", Role: lobby.Board1Black},
			{UserID: "bot-2", DisplayName: "Bot 2", Role: lobby.Board2White},
			{UserID: "bot-3", DisplayName: "Bot 3", Role: lobby.Board2Black},
		}

		sess := NewSession(generateTestID(), slots, tc)
		gm.Add(sess)

		// Start bots for slots 1, 2, 3
		stopCh := make(chan struct{})
		sess.OnEnd = func(s *Session, winTeam int, reason EndReason) {
			close(stopCh)
			gm.Remove(s.ID)
		}

		for i := 1; i <= 3; i++ {
			idx := i
			go RunBot(sess, idx, stopCh)
		}

		sess.Start()

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"gameId": sess.ID})
	}
}

func generateTestID() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return "T" + string(b)
}
