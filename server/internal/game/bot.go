package game

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/connorleung/bughouse-server/internal/engine"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// RunBot makes random legal moves for the player at playerIdx.
// It runs as a goroutine and exits when stopCh is closed or the game ends.
func RunBot(s *Session, playerIdx int, stopCh <-chan struct{}) {
	// Stagger start so bots don't all move at once
	time.Sleep(time.Duration(400+rand.Intn(600)) * time.Millisecond)

	ticker := time.NewTicker(time.Duration(1200+rand.Intn(1000)) * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-stopCh:
			return
		case <-ticker.C:
			if done := botMove(s, playerIdx); done {
				return
			}
			ticker.Reset(time.Duration(1000+rand.Intn(1500)) * time.Millisecond)
		}
	}
}

// botMove attempts one move for the bot. Returns true if the game is over.
func botMove(s *Session, playerIdx int) (gameOver bool) {
	s.mu.Lock()

	p := s.Players[playerIdx]
	if p == nil {
		s.mu.Unlock()
		return false
	}

	bIdx, err := boardIdxFromRole(p.Role)
	if err != nil {
		s.mu.Unlock()
		return false
	}

	// If the game is already over, signal the bot to stop.
	if over, _ := s.game.IsOver(); over {
		s.mu.Unlock()
		return true
	}

	b := s.game.Boards[bIdx]
	if !isColorTurn(p.Role, b.ActiveColor) {
		s.mu.Unlock()
		return false // not this bot's turn
	}

	moves := s.game.LegalMovesFor(bIdx)
	if len(moves) == 0 {
		s.mu.Unlock()
		return false
	}

	move := pickMove(moves)
	if err := s.game.ApplyMove(bIdx, move); err != nil {
		s.mu.Unlock()
		return false
	}

	s.clocks.RecordMove(playerIdx, int64(b.ActiveColor))

	if over, losingBoard := s.game.IsOver(); over {
		winTeam := s.winTeamFromLoss(losingBoard)
		s.mu.Unlock()
		s.end(winTeam, EndCheckmate)
		return true
	}

	s.mu.Unlock()
	if s.OnUpdate != nil {
		s.OnUpdate(s)
	}
	return false
}

func boardIdxFromRole(role lobby.BoardRole) (engine.BoardIndex, error) {
	switch role {
	case lobby.Board1White, lobby.Board1Black:
		return engine.Board1, nil
	case lobby.Board2White, lobby.Board2Black:
		return engine.Board2, nil
	}
	return 0, fmt.Errorf("unknown role %s", role)
}

func isColorTurn(role lobby.BoardRole, active engine.Color) bool {
	switch role {
	case lobby.Board1White, lobby.Board2White:
		return active == engine.White
	case lobby.Board1Black, lobby.Board2Black:
		return active == engine.Black
	}
	return false
}

func pickMove(moves []engine.Move) engine.Move {
	var regular, drops []engine.Move
	for _, m := range moves {
		if m.Type == engine.Drop {
			drops = append(drops, m)
		} else {
			regular = append(regular, m)
		}
	}
	// Use drops 30% of the time when regular moves are available
	if len(regular) > 0 && (len(drops) == 0 || rand.Intn(10) < 7) {
		return regular[rand.Intn(len(regular))]
	}
	if len(drops) > 0 {
		return drops[rand.Intn(len(drops))]
	}
	return moves[rand.Intn(len(moves))]
}
