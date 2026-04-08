package engine

// LegalMoves returns all legal moves for the active color, including drops
// from the supplied bank. Pass nil for bank if this is a standard game.
func LegalMoves(b *Board, bank *PieceBank) []Move {
	pseudo := pseudoLegalMoves(b, bank)
	var legal []Move
	for _, m := range pseudo {
		if isLegal(b, m) {
			legal = append(legal, m)
		}
	}
	return legal
}

// isLegal applies a move and checks the active king is not left in check.
func isLegal(b *Board, m Move) bool {
	next := applyMove(b, m)
	// After the move the turn has flipped, so check the original color.
	ks := next.KingSquare(b.ActiveColor)
	if ks == NoSquare {
		return false
	}
	return !next.IsAttacked(ks, b.ActiveColor.Opposite())
}

// pseudoLegalMoves generates all candidate moves without checking legality.
func pseudoLegalMoves(b *Board, bank *PieceBank) []Move {
	var moves []Move
	for i, p := range b.Squares {
		if p == nil || p.Color != b.ActiveColor {
			continue
		}
		sq := Square(i)
		switch p.Role {
		case Pawn:
			moves = append(moves, pawnMoves(b, sq, p.Color)...)
		case Knight:
			moves = append(moves, leaperMoves(b, sq, p.Color, knightOffsets)...)
		case Bishop:
			moves = append(moves, sliderMoves(b, sq, p.Color, bishopDirs)...)
		case Rook:
			moves = append(moves, sliderMoves(b, sq, p.Color, rookDirs)...)
		case Queen:
			moves = append(moves, sliderMoves(b, sq, p.Color, bishopDirs)...)
			moves = append(moves, sliderMoves(b, sq, p.Color, rookDirs)...)
		case King:
			moves = append(moves, leaperMoves(b, sq, p.Color, kingOffsets)...)
			moves = append(moves, castleMoves(b, p.Color)...)
		}
	}
	// Drop moves from bank (Bughouse-specific)
	if bank != nil {
		moves = append(moves, dropMoves(b, bank, b.ActiveColor)...)
	}
	return moves
}

// --------------------------------------------------------------------------
// Pawn moves
// --------------------------------------------------------------------------

func pawnMoves(b *Board, from Square, c Color) []Move {
	var moves []Move
	dir := 1
	startRank := 1
	promoRank := 7
	if c == Black {
		dir = -1
		startRank = 6
		promoRank = 0
	}

	// Single push
	to := MakeSquare(from.File(), from.Rank()+dir)
	if inBounds(to) && b.IsEmpty(to) {
		if to.Rank() == promoRank {
			moves = append(moves, promoMoves(from, to, Normal)...)
		} else {
			moves = append(moves, Move{From: from, To: to, Type: Normal})
		}

		// Double push from starting rank
		if from.Rank() == startRank {
			to2 := MakeSquare(from.File(), from.Rank()+2*dir)
			if b.IsEmpty(to2) {
				moves = append(moves, Move{From: from, To: to2, Type: Normal})
			}
		}
	}

	// Captures
	for _, df := range []int{-1, 1} {
		cf := from.File() + df
		if cf < 0 || cf > 7 {
			continue
		}
		to = MakeSquare(cf, from.Rank()+dir)
		if !inBounds(to) {
			continue
		}
		target := b.At(to)
		if target != nil && target.Color != c {
			if to.Rank() == promoRank {
				moves = append(moves, promoMoves(from, to, Capture)...)
			} else {
				moves = append(moves, Move{From: from, To: to, Type: Capture})
			}
		} else if to == b.EnPassant {
			moves = append(moves, Move{From: from, To: to, Type: EnPassant})
		}
	}
	return moves
}

func promoMoves(from, to Square, base MoveType) []Move {
	t := Promotion
	if base == Capture {
		t = PromotionCapture
	}
	return []Move{
		{From: from, To: to, Type: t, Promotion: Queen},
		{From: from, To: to, Type: t, Promotion: Rook},
		{From: from, To: to, Type: t, Promotion: Bishop},
		{From: from, To: to, Type: t, Promotion: Knight},
	}
}

// --------------------------------------------------------------------------
// Leaper moves (knight, king)
// --------------------------------------------------------------------------

var knightOffsets = [][2]int{{2, 1}, {2, -1}, {-2, 1}, {-2, -1}, {1, 2}, {1, -2}, {-1, 2}, {-1, -2}}
var kingOffsets = [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}, {1, 1}, {1, -1}, {-1, 1}, {-1, -1}}

