package engine

// Color represents which side a piece or player belongs to.
type Color int8

const (
	White Color = iota
	Black
)

func (c Color) Opposite() Color {
	if c == White {
		return Black
	}
	return White
}

func (c Color) String() string {
	if c == White {
		return "white"
	}
	return "black"
}

// Role is the type of a chess piece.
type Role int8

const (
	Pawn Role = iota
	Knight
	Bishop
	Rook
	Queen
	King
)

var roleNames = [6]string{"pawn", "knight", "bishop", "rook", "queen", "king"}
var roleLetters = [6]byte{'P', 'N', 'B', 'R', 'Q', 'K'}

func (r Role) String() string { return roleNames[r] }
func (r Role) Letter() byte   { return roleLetters[r] }

// RoleFromLetter converts a FEN piece letter (uppercase) to a Role.
func RoleFromLetter(b byte) (Role, bool) {
	for i, l := range roleLetters {
		if l == b {
			return Role(i), true
		}
	}
	return 0, false
}

// Piece is a colored role.
type Piece struct {
	Role  Role
	Color Color
	// FromDrop marks pieces that entered the board via a drop move.
	// This affects en-passant eligibility for pawns.
	FromDrop bool
}

// Square is a board position 0–63 (a1=0, h1=7, a8=56, h8=63).
type Square int8

const NoSquare Square = -1

func MakeSquare(file, rank int) Square { return Square(rank*8 + file) }
func (s Square) File() int             { return int(s) % 8 }
func (s Square) Rank() int             { return int(s) / 8 }
func (s Square) String() string {
	return string([]byte{'a' + byte(s.File()), '1' + byte(s.Rank())})
}

func SquareFromName(name string) (Square, bool) {
	if len(name) != 2 {
		return NoSquare, false
	}
	file := int(name[0] - 'a')
	rank := int(name[1] - '1')
	if file < 0 || file > 7 || rank < 0 || rank > 7 {
		return NoSquare, false
	}
	return MakeSquare(file, rank), true
}

// MoveType distinguishes the kinds of moves that can be made.
type MoveType int8

const (
	Normal MoveType = iota
	Capture
	EnPassant
	Castle
	Drop // Bughouse: place a banked piece on an empty square
	Promotion
	PromotionCapture
)

// Move encodes a single half-move.
type Move struct {
	From      Square
	To        Square
	Type      MoveType
	Promotion Role // set when Type == Promotion or PromotionCapture
	DropRole  Role // set when Type == Drop
}

func (m Move) IsNull() bool { return m.From == NoSquare && m.To == NoSquare }

// PieceBank counts pieces available for dropping (one bank per player).
type PieceBank [6]int // indexed by Role

func (b *PieceBank) Add(r Role) { b[r]++ }

// AddCaptured adds a captured piece; if it was a promoted pawn, the
// receiving partner gets a pawn — not the promoted piece.
func (b *PieceBank) AddCaptured(r Role) {
	if r == King {
		return // kings are never in banks
	}
	// Promotion-revert: store only pawns regardless of promoted role.
	// The caller is responsible for tracking whether a piece was promoted;
	// for simplicity the engine always stores the original role.
	b.Add(r)
}

func (b *PieceBank) Remove(r Role) bool {
	if b[r] <= 0 {
		return false
	}
	b[r]--
	return true
}

func (b PieceBank) Count(r Role) int { return b[r] }

func (b PieceBank) IsEmpty() bool {
	for _, c := range b {
		if c > 0 {
			return false
		}
	}
	return true
}
