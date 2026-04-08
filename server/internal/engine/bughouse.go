package engine

import "fmt"

// BoardIndex identifies which of the two boards a move is on.
type BoardIndex int

const (
	Board1 BoardIndex = 0
	Board2 BoardIndex = 1
)

// BughouseGame is the authoritative state for a full 4-player Bughouse game.
// It owns both boards and all four piece banks.
//
// Bank routing:
//   Board1 White captures → Board2 White's bank
//   Board1 Black captures → Board2 Black's bank
//   Board2 White captures → Board1 White's bank
//   Board2 Black captures → Board1 Black's bank
type BughouseGame struct {
	Boards [2]*Board
	// Banks[boardIdx][colorIdx] is the bank for that color on that board.
	Banks [2][2]PieceBank
	// PromotedSquares tracks squares on each board that hold promoted pawns.
	// When a promoted piece is captured the partner receives a pawn, not the
	// promoted role.
	PromotedSquares [2]map[Square]bool
}

// NewBughouseGame initialises a fresh game from the starting position.
func NewBughouseGame() *BughouseGame {
	b1, _ := ParseFEN(StartFEN)
	b2, _ := ParseFEN(StartFEN)
	return &BughouseGame{
		Boards: [2]*Board{b1, b2},
		PromotedSquares: [2]map[Square]bool{
			{}, {},
		},
	}
}

// ApplyMove validates and applies a move on the given board. Returns an error
// if the move is illegal. On success it updates the partner's bank with any
// captured piece and flips the active color.
func (g *BughouseGame) ApplyMove(bIdx BoardIndex, m Move) error {
	b := g.Boards[bIdx]
	bank := g.activeBank(bIdx)

	legal := LegalMoves(b, bank)
	if !g.isInLegalSet(m, legal) {
		return fmt.Errorf("illegal move %v on board %d", m, bIdx)
	}

	// Determine captured piece before applying (promotion-revert aware)
	capturedRole, hasCaptured := g.capturedRole(bIdx, m)

	// Apply move
	g.Boards[bIdx] = applyMove(b, m)

	// Track promoted squares
	g.updatePromotedSquares(bIdx, m)

	// Route capture to partner's bank
	if hasCaptured {
		g.partnerBank(bIdx, b.ActiveColor).Add(capturedRole)
	}

	return nil
}

// activeBank returns the bank for the player whose turn it is on bIdx.
func (g *BughouseGame) activeBank(bIdx BoardIndex) *PieceBank {
	colorIdx := int(g.Boards[bIdx].ActiveColor)
	return &g.Banks[bIdx][colorIdx]
}

// partnerBank returns the bank that receives captured pieces.
// Captures on board1 by white go to board2 white's bank, etc.
func (g *BughouseGame) partnerBank(bIdx BoardIndex, capturer Color) *PieceBank {
	partnerBoard := 1 - int(bIdx)
	return &g.Banks[partnerBoard][int(capturer)]
}

// capturedRole returns the role to add to the partner's bank.
// Applies the Bughouse promotion-revert rule.
func (g *BughouseGame) capturedRole(bIdx BoardIndex, m Move) (Role, bool) {
	b := g.Boards[bIdx]
	var targetSq Square
	switch m.Type {
	case Capture, PromotionCapture:
		targetSq = m.To
	case EnPassant:
		return Pawn, true
	default:
		return 0, false
	}

	p := b.At(targetSq)
	if p == nil {
		return 0, false
	}

	// Promotion-revert: if the piece on this square arrived via promotion,
	// the bank receives a pawn instead.
	if g.PromotedSquares[bIdx][targetSq] && p.Role != Pawn {
		return Pawn, true
	}
	return p.Role, true
}

func (g *BughouseGame) updatePromotedSquares(bIdx BoardIndex, m Move) {
	ps := g.PromotedSquares[bIdx]
	// A piece leaving its from-square clears promotion tracking there
	delete(ps, m.From)
	// A piece arriving at to-square clears any prior promotion tracking there
	delete(ps, m.To)
	// Mark a newly promoted square
	if m.Type == Promotion || m.Type == PromotionCapture {
		ps[m.To] = true
	}
}

func (g *BughouseGame) isInLegalSet(m Move, legal []Move) bool {
	for _, l := range legal {
		if l == m {
			return true
		}
	}
	return false
}

// LegalMovesFor returns all legal moves for the active player on a board,
// including drops from their bank.
func (g *BughouseGame) LegalMovesFor(bIdx BoardIndex) []Move {
	bank := g.activeBank(bIdx)
	return LegalMoves(g.Boards[bIdx], bank)
}

// IsOver reports whether the game has ended (checkmate or stalemate on either
// board). Bughouse: stalemate is a loss, not a draw.
func (g *BughouseGame) IsOver() (over bool, losingBoard BoardIndex) {
	for _, idx := range []BoardIndex{Board1, Board2} {
		b := g.Boards[idx]
		bank := g.activeBank(idx)
		if IsCheckmate(b, bank) || IsStalemate(b, bank) {
			return true, idx
		}
	}
	return false, 0
}
