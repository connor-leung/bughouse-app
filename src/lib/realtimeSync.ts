import { supabase } from './supabase';
import type { GameMove, BoardState, BoardSide, Color } from '../types/game';

export interface MoveEvent {
  move: GameMove;
  boardA: BoardState;
  boardB: BoardState;
  clocks: Record<string, number>;
}

export interface ResignEvent {
  boardSide: BoardSide;
  losingColor: Color;
  playerId: string;
}

export interface GameOverEvent {
  board: BoardSide;
  reason: 'checkmate' | 'timeout' | 'resignation';
  losingColor: Color;
}

export interface ClockSyncEvent {
  clocks: Record<string, number>;
}

type EventHandler<T> = (payload: T) => void;

interface GameChannelCallbacks {
  onMove: EventHandler<MoveEvent>;
  onResign: EventHandler<ResignEvent>;
  onGameOver: EventHandler<GameOverEvent>;
  onClockSync: EventHandler<ClockSyncEvent>;
  onReconnect: () => void;
}

let activeChannel: ReturnType<typeof supabase.channel> | null = null;

export function subscribeToGame(gameId: string, callbacks: GameChannelCallbacks) {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
  }

  const channel = supabase.channel(`game:${gameId}`, {
    config: { broadcast: { self: true, ack: false } },
  });

  channel
    .on('broadcast', { event: 'move' }, ({ payload }: { payload: MoveEvent }) => {
      callbacks.onMove(payload);
    })
    .on('broadcast', { event: 'resign' }, ({ payload }: { payload: ResignEvent }) => {
      callbacks.onResign(payload);
    })
    .on('broadcast', { event: 'game_over' }, ({ payload }: { payload: GameOverEvent }) => {
      callbacks.onGameOver(payload);
    })
    .on('broadcast', { event: 'clock_sync' }, ({ payload }: { payload: ClockSyncEvent }) => {
      callbacks.onClockSync(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Channel connected/reconnected — trigger a full state reload
        callbacks.onReconnect();
      }
    });

  activeChannel = channel;
  return channel;
}

export async function broadcastMove(gameId: string, payload: MoveEvent) {
  if (!activeChannel) return;
  await activeChannel.send({ type: 'broadcast', event: 'move', payload });

  // Also persist to Supabase as source of truth
  await supabase
    .from('games')
    .update({
      board_a: payload.boardA,
      board_b: payload.boardB,
      clocks: { ...payload.clocks, lastSyncAt: Date.now() },
      move_history: await getUpdatedMoveHistory(gameId, payload.move),
    })
    .eq('id', gameId);
}

export async function broadcastResign(gameId: string, payload: ResignEvent) {
  if (!activeChannel) return;
  await activeChannel.send({ type: 'broadcast', event: 'resign', payload });
}

export async function broadcastClockSync(gameId: string, clocks: Record<string, number>) {
  if (!activeChannel) return;
  await activeChannel.send({
    type: 'broadcast',
    event: 'clock_sync',
    payload: { clocks },
  });
}

async function getUpdatedMoveHistory(gameId: string, newMove: GameMove): Promise<GameMove[]> {
  const { data } = await supabase
    .from('games')
    .select('move_history')
    .eq('id', gameId)
    .single();

  const history: GameMove[] = (data?.move_history as GameMove[]) ?? [];
  return [...history, newMove];
}

export function unsubscribeFromGame() {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}

export async function fetchGameFromDb(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !data) return null;
  return data;
}
