package lobby

import (
	"fmt"
	"math/rand"
)

type Status string

const (
	StatusWaiting    Status = "waiting"
	StatusStarting   Status = "starting"
	StatusInProgress Status = "inProgress"
	StatusFinished   Status = "finished"
)

type BoardRole string

const (
	Board1White BoardRole = "board1White"
	Board1Black BoardRole = "board1Black"
	Board2White BoardRole = "board2White"
	Board2Black BoardRole = "board2Black"
)

var allRoles = []BoardRole{Board1White, Board1Black, Board2White, Board2Black}

// Team returns 1 or 2 for a given role.
// Team 1: board1White + board2Black
// Team 2: board1Black + board2White
func (r BoardRole) Team() int {
	if r == Board1White || r == Board2Black {
		return 1
	}
	return 2
}

type TimeControl struct {
	Minutes          int `json:"minutes"`
	IncrementSeconds int `json:"incrementSeconds"`
}

type PlayerSlot struct {
	UserID      string    `json:"userId"`
	DisplayName string    `json:"displayName"`
	Role        BoardRole `json:"role"`
}

type Lobby struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	HostUserID  string       `json:"hostUserId"`
	Slots       [4]*PlayerSlot `json:"slots"`
	TimeControl TimeControl  `json:"timeControl"`
	Status      Status       `json:"status"`
}

func newLobby(name, hostUserID, hostDisplayName string, tc TimeControl) *Lobby {
	l := &Lobby{
		ID:          generateID(),
		Name:        name,
		HostUserID:  hostUserID,
		TimeControl: tc,
		Status:      StatusWaiting,
	}
	// Host takes slot 0 (board1White)
	l.Slots[0] = &PlayerSlot{
		UserID:      hostUserID,
		DisplayName: hostDisplayName,
		Role:        Board1White,
	}
	return l
}

func (l *Lobby) Join(userID, displayName string, slotIndex int) error {
	if slotIndex < 0 || slotIndex > 3 {
		return fmt.Errorf("invalid slot index")
	}
	// Leave any existing slot first
	l.Leave(userID)
	if l.Slots[slotIndex] != nil {
		return fmt.Errorf("slot already taken")
	}
	l.Slots[slotIndex] = &PlayerSlot{
		UserID:      userID,
		DisplayName: displayName,
		Role:        allRoles[slotIndex],
	}
	return nil
}

func (l *Lobby) Leave(userID string) {
	for i, s := range l.Slots {
		if s != nil && s.UserID == userID {
			l.Slots[i] = nil
		}
	}
}

func (l *Lobby) IsFull() bool {
	for _, s := range l.Slots {
		if s == nil {
			return false
		}
	}
	return true
}

func generateID() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}