func leaperMoves(b *Board, from Square, c Color, offsets [][2]int) []Move {
	var moves []Move
	for _, off := range offsets {
		f := from.File() + off[0]
		r := from.Rank() + off[1]
		if f < 0 || f > 7 || r < 0 || r > 7 {
			continue
		}
		to := MakeSquare(f, r)
		target := b.At(to)
		if target == nil {
			moves = append(moves, Move{From: from, To: to, Type: Normal})
		} else if target.Color != c {
			moves = append(moves, Move{From: from, To: to, Type: Capture})
		}
	}
	return moves
}

// --------------------------------------------------------------------------
// Slider moves (bishop, rook, queen)
// --------------------------------------------------------------------------

func sliderMoves(b *Board, from Square, c Color, dirs [][2]int) []Move {
	var moves []Move
	for _, d := range dirs {
		f, r := from.File()+d[0], from.Rank()+d[1]
		for f >= 0 && f < 8 && r >= 0 && r < 8 {
			to := MakeSquare(f, r)
			target := b.At(to)
			if target == nil {
				moves = append(moves, Move{From: from, To: to, Type: Normal})
			} else {
				if target.Color != c {
					moves = append(moves, Move{From: from, To: to, Type: Capture})
				}
				break
			}
			f += d[0]
			r += d[1]
		}
	}
	return moves
}

// --------------------------------------------------------------------------
// Castling
// --------------------------------------------------------------------------

func castleMoves(b *Board, c Color) []Move {
	var moves []Move
	if c == White {
		if b.CastleRights.WhiteKingSide && canCastle(b, c, true) {
			moves = append(moves, Move{From: MakeSquare(4, 0), To: MakeSquare(6, 0), Type: Castle})
		}
		if b.CastleRights.WhiteQueenSide && canCastle(b, c, false) {
			moves = append(moves, Move{From: MakeSquare(4, 0), To: MakeSquare(2, 0), Type: Castle})
		}
	} else {
		if b.CastleRights.BlackKingSide && canCastle(b, c, true) {
			moves = append(moves, Move{From: MakeSquare(4, 7), To: MakeSquare(6, 7), Type: Castle})
		}
		if b.CastleRights.BlackQueenSide && canCastle(b, c, false) {
			moves = append(moves, Move{From: MakeSquare(4, 7), To: MakeSquare(2, 7), Type: Castle})
		}
	}
	return moves
}

func canCastle(b *Board, c Color, kingSide bool) bool {
	rank := 0
	if c == Black {
		rank = 7
	}
	opp := c.Opposite()

	// King must not be in check
	if b.IsAttacked(MakeSquare(4, rank), opp) {
		return false
	}

	if kingSide {
		// f and g squares must be empty and not attacked
		for _, file := range []int{5, 6} {
			sq := MakeSquare(file, rank)
			if !b.IsEmpty(sq) || b.IsAttacked(sq, opp) {
				return false
			}
		}
	} else {
		// b, c, d squares must be empty; c and d not attacked
		if !b.IsEmpty(MakeSquare(1, rank)) {
			return false
		}
		for _, file := range []int{2, 3} {
			sq := MakeSquare(file, rank)
			if !b.IsEmpty(sq) || b.IsAttacked(sq, opp) {
				return false
			}
		}
	}
	return true
}

// --------------------------------------------------------------------------
// Drop moves (Bughouse-specific)
// --------------------------------------------------------------------------

func dropMoves(b *Board, bank *PieceBank, c Color) []Move {
	var moves []Move
	for role := Pawn; role <= Queen; role++ {
		if bank.Count(role) == 0 {
			continue
		}
		for sq := Square(0); sq < 64; sq++ {
			if !b.IsEmpty(sq) {
				continue
			}
			if role == Pawn && !pawnDropLegal(sq, c) {
				continue
			}
			moves = append(moves, Move{
				From:     NoSquare,
				To:       sq,
				Type:     Drop,
				DropRole: role,
			})
		}
	}
	return moves
}

// pawnDropLegal enforces the Bughouse rule: pawns cannot be dropped on the
// 1st rank (white) or 8th rank (black).
func pawnDropLegal(sq Square, c Color) bool {
	if c == White {
		return sq.Rank() != 0 && sq.Rank() != 7
	}
	return sq.Rank() != 0 && sq.Rank() != 7
}

func inBounds(s Square) bool { return s >= 0 && s < 64 }
