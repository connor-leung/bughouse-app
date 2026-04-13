package game

import (
	"testing"

	"github.com/connorleung/bughouse-server/internal/engine"
	"github.com/connorleung/bughouse-server/internal/lobby"
)

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

// newTestSession creates a Session with four named players and a long clock so
// there is no risk of timeout during tests. Clocks are not started.
func newTestSession() *Session {
	slots := [4]*lobby.PlayerSlot{
		{UserID: "p1", DisplayName: "Alice", Role: lobby.Board1White},
		{UserID: "p2", DisplayName: "Bob", Role: lobby.Board1Black},
		{UserID: "p3", DisplayName: "Carol", Role: lobby.Board2White},
		{UserID: "p4", DisplayName: "Dave", Role: lobby.Board2Black},
	}
	return NewSession("test-game", slots, lobby.TimeControl{Minutes: 60})
}

func requireMove(t *testing.T, s *Session, userID string, req MoveRequest) {
	t.Helper()
	if err := s.ApplyMove(userID, req); err != nil {
		t.Fatalf("player %s move %+v: %v", userID, req, err)
	}
}

func requireMoveErr(t *testing.T, s *Session, userID string, req MoveRequest) {
	t.Helper()
	if err := s.ApplyMove(userID, req); err == nil {
		t.Fatalf("player %s move %+v: expected error, got nil", userID, req)
	}
}

func mv(board, from, to string) MoveRequest {
	return MoveRequest{BoardStr: board, From: from, To: to}
}

