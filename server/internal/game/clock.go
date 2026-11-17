package game

import (
	"sync"
	"time"
)

// ClockManager runs four independent countdown clocks, one per player.
// Player indices match the Session.Players array (0=board1white, 1=board1black,
// 2=board2white, 3=board2black).
type ClockManager struct {
	mu          sync.Mutex
	remaining   [4]int64 // milliseconds remaining
	increment   int64    // milliseconds added after each move
	activeBoard [2]int   // which player index is active on each board
	lastTick    [2]time.Time
	ticker      *time.Ticker
	stopCh      chan struct{}
	onTimeout   func(playerIdx int)
}

func NewClockManager(initialMs, incrementMs int64, onTimeout func(int)) *ClockManager {
	cm := &ClockManager{
		increment: incrementMs,
		stopCh:    make(chan struct{}),
		onTimeout: onTimeout,
	}
	// Initialise all four clocks
	for i := range cm.remaining {
		cm.remaining[i] = initialMs
	}
	// Board 1: player 0 (white) starts; Board 2: player 2 (white) starts
	cm.activeBoard[0] = 0
	cm.activeBoard[1] = 2
	return cm
}

// Start kicks off the internal ticker.
func (cm *ClockManager) Start() {
	now := time.Now()
	cm.lastTick[0] = now
	cm.lastTick[1] = now
	cm.ticker = time.NewTicker(100 * time.Millisecond)
	go cm.run()
}

// Stop halts all clocks.
func (cm *ClockManager) Stop() {
	close(cm.stopCh)
	if cm.ticker != nil {
		cm.ticker.Stop()
	}
}

// Remaining returns milliseconds remaining for a player.
func (cm *ClockManager) Remaining(idx int) int64 {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	return cm.remaining[idx]
}

// AllRemaining returns all four clock values.
func (cm *ClockManager) AllRemaining() [4]int64 {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	return cm.remaining
}

// RecordMove is called after a player makes a move. It adds the increment to
// their clock and switches the active player on their board.
func (cm *ClockManager) RecordMove(playerIdx int, _ int64) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	boardIdx := playerIdx / 2
	cm.remaining[playerIdx] += cm.increment
	cm.lastTick[boardIdx] = time.Now()

	// Toggle active player on this board
	if cm.activeBoard[boardIdx] == playerIdx {
		// Switch to the opponent on this board
		if playerIdx == boardIdx*2 {
			cm.activeBoard[boardIdx] = boardIdx*2 + 1
		} else {
			cm.activeBoard[boardIdx] = boardIdx * 2
		}
	}
}

func (cm *ClockManager) run() {
	for {
		select {
		case <-cm.stopCh:
			return
		case now := <-cm.ticker.C:
			cm.mu.Lock()
			for boardIdx := 0; boardIdx < 2; boardIdx++ {
				active := cm.activeBoard[boardIdx]
				elapsed := now.Sub(cm.lastTick[boardIdx]).Milliseconds()
				cm.lastTick[boardIdx] = now
				cm.remaining[active] -= elapsed
				if cm.remaining[active] <= 0 {
					cm.remaining[active] = 0
					cm.mu.Unlock()
					cm.onTimeout(active)
					return
				}
			}
			cm.mu.Unlock()
		}
	}
}
