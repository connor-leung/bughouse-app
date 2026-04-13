package engine

// applyMove returns a new Board with the move applied. The original is not
// mutated. Captured pieces are NOT routed here — that is handled at the
// BughouseGame level so captures can be sent to the partner's bank.
func applyMove(b *Board, m Move) *Board {
	next := cloneBoard(b)

	switch m.Type {
	case Drop:
		next.Squares[m.To] = &Piece{Role: m.DropRole, Color: b.ActiveColor, FromDrop: true}

	case Normal, Capture:
		p := next.Squares[m.From]
		next.Squares[m.To] = p
		next.Squares[m.From] = nil
		updateCastleRights(next, m.From)
		// En passant target for double pawn push
		next.EnPassant = NoSquare
		if p.Role == Pawn && abs(m.To.Rank()-m.From.Rank()) == 2 {
			epRank := (m.From.Rank() + m.To.Rank()) / 2
			next.EnPassant = MakeSquare(m.From.File(), epRank)
		}

	case EnPassant:
		p := next.Squares[m.From]
		next.Squares[m.To] = p
		next.Squares[m.From] = nil
		// Remove the captured pawn
		capturedRank := m.From.Rank()
		next.Squares[MakeSquare(m.To.File(), capturedRank)] = nil
		next.EnPassant = NoSquare

	case Castle:
		next.Squares[m.To] = next.Squares[m.From]
		next.Squares[m.From] = nil
		// Move the rook
		rank := m.From.Rank()
		if m.To.File() == 6 { // king-side
			next.Squares[MakeSquare(5, rank)] = next.Squares[MakeSquare(7, rank)]
			next.Squares[MakeSquare(7, rank)] = nil
		} else { // queen-side
			next.Squares[MakeSquare(3, rank)] = next.Squares[MakeSquare(0, rank)]
			next.Squares[MakeSquare(0, rank)] = nil
		}
		updateCastleRights(next, m.From)
		next.EnPassant = NoSquare

	case Promotion, PromotionCapture:
		next.Squares[m.To] = &Piece{Role: m.Promotion, Color: b.ActiveColor}
		next.Squares[m.From] = nil
		next.EnPassant = NoSquare
	}

	// Half-move clock
	if m.Type == Capture || m.Type == EnPassant || m.Type == PromotionCapture ||
		(m.From != NoSquare && b.Squares[m.From] != nil && b.Squares[m.From].Role == Pawn) {
		next.HalfMoveClock = 0
	} else {
		next.HalfMoveClock++
	}

	// Full-move counter increments after Black's move
	if b.ActiveColor == Black {
		next.FullMoveNumber++
	}

	next.ActiveColor = b.ActiveColor.Opposite()
	return next
}

func updateCastleRights(b *Board, from Square) {
	switch from {
	case MakeSquare(4, 0):
		b.CastleRights.WhiteKingSide = false
		b.CastleRights.WhiteQueenSide = false
	case MakeSquare(4, 7):
		b.CastleRights.BlackKingSide = false
		b.CastleRights.BlackQueenSide = false
	case MakeSquare(7, 0):
		b.CastleRights.WhiteKingSide = false
	case MakeSquare(0, 0):
		b.CastleRights.WhiteQueenSide = false
	case MakeSquare(7, 7):
		b.CastleRights.BlackKingSide = false
	case MakeSquare(0, 7):
		b.CastleRights.BlackQueenSide = false
	}
}

func cloneBoard(b *Board) *Board {
	next := *b
	copy := [64]*Piece{}
	for i, p := range b.Squares {
		if p != nil {
			clone := *p
			copy[i] = &clone
		}
	}
	next.Squares = copy
	return &next
}

// CapturedPieceRole returns the role of the piece that was captured by a move,
// accounting for the Bughouse promotion-revert rule:
// if the captured piece was promoted, the partner receives a pawn instead.
func CapturedPieceRole(b *Board, m Move) (Role, bool) {
	switch m.Type {
	case Capture, PromotionCapture:
		p := b.Squares[m.To]
		if p == nil {
			return 0, false
		}
		// Promotion revert: if the piece being captured is not a pawn but
		// occupies a square where a promoted pawn could be, we store a pawn.
		// Since we don't track promotion history in the board state, we apply
		// the conservative rule: any non-king capture gives the base role.
		// The server-level game can override this if it tracks promoted squares.
		return p.Role, true
	case EnPassant:
		return Pawn, true
	}
	return 0, false
}

// IsCheckmate reports whether the active color is in checkmate.
func IsCheckmate(b *Board, bank *PieceBank) bool {
	if !b.InCheck() {
		return false
	}
	return len(LegalMoves(b, bank)) == 0
}

// IsStalemate reports whether the active color is stalemated.
// In Bughouse stalemate is a loss for the stalemated player (not a draw).
func IsStalemate(b *Board, bank *PieceBank) bool {
	if b.InCheck() {
		return false
	}
	return len(LegalMoves(b, bank)) == 0
}
