'use client';

import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { BoardSnapshot } from '@/lib/types';

interface Props {
  snapshot: BoardSnapshot;
  orientation: 'white' | 'black';
  boardWidth?: number;
}

export default function ReadOnlyBoard({ snapshot, orientation, boardWidth = 280 }: Props) {
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (snapshot.lastFrom) {
      styles[snapshot.lastFrom] = { backgroundColor: 'rgba(255, 214, 10, 0.4)' };
    }
    if (snapshot.lastTo) {
      styles[snapshot.lastTo] = { backgroundColor: 'rgba(255, 214, 10, 0.4)' };
    }
    return styles;
  }, [snapshot.lastFrom, snapshot.lastTo]);

  return (
    <div className="relative" style={{ width: boardWidth }}>
      <Chessboard
        options={{
          position: snapshot.fen,
          boardOrientation: orientation,
          allowDragging: false,
          squareStyles,
          boardStyle: { borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' },
          darkSquareStyle: { backgroundColor: '#3e5a80' },
          lightSquareStyle: { backgroundColor: '#c5d3e8' },
        }}
      />
      {snapshot.isCheck && (
        <div className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
          CHECK
        </div>
      )}
    </div>
  );
}
