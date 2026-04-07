import { create } from 'zustand';
import { BughouseEngine, createInitialBoardState } from '../engine/BughouseEngine';
import { getWinningTeam } from '../engine/GameRules';
import type {
  GameState,
  BoardState,
  GameMove,
  RegularMove,
  DropMove,
  BoardSide,
  Color,
  TerminationResult,
} from '../types/game';

interface SelectionState {
  boardSide: BoardSide | null;
  square: string | null;        // selected piece square (regular move)
  dropPiece: string | null;     // selected drop piece symbol
  legalSquares: string[];       // highlighted target squares
}

interface GameStoreState {
  game: GameState | null;
  engine: BughouseEngine | null;
  selection: SelectionState;
  clocksMs: Record<string, number>; // live clock values, updated frequently

  initGame: (game: GameState) => void;
  applyMove: (move: GameMove) => void;
  applyResignation: (boardSide: BoardSide, losingColor: Color) => void;
  syncFromServer: (boardA: BoardState, boardB: BoardState, moveHistory: GameMove[], clocks: Record<string, number>) => void;
  setGameOver: (termination: TerminationResult) => void;
  setSelection: (selection: Partial<SelectionState>) => void;
  clearSelection: () => void;
  updateClock: (playerId: string, remaining: number) => void;
  reset: () => void;
}

const emptySelection: SelectionState = {
  boardSide: null,
  square: null,
  dropPiece: null,
  legalSquares: [],
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  game: null,
  engine: null,
  selection: emptySelection,
  clocksMs: {},

  initGame: (game) => {
    const engine = new BughouseEngine();
    engine.loadFromBoardStates(game.boardA, game.boardB);
    const clocks: Record<string, number> = {};
    for (const [id, ms] of Object.entries(game.clocks)) {
      if (id !== 'lastSyncAt') clocks[id] = ms as number;
    }
    set({ game, engine, clocksMs: clocks, selection: emptySelection });
  },

  applyMove: (move) => {
    const { game, engine } = get();
    if (!game || !engine) return;

    let result;
    if (move.type === 'regular') {
      result = engine.applyRegularMove(move as RegularMove);
    } else {
      result = engine.applyDropMove(move as DropMove);
    }

    if (!result.success || !result.newBoardState) return;

    const states = engine.getBothBoardStates();
    const newMoveHistory = [...game.moveHistory, move];

    set((state) => ({
      selection: emptySelection,
      game: state.game
        ? {
            ...state.game,
            boardA: states.A,
            boardB: states.B,
            moveHistory: newMoveHistory,
          }
        : null,
    }));
  },

  applyResignation: (boardSide, losingColor) => {
    const { game } = get();
    if (!game) return;

    const termination: TerminationResult = {
      board: boardSide,
      reason: 'resignation',
      losingColor,
    };
    get().setGameOver(termination);
  },

  syncFromServer: (boardA, boardB, moveHistory, clocks) => {
    const { engine, game } = get();
    if (!engine || !game) return;

    engine.loadFromBoardStates(boardA, boardB);

    set((state) => ({
      game: state.game
        ? { ...state.game, boardA, boardB, moveHistory }
        : null,
      clocksMs: { ...clocks },
    }));
  },

  setGameOver: (termination) => {
    const winnerTeam = getWinningTeam(termination);
    set((state) => {
      if (!state.game) return {};
      const boardKey = termination.board === 'A' ? 'boardA' : 'boardB';
      const board = state.game[boardKey];
      return {
        game: {
          ...state.game,
          status: 'finished',
          finishedAt: Date.now(),
          winnerTeam,
          [boardKey]: {
            ...board,
            isGameOver: true,
            termination: termination.reason,
            winner: termination.losingColor === 'w' ? 'b' : 'w',
          },
        },
      };
    });
  },

  setSelection: (partial) => {
    set((state) => ({ selection: { ...state.selection, ...partial } }));
  },

  clearSelection: () => {
    set({ selection: emptySelection });
  },

  updateClock: (playerId, remaining) => {
    set((state) => ({
      clocksMs: { ...state.clocksMs, [playerId]: remaining },
    }));
  },

  reset: () => {
    set({ game: null, engine: null, selection: emptySelection, clocksMs: {} });
  },
}));
