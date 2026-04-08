package lobby

import "sync"

// Manager holds all active lobbies in memory.
type Manager struct {
	mu      sync.RWMutex
	lobbies map[string]*Lobby
}

func NewManager() *Manager {
	return &Manager{lobbies: make(map[string]*Lobby)}
}

func (m *Manager) Create(name, hostUserID, hostDisplayName string, tc TimeControl) *Lobby {
	l := newLobby(name, hostUserID, hostDisplayName, tc)
	m.mu.Lock()
	m.lobbies[l.ID] = l
	m.mu.Unlock()
	return l
}

func (m *Manager) Get(id string) (*Lobby, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	l, ok := m.lobbies[id]
	return l, ok
}

func (m *Manager) Delete(id string) {
	m.mu.Lock()
	delete(m.lobbies, id)
	m.mu.Unlock()
}

func (m *Manager) List() []*Lobby {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]*Lobby, 0, len(m.lobbies))
	for _, l := range m.lobbies {
		if l.Status == StatusWaiting {
			out = append(out, l)
		}
	}
	return out
}
