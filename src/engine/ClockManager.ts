/**
 * Per-player chess clock management.
 * Clocks tick client-side; authoritative values are synced via Supabase.
 */
export class ClockManager {
  private remaining: Map<string, number> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private lastTickAt: Map<string, number> = new Map();
  private onExpire: (playerId: string) => void;
  private onTick: (playerId: string, remaining: number) => void;

  constructor(
    onExpire: (playerId: string) => void,
    onTick: (playerId: string, remaining: number) => void,
  ) {
    this.onExpire = onExpire;
    this.onTick = onTick;
  }

  /**
   * Initialize all clocks with equal time.
   */
  initClocks(playerIds: string[], timeMs: number): void {
    for (const id of playerIds) {
      this.remaining.set(id, timeMs);
    }
  }

  /**
   * Load clock values from a server-authoritative snapshot.
   * Always takes the minimum (clients can't gain time).
   */
  syncFromServer(snapshot: Record<string, number>): void {
    for (const [id, serverMs] of Object.entries(snapshot)) {
      if (id === 'lastSyncAt') continue;
      const local = this.remaining.get(id) ?? serverMs;
      this.remaining.set(id, Math.min(local, serverMs));
    }
  }

  /**
   * Start ticking a player's clock.
   */
  start(playerId: string): void {
    if (this.intervals.has(playerId)) return; // already ticking

    this.lastTickAt.set(playerId, Date.now());

    const interval = setInterval(() => {
      const lastTick = this.lastTickAt.get(playerId) ?? Date.now();
      const now = Date.now();
      const elapsed = now - lastTick;
      this.lastTickAt.set(playerId, now);

      const current = this.remaining.get(playerId) ?? 0;
      const updated = Math.max(0, current - elapsed);
      this.remaining.set(playerId, updated);
      this.onTick(playerId, updated);

      if (updated <= 0) {
        this.stop(playerId);
        this.onExpire(playerId);
      }
    }, 100); // tick every 100ms for smooth display

    this.intervals.set(playerId, interval);
  }

  /**
   * Stop (pause) a player's clock.
   */
  stop(playerId: string): void {
    const interval = this.intervals.get(playerId);
    if (interval !== undefined) {
      clearInterval(interval);
      this.intervals.delete(playerId);
    }
  }

  /**
   * Stop all clocks (e.g., on game end).
   */
  stopAll(): void {
    for (const id of this.intervals.keys()) {
      this.stop(id);
    }
  }

  getRemaining(playerId: string): number {
    return this.remaining.get(playerId) ?? 0;
  }

  isRunning(playerId: string): boolean {
    return this.intervals.has(playerId);
  }

  /**
   * Get a snapshot of all remaining times for server sync.
   */
  getSnapshot(): Record<string, number> {
    const snapshot: Record<string, number> = {};
    this.remaining.forEach((ms, id) => {
      snapshot[id] = ms;
    });
    return snapshot;
  }

  destroy(): void {
    this.stopAll();
    this.remaining.clear();
    this.intervals.clear();
    this.lastTickAt.clear();
  }
}
