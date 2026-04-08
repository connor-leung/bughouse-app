package engine

import (
	"fmt"
	"strconv"
	"strings"
)

// Board holds a single chess board position.
type Board struct {
	Squares        [64]*Piece
	ActiveColor    Color
	CastleRights   CastleRights
	EnPassant      Square // NoSquare if none
	HalfMoveClock  int
	FullMoveNumber int
}

// CastleRights tracks which castling moves are still available.
type CastleRights struct {
	WhiteKingSide  bool
	WhiteQueenSide bool
	BlackKingSide  bool
	BlackQueenSide bool
}

func NewBoard() *Board {
	b := &Board{EnPassant: NoSquare, FullMoveNumber: 1}
	return b
}

// Place puts a piece on a square (used during setup/FEN parsing).
func (b *Board) Place(s Square, p *Piece) { b.Squares[s] = p }

// At returns the piece at a square (nil if empty).
func (b *Board) At(s Square) *Piece { return b.Squares[s] }

// IsEmpty reports whether a square has no piece.
func (b *Board) IsEmpty(s Square) bool { return b.Squares[s] == nil }

// KingSquare returns the square of the king of the given color.
func (b *Board) KingSquare(c Color) Square {
	for i, p := range b.Squares {
		if p != nil && p.Role == King && p.Color == c {
			return Square(i)
		}
	}
	return NoSquare
}

// IsAttacked reports whether square s is attacked by any piece of color c.
func (b *Board) IsAttacked(s Square, c Color) bool {
	return len(b.attackers(s, c)) > 0
}

func (b *Board) attackers(s Square, c Color) []Square {
	var result []Square
	for i, p := range b.Squares {
		if p == nil || p.Color != c {
			continue
		}
		sq := Square(i)
		if b.attacks(sq, s) {
			result = append(result, sq)
		}
	}
	return result
}

// attacks reports whether the piece on `from` attacks square `to`.
func (b *Board) attacks(from, to Square) bool {
	p := b.Squares[from]
	if p == nil {
		return false
	}
	switch p.Role {
	case Pawn:
		return pawnAttacks(from, p.Color, to)
	case Knight:
		return knightAttacks(from, to)
	case Bishop:
		return b.slidingAttacks(from, to, bishopDirs)
	case Rook:
		return b.slidingAttacks(from, to, rookDirs)
	case Queen:
		return b.slidingAttacks(from, to, bishopDirs) || b.slidingAttacks(from, to, rookDirs)
	case King:
		return kingAttacks(from, to)
	}
	return false
}

func pawnAttacks(from Square, c Color, to Square) bool {
	df := to.File() - from.File()
	dr := to.Rank() - from.Rank()
	if c == White {
		return dr == 1 && (df == 1 || df == -1)
	}
	return dr == -1 && (df == 1 || df == -1)
}

func knightAttacks(from, to Square) bool {
	df := abs(to.File() - from.File())
	dr := abs(to.Rank() - from.Rank())
	return (df == 1 && dr == 2) || (df == 2 && dr == 1)
}

func kingAttacks(from, to Square) bool {
	return abs(to.File()-from.File()) <= 1 && abs(to.Rank()-from.Rank()) <= 1 && from != to
}

var bishopDirs = [][2]int{{1, 1}, {1, -1}, {-1, 1}, {-1, -1}}
var rookDirs = [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}

func (b *Board) slidingAttacks(from, to Square, dirs [][2]int) bool {
	for _, d := range dirs {
		f, r := from.File()+d[0], from.Rank()+d[1]
		for f >= 0 && f < 8 && r >= 0 && r < 8 {
			sq := MakeSquare(f, r)
			if sq == to {
				return true
			}
			if !b.IsEmpty(sq) {
				break
			}
			f += d[0]
			r += d[1]
		}
	}
	return false
}

// InCheck reports whether the active color's king is in check.
func (b *Board) InCheck() bool {
	ks := b.KingSquare(b.ActiveColor)
	if ks == NoSquare {
		return false
	}
	return b.IsAttacked(ks, b.ActiveColor.Opposite())
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// --------------------------------------------------------------------------
// FEN parsing
// --------------------------------------------------------------------------

const StartFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

func ParseFEN(fen string) (*Board, error) {
	parts := strings.Fields(fen)
	if len(parts) < 4 {
		return nil, fmt.Errorf("invalid FEN: %q", fen)
	}

	b := NewBoard()

	// Piece placement
	rank := 7
	file := 0
	for _, ch := range parts[0] {
		switch {
		case ch == '/':
			rank--
			file = 0
		case ch >= '1' && ch <= '8':
			file += int(ch - '0')
		default:
			color := White
			letter := byte(ch)
			if letter >= 'a' && letter <= 'z' {
				color = Black
				letter -= 32
			}
			role, ok := RoleFromLetter(letter)
			if !ok {
				return nil, fmt.Errorf("unknown piece %c", ch)
			}
			b.Squares[MakeSquare(file, rank)] = &Piece{Role: role, Color: color}
			file++
		}
	}

	// Active color
	if parts[1] == "b" {
		b.ActiveColor = Black
	}

	// Castling rights
	for _, ch := range parts[2] {
		switch ch {
		case 'K':
			b.CastleRights.WhiteKingSide = true
		case 'Q':
			b.CastleRights.WhiteQueenSide = true
		case 'k':
			b.CastleRights.BlackKingSide = true
		case 'q':
			b.CastleRights.BlackQueenSide = true
		}
	}

	// En passant
	if parts[3] != "-" {
		sq, ok := SquareFromName(parts[3])
		if !ok {
			return nil, fmt.Errorf("invalid en passant square: %s", parts[3])
		}
		b.EnPassant = sq
	}

	if len(parts) > 4 {
		b.HalfMoveClock, _ = strconv.Atoi(parts[4])
	}
	if len(parts) > 5 {
		b.FullMoveNumber, _ = strconv.Atoi(parts[5])
	}

	return b, nil
}

// ToFEN serialises the board back to FEN notation.
func (b *Board) ToFEN() string {
	var sb strings.Builder

	for rank := 7; rank >= 0; rank-- {
		empty := 0
		for file := 0; file < 8; file++ {
			p := b.Squares[MakeSquare(file, rank)]
			if p == nil {
				empty++
				continue
			}
			if empty > 0 {
				sb.WriteByte(byte('0' + empty))
				empty = 0
			}
			letter := p.Role.Letter()
			if p.Color == Black {
				letter += 32
			}
			sb.WriteByte(letter)
		}
		if empty > 0 {
			sb.WriteByte(byte('0' + empty))
		}
		if rank > 0 {
			sb.WriteByte('/')
		}
	}

	if b.ActiveColor == White {
		sb.WriteString(" w ")
	} else {
		sb.WriteString(" b ")
	}

	castle := ""
	if b.CastleRights.WhiteKingSide {
		castle += "K"
	}
	if b.CastleRights.WhiteQueenSide {
		castle += "Q"
	}
	if b.CastleRights.BlackKingSide {
		castle += "k"
	}
	if b.CastleRights.BlackQueenSide {
		castle += "q"
	}
	if castle == "" {
		castle = "-"
	}
	sb.WriteString(castle)

	if b.EnPassant == NoSquare {
		sb.WriteString(" -")
	} else {
		sb.WriteString(" " + b.EnPassant.String())
	}

	sb.WriteString(fmt.Sprintf(" %d %d", b.HalfMoveClock, b.FullMoveNumber))
	return sb.String()
}
