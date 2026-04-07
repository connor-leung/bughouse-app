import React from 'react';
import { G, Path, Rect } from 'react-native-svg';
import type { Color, PieceSymbol } from '../../types/game';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  x: number;
  y: number;
  size: number;
  opacity?: number;
}

// Unicode chess piece characters rendered via SVG text
// Using simple filled shapes for cross-platform compatibility
const PIECE_PATHS: Record<PieceSymbol, Record<Color, string>> = {
  p: {
    w: 'M50,15 C40,15 30,22 30,32 C30,40 35,46 42,49 L38,70 L25,75 L25,85 L75,85 L75,75 L62,70 L58,49 C65,46 70,40 70,32 C70,22 60,15 50,15 Z',
    b: 'M50,15 C40,15 30,22 30,32 C30,40 35,46 42,49 L38,70 L25,75 L25,85 L75,85 L75,75 L62,70 L58,49 C65,46 70,40 70,32 C70,22 60,15 50,15 Z',
  },
  n: {
    w: 'M22,80 L22,72 C22,72 15,60 15,45 C15,28 28,15 42,15 C52,15 58,20 62,26 C68,22 72,22 75,25 C70,28 68,35 65,40 L70,55 L60,55 L58,65 L72,72 L72,80 Z',
    b: 'M22,80 L22,72 C22,72 15,60 15,45 C15,28 28,15 42,15 C52,15 58,20 62,26 C68,22 72,22 75,25 C70,28 68,35 65,40 L70,55 L60,55 L58,65 L72,72 L72,80 Z',
  },
  b: {
    w: 'M50,10 C44,10 40,14 40,20 C40,24 42,27 45,29 L35,55 C30,57 25,62 25,70 C25,72 26,74 28,75 L25,85 L75,85 L72,75 C74,74 75,72 75,70 C75,62 70,57 65,55 L55,29 C58,27 60,24 60,20 C60,14 56,10 50,10 Z',
    b: 'M50,10 C44,10 40,14 40,20 C40,24 42,27 45,29 L35,55 C30,57 25,62 25,70 C25,72 26,74 28,75 L25,85 L75,85 L72,75 C74,74 75,72 75,70 C75,62 70,57 65,55 L55,29 C58,27 60,24 60,20 C60,14 56,10 50,10 Z',
  },
  r: {
    w: 'M20,85 L20,75 L25,75 L25,30 L20,30 L20,15 L35,15 L35,25 L42,25 L42,15 L58,15 L58,25 L65,25 L65,15 L80,15 L80,30 L75,30 L75,75 L80,75 L80,85 Z',
    b: 'M20,85 L20,75 L25,75 L25,30 L20,30 L20,15 L35,15 L35,25 L42,25 L42,15 L58,15 L58,25 L65,25 L65,15 L80,15 L80,30 L75,30 L75,75 L80,75 L80,85 Z',
  },
  q: {
    w: 'M50,10 L55,25 L70,20 L62,35 L80,30 L68,45 L75,60 L60,55 L55,75 L50,60 L45,75 L40,55 L25,60 L32,45 L20,30 L38,35 L30,20 L45,25 Z M35,75 L65,75 L68,85 L32,85 Z',
    b: 'M50,10 L55,25 L70,20 L62,35 L80,30 L68,45 L75,60 L60,55 L55,75 L50,60 L45,75 L40,55 L25,60 L32,45 L20,30 L38,35 L30,20 L45,25 Z M35,75 L65,75 L68,85 L32,85 Z',
  },
  k: {
    w: 'M50,5 L50,20 M43,12 L57,12 M50,20 C38,25 28,35 25,48 C22,60 28,70 35,75 L25,85 L75,85 L65,75 C72,70 78,60 75,48 C72,35 62,25 50,20 Z',
    b: 'M50,5 L50,20 M43,12 L57,12 M50,20 C38,25 28,35 25,48 C22,60 28,70 35,75 L25,85 L75,85 L65,75 C72,70 78,60 75,48 C72,35 62,25 50,20 Z',
  },
};

const FILL_COLOR: Record<Color, string> = {
  w: '#f0d9b5',
  b: '#1a1a1a',
};

const STROKE_COLOR: Record<Color, string> = {
  w: '#8b6914',
  b: '#f0d9b5',
};

export function ChessPiece({ type, color, x, y, size, opacity = 1 }: ChessPieceProps) {
  const scale = size / 100;
  const fill = FILL_COLOR[color];
  const stroke = STROKE_COLOR[color];
  const path = PIECE_PATHS[type][color];

  return (
    <G
      x={x}
      y={y}
      opacity={opacity}
      transform={`scale(${scale})`}
    >
      <Path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </G>
  );
}
