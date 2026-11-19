package game

import (
	"fmt"
	"math/rand"
	"sync"

	"github.com/connorleung/bughouse-server/internal/engine"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// EndReason describes how a game ended.
type EndReason string

const (
	EndCheckmate   EndReason = "checkmate"
	EndStalemate   EndReason = "stalemate"
	EndTimeout     EndReason = "timeout"
	EndResignation EndReason = "resignation"
)

// Session is a live Bughouse game.
type Session struct {
	ID      string
	Players [4]*Player // indexed by BoardRole order
	game    *engine.BughouseGame
	clocks  *ClockManager
	tc      lobby.TimeControl
	mu      sync.Mutex
	endOnce sync.Once

	Ended        bool
	Scores       [2]int
	PlayerScores map[string]int // userID → cumulative wins across rematches
	rematchVotes map[string]bool
	rematchMu    sync.Mutex

	OnUpdate  func(s *Session)
	OnEnd     func(s *Session, winTeam int, reason EndReason)
	OnRematch func(newSession *Session)
}

// Player links a lobby slot to a live WebSocket sender.
type Player struct {
	UserID      string
	DisplayName string
	Role        lobby.BoardRole
	Send        func(msgType string, data any)
}

// NewSession creates a game session from a filled lobby.
func NewSession(id string, slots [4]*lobby.PlayerSlot, tc lobby.TimeControl) *Session {
	durationMs := int64(tc.Minutes) * 60 * 1000

	s := &Session{
		ID:           id,
		game:         engine.NewBughouseGame(),
		tc:           tc,
		rematchVotes: make(map[string]bool),
		PlayerScores: make(map[string]int),
	}

	for i, slot := range slots {
		if slot == nil {
			continue
		}
		s.Players[i] = &Player{
			UserID:      slot.UserID,
			DisplayName: slot.DisplayName,
			Role:        slot.Role,
		}
	}

	s.clocks = NewClockManager(durationMs, int64(tc.IncrementSeconds)*1000, func(idx int) {
		// Clock expired for player idx
		winTeam := s.Players[idx].Role.Team()%2 + 1 // opponent team
		s.end(winTeam, EndTimeout)
	})

	return s
}

// NewRematchSession creates a new session with the same players, carries over
// scores, and swaps teams so colours alternate each game.
// The Players array is ordered [board1White, board1Black, board2White, board2Black].
// Swapping teams means flipping colours on each board:
//
//	old board1White → new board1Black (slot 1)
//	old board1Black → new board1White (slot 0)
//	old board2White → new board2Black (slot 3)
//	old board2Black → new board2White (slot 2)
//
// Because team composition inverts, the carried-over scores are also swapped.
func (s *Session) NewRematchSession() *Session {
	newID := newSessionID()

	// swapMap[newSlot] = oldSlot
	swapMap := [4]int{1, 0, 3, 2}
	newRoles := [4]lobby.BoardRole{lobby.Board1White, lobby.Board1Black, lobby.Board2White, lobby.Board2Black}

	slots := [4]*lobby.PlayerSlot{}
	for newIdx, oldIdx := range swapMap {
		p := s.Players[oldIdx]
		if p != nil {
			slots[newIdx] = &lobby.PlayerSlot{
				UserID:      p.UserID,
				DisplayName: p.DisplayName,
				Role:        newRoles[newIdx],
			}
		}
	}

	next := NewSession(newID, slots, s.tc)
	// Swap team scores because team 1 and team 2 have exchanged identities.
	next.Scores = [2]int{s.Scores[1], s.Scores[0]}
	// Per-player scores are user-keyed so they carry over unchanged.
	for id, wins := range s.PlayerScores {
		next.PlayerScores[id] = wins
	}
	return next
}

// Start begins the game and clocks.
func (s *Session) Start() {
	s.clocks.Start()
}

// MoveRequest represents a move or drop submitted by a client.
type MoveRequest struct {
	BoardStr string `json:"board"` // "1" or "2"
	From     string `json:"from"`  // empty for drops
	To       string `json:"to"`
	Promo    string `json:"promotion"` // optional
	DropRole string `json:"pieceRole"` // for drops
}

// ApplyMove validates and applies a move from a player.
func (s *Session) ApplyMove(userID string, req MoveRequest) error {
	s.mu.Lock()

	bIdx, err := s.boardIdxForPlayer(userID)
	if err != nil {
		s.mu.Unlock()
		return err
	}

	b := s.game.Boards[bIdx]
	color := b.ActiveColor
	if !s.isPlayerTurn(userID, bIdx, color) {
		s.mu.Unlock()
		return fmt.Errorf("not your turn")
	}

	m, err := s.parseMove(req, b)
	if err != nil {
		s.mu.Unlock()
		return err
	}

	if err := s.game.ApplyMove(bIdx, m); err != nil {
		s.mu.Unlock()
		return err
	}

	s.clocks.RecordMove(s.playerIdx(userID), int64(b.ActiveColor))

	// Check game over
	if over, losingBoard := s.game.IsOver(); over {
		winTeam := s.winTeamFromLoss(losingBoard)
		s.mu.Unlock()
		s.end(winTeam, EndCheckmate)
		return nil
	}

	s.mu.Unlock()
	if s.OnUpdate != nil {
		s.OnUpdate(s)
	}
	return nil
}

func (s *Session) winTeamFromLoss(losingBoard engine.BoardIndex) int {
	// The active color on the losing board is the one who was mated / stalemated.
	loserColor := s.game.Boards[losingBoard].ActiveColor
	// Find their team
	for _, p := range s.Players {
		if p == nil {
			continue
		}
		boardNum := int(losingBoard) + 1
		if p.Role == lobby.BoardRole(fmt.Sprintf("board%dWhite", boardNum)) && loserColor == engine.White {
			return oppositeTeam(p.Role.Team())
		}
		if p.Role == lobby.BoardRole(fmt.Sprintf("board%dBlack", boardNum)) && loserColor == engine.Black {
			return oppositeTeam(p.Role.Team())
		}
	}
	return 1
}

func oppositeTeam(t int) int {
	if t == 1 {
		return 2
	}
	return 1
}

func (s *Session) end(winTeam int, reason EndReason) {
	s.endOnce.Do(func() {
		s.Ended = true
		s.clocks.Stop()
		s.Scores[winTeam-1]++
		for _, p := range s.Players {
			if p != nil && p.Role.Team() == winTeam {
				s.PlayerScores[p.UserID]++
			}
		}
		if s.OnEnd != nil {
			s.OnEnd(s, winTeam, reason)
		}
	})
}

func (s *Session) Resign(userID string) {
	s.mu.Lock()
	for _, p := range s.Players {
		if p != nil && p.UserID == userID {
			winTeam := oppositeTeam(p.Role.Team())
			s.mu.Unlock()
			s.end(winTeam, EndResignation)
			return
		}
	}
	s.mu.Unlock()
}

// VoteRematch records a rematch vote from userID.
func (s *Session) VoteRematch(userID string) {
	s.rematchMu.Lock()
	defer s.rematchMu.Unlock()
	s.rematchVotes[userID] = true
}

// RematchVoterIDs returns the user IDs of players who have voted for rematch.
func (s *Session) RematchVoterIDs() []string {
	s.rematchMu.Lock()
	defer s.rematchMu.Unlock()
	ids := make([]string, 0, len(s.rematchVotes))
	for id := range s.rematchVotes {
		ids = append(ids, id)
	}
	return ids
}

// Snapshot returns a JSON-serialisable view of the full game state.
func (s *Session) Snapshot() map[string]any {
	s.mu.Lock()
	defer s.mu.Unlock()

	b1 := s.game.Boards[0]
	b2 := s.game.Boards[1]

	return map[string]any{
		"gameId":  s.ID,
		"board1":  boardSnap(b1),
		"board2":  boardSnap(b2),
		"bank":    bankSnap(s.game.Banks),
		"players": playerSnap(s.Players),
		"clocksMs": []int64{
			s.clocks.Remaining(0),
			s.clocks.Remaining(1),
			s.clocks.Remaining(2),
			s.clocks.Remaining(3),
		},
		"scores":       []int{s.Scores[0], s.Scores[1]},
		"playerScores": s.PlayerScores,
	}
}

func boardSnap(b *engine.Board) map[string]any {
	return map[string]any{
		"fen":     b.ToFEN(),
		"isCheck": b.InCheck(),
	}
}

func bankSnap(banks [2][2]engine.PieceBank) map[string]any {
	roles := []engine.Role{engine.Pawn, engine.Knight, engine.Bishop, engine.Rook, engine.Queen}
	snap := func(bank engine.PieceBank) map[string]int {
		m := make(map[string]int)
		for _, r := range roles {
			if c := bank.Count(r); c > 0 {
				m[r.String()] = c
			}
		}
		return m
	}
	return map[string]any{
		"board1White": snap(banks[0][0]),
		"board1Black": snap(banks[0][1]),
		"board2White": snap(banks[1][0]),
		"board2Black": snap(banks[1][1]),
	}
}

func playerSnap(players [4]*Player) []map[string]any {
	out := make([]map[string]any, 0, 4)
	for _, p := range players {
		if p == nil {
			continue
		}
		out = append(out, map[string]any{
			"userId":      p.UserID,
			"displayName": p.DisplayName,
			"role":        string(p.Role),
		})
	}
	return out
}

func newSessionID() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

func (s *Session) boardIdxForPlayer(userID string) (engine.BoardIndex, error) {
	for _, p := range s.Players {
		if p != nil && p.UserID == userID {
			switch p.Role {
			case lobby.Board1White, lobby.Board1Black:
				return engine.Board1, nil
			case lobby.Board2White, lobby.Board2Black:
				return engine.Board2, nil
			}
		}
	}
	return 0, fmt.Errorf("player not found")
}

func (s *Session) isPlayerTurn(userID string, bIdx engine.BoardIndex, active engine.Color) bool {
	for _, p := range s.Players {
		if p == nil || p.UserID != userID {
			continue
		}
		if bIdx == engine.Board1 {
			if active == engine.White && p.Role == lobby.Board1White {
				return true
			}
			if active == engine.Black && p.Role == lobby.Board1Black {
				return true
			}
		} else {
			if active == engine.White && p.Role == lobby.Board2White {
				return true
			}
			if active == engine.Black && p.Role == lobby.Board2Black {
				return true
			}
		}
	}
	return false
}

func (s *Session) playerIdx(userID string) int {
	for i, p := range s.Players {
		if p != nil && p.UserID == userID {
			return i
		}
	}
	return 0
}

func (s *Session) parseMove(req MoveRequest, b *engine.Board) (engine.Move, error) {
	if req.DropRole != "" {
		to, ok := engine.SquareFromName(req.To)
		if !ok {
			return engine.Move{}, fmt.Errorf("invalid square %s", req.To)
		}
		role, ok := roleFromString(req.DropRole)
		if !ok {
			return engine.Move{}, fmt.Errorf("unknown role %s", req.DropRole)
		}
		return engine.Move{
			From:     engine.NoSquare,
			To:       to,
			Type:     engine.Drop,
			DropRole: role,
		}, nil
	}

	from, ok := engine.SquareFromName(req.From)
	if !ok {
		return engine.Move{}, fmt.Errorf("invalid from square %s", req.From)
	}
	to, ok := engine.SquareFromName(req.To)
	if !ok {
		return engine.Move{}, fmt.Errorf("invalid to square %s", req.To)
	}

	m := engine.Move{From: from, To: to}

	// Determine move type from board state
	target := b.At(to)
	piece := b.At(from)
	if piece == nil {
		return engine.Move{}, fmt.Errorf("no piece at %s", req.From)
	}

	switch {
	case to == b.EnPassant && piece.Role == engine.Pawn:
		m.Type = engine.EnPassant
	case target != nil:
		m.Type = engine.Capture
	default:
		m.Type = engine.Normal
	}

	// Promotion
	if req.Promo != "" {
		role, ok := roleFromString(req.Promo)
		if !ok {
			return engine.Move{}, fmt.Errorf("unknown promotion role %s", req.Promo)
		}
		m.Promotion = role
		if m.Type == engine.Capture {
			m.Type = engine.PromotionCapture
		} else {
			m.Type = engine.Promotion
		}
	}

	// Castling detection
	if piece.Role == engine.King && abs(int(to.File())-int(from.File())) == 2 {
		m.Type = engine.Castle
	}

	return m, nil
}

func roleFromString(s string) (engine.Role, bool) {
	for r := engine.Pawn; r <= engine.King; r++ {
		if r.String() == s {
			return r, true
		}
	}
	return 0, false
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