func drp(board, role, to string) MoveRequest {
	return MoveRequest{BoardStr: board, DropRole: role, To: to}
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

// TestScholarsMate plays the four-move Scholar's Mate on board 1 while board 2
// remains idle. The game must end with team 1 (board1White + board2Black) winning
// by checkmate.
func TestScholarsMate(t *testing.T) {
	s := newTestSession()

	var gotWinTeam int
	var gotReason EndReason
	s.OnEnd = func(_ *Session, winTeam int, reason EndReason) {
		gotWinTeam = winTeam
		gotReason = reason
	}

	// 1. e4  e5
	requireMove(t, s, "p1", mv("1", "e2", "e4"))
	requireMove(t, s, "p2", mv("1", "e7", "e5"))
	// 2. Bc4  Nc6
	requireMove(t, s, "p1", mv("1", "f1", "c4"))
	requireMove(t, s, "p2", mv("1", "b8", "c6"))
	// 3. Qh5  Nf6??
	requireMove(t, s, "p1", mv("1", "d1", "h5"))
	requireMove(t, s, "p2", mv("1", "g8", "f6"))
	// 4. Qxf7#
	requireMove(t, s, "p1", mv("1", "h5", "f7"))

	if gotWinTeam != 1 {
		t.Errorf("expected team 1 to win, got team %d", gotWinTeam)
	}
	if gotReason != EndCheckmate {
		t.Errorf("expected EndCheckmate, got %q", gotReason)
	}
}

// TestCaptureRoutingAndDrop verifies the core Bughouse rule: a piece captured
// on one board goes to the partner's bank on the other board and can be dropped.
//
// Board 1 white captures black's d5 pawn  →  Board 2 white's bank gains a pawn.
// Board 2 white then drops that pawn back onto board 2.
func TestCaptureRoutingAndDrop(t *testing.T) {
	s := newTestSession()

	// Board 1: 1. e4  d5  2. exd5 (white captures the d5 pawn)
	requireMove(t, s, "p1", mv("1", "e2", "e4"))
	requireMove(t, s, "p2", mv("1", "d7", "d5"))
	requireMove(t, s, "p1", mv("1", "e4", "d5")) // capture

	// Bank routing: Board1 White captures → Board2 White's bank (Carol, p3).
	b2wBank := s.game.Banks[engine.Board2][engine.White]
	if got := b2wBank.Count(engine.Pawn); got != 1 {
		t.Fatalf("Board2White bank: want 1 pawn, got %d", got)
	}

	// p3 drops the pawn on e5 (empty square, not rank 1 or 8).
	requireMove(t, s, "p3", drp("2", "pawn", "e5"))

	// Verify the pawn landed on e5 on board 2.
	e5, _ := engine.SquareFromName("e5")
	piece := s.game.Boards[engine.Board2].At(e5)
	if piece == nil {
		t.Fatal("expected white pawn at e5 on board 2, got nil")
	}
	if piece.Role != engine.Pawn || piece.Color != engine.White {
		t.Errorf("e5 on board 2: want white pawn, got %+v", piece)
	}

	// Bank should now be empty.
	b2wBank = s.game.Banks[engine.Board2][engine.White]
	if got := b2wBank.Count(engine.Pawn); got != 0 {
		t.Errorf("Board2White bank after drop: want 0, got %d", got)
	}

	// Board 2 continues normally: p4 makes a move.
	requireMove(t, s, "p4", mv("2", "e7", "e6"))
}

// TestBothBoardsSimultaneous interleaves moves on both boards.
// Scholar's Mate unfolds on board 1 while board 2 plays opening moves.
// The game ends as soon as board 1 is checkmated, even though board 2 is mid-game.
func TestBothBoardsSimultaneous(t *testing.T) {
	s := newTestSession()

	var ended bool
	var gotWinTeam int
	s.OnEnd = func(_ *Session, winTeam int, _ EndReason) {
		ended = true
		gotWinTeam = winTeam
	}

	// Round 1: both boards open with 1. e4 e5
	requireMove(t, s, "p1", mv("1", "e2", "e4"))
	requireMove(t, s, "p3", mv("2", "e2", "e4"))
	requireMove(t, s, "p2", mv("1", "e7", "e5"))
	requireMove(t, s, "p4", mv("2", "e7", "e5"))

	// Round 2: board 1 Bc4 + board 2 Nf3; board 1 Nc6 + board 2 Nc6
	requireMove(t, s, "p1", mv("1", "f1", "c4"))
	requireMove(t, s, "p3", mv("2", "g1", "f3"))
	requireMove(t, s, "p2", mv("1", "b8", "c6"))
	requireMove(t, s, "p4", mv("2", "b8", "c6"))

	// Round 3: board 1 Qh5; board 2 Bc4; board 1 Nf6?? (blunder)
	requireMove(t, s, "p1", mv("1", "d1", "h5"))
	requireMove(t, s, "p3", mv("2", "f1", "c4"))
	requireMove(t, s, "p2", mv("1", "g8", "f6"))

	// Board 1 Qxf7# — game over before board 2 plays again.
	requireMove(t, s, "p1", mv("1", "h5", "f7"))

	if !ended {
		t.Error("game did not end after Scholar's Mate")
	}
	if gotWinTeam != 1 {
		t.Errorf("expected team 1 to win, got team %d", gotWinTeam)
	}

	// Subsequent moves on either board must be rejected.
	if err := s.ApplyMove("p3", mv("2", "b8", "c6")); err == nil {
		t.Error("expected moves to fail after game ended, got nil")
	}
}

// TestResignation verifies that a player resigning immediately awards the win
// to the opposing team with reason EndResignation.
func TestResignation(t *testing.T) {
	s := newTestSession()

	var gotWinTeam int
	var gotReason EndReason
	s.OnEnd = func(_ *Session, winTeam int, reason EndReason) {
		gotWinTeam = winTeam
		gotReason = reason
	}

	// Play a couple of moves first.
	requireMove(t, s, "p1", mv("1", "e2", "e4"))
	requireMove(t, s, "p2", mv("1", "e7", "e5"))

	// p2 (board1Black, team 2) resigns — team 1 should win.
	s.Resign("p2")

	if gotWinTeam != 1 {
		t.Errorf("expected team 1 to win after p2 resign, got team %d", gotWinTeam)
	}
	if gotReason != EndResignation {
		t.Errorf("expected EndResignation, got %q", gotReason)
	}
}

// TestTeam2ResignationWin verifies that when team 1 resigns, team 2 wins.
func TestTeam2ResignationWin(t *testing.T) {
	s := newTestSession()

	var gotWinTeam int
	s.OnEnd = func(_ *Session, winTeam int, _ EndReason) {
		gotWinTeam = winTeam
	}

	// p1 (board1White, team 1) resigns — team 2 should win.
	s.Resign("p1")

	if gotWinTeam != 2 {
		t.Errorf("expected team 2 to win after p1 resign, got team %d", gotWinTeam)
	}
}

// TestIllegalMoves checks that the session correctly rejects moves that violate
// turn order, board assignment, or chess legality.
func TestIllegalMoves(t *testing.T) {
	s := newTestSession()

	// p2 (board1Black) tries to move on board 1 before p1 (white) has gone.
	requireMoveErr(t, s, "p2", mv("1", "e7", "e5"))

	// p1 (board1White) makes a valid first move.
	requireMove(t, s, "p1", mv("1", "e2", "e4"))

	// p1 tries to move again immediately (not their turn).
	requireMoveErr(t, s, "p1", mv("1", "d2", "d4"))

	// An unrecognised player ID must be rejected outright.
	requireMoveErr(t, s, "unknown", mv("1", "d2", "d4"))

	// p2's turn: attempt a backward pawn move (illegal chess move).
	requireMoveErr(t, s, "p2", mv("1", "e7", "e8"))

	// p2 makes a valid move.
	requireMove(t, s, "p2", mv("1", "e7", "e5"))

	// p1 attempts to drop a piece they don't have in their bank yet.
	requireMoveErr(t, s, "p1", drp("1", "pawn", "e3"))
}

// TestCaptureRoutingBothDirections verifies that captures on board 2 also route
// to board 1's bank correctly.
func TestCaptureRoutingBothDirections(t *testing.T) {
	s := newTestSession()

	// Board 2: 1. e4  d5  2. exd5 (board2White captures board2Black's pawn)
	requireMove(t, s, "p3", mv("2", "e2", "e4"))
	requireMove(t, s, "p4", mv("2", "d7", "d5"))
	requireMove(t, s, "p3", mv("2", "e4", "d5")) // capture

	// Bank routing: Board2 White captures → Board1 White's bank (Alice, p1).
	b1wBank := s.game.Banks[engine.Board1][engine.White]
	if got := b1wBank.Count(engine.Pawn); got != 1 {
		t.Fatalf("Board1White bank: want 1 pawn, got %d", got)
	}

	// p1 has a pawn to drop. Make a normal move first so p2 gets a turn,
	// then p1 drops.
	requireMove(t, s, "p1", mv("1", "e2", "e4"))
	requireMove(t, s, "p2", mv("1", "e7", "e5"))
	requireMove(t, s, "p1", drp("1", "pawn", "d5")) // drop on an empty square

	d5, _ := engine.SquareFromName("d5")
	piece := s.game.Boards[engine.Board1].At(d5)
	if piece == nil {
		t.Fatal("expected white pawn at d5 on board 1, got nil")
	}
	if piece.Role != engine.Pawn || piece.Color != engine.White {
		t.Errorf("d5 on board 1: want white pawn, got %+v", piece)
	}
}
