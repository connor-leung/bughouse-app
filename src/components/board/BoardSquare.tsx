import React from 'react';
import { Rect, Circle } from 'react-native-svg';

interface BoardSquareProps {
  x: number;
  y: number;
  size: number;
  isLight: boolean;
  isSelected: boolean;
  isLegalTarget: boolean;
  isLastMove: boolean;
  isInCheck: boolean;
}

const LIGHT_SQUARE = '#f0d9b5';
const DARK_SQUARE = '#b58863';
const SELECTED_OVERLAY = 'rgba(20, 85, 30, 0.5)';
const LAST_MOVE_OVERLAY = 'rgba(155, 199, 0, 0.4)';
const CHECK_OVERLAY = 'rgba(220, 20, 20, 0.6)';

export function BoardSquare({
  x,
  y,
  size,
  isLight,
  isSelected,
  isLegalTarget,
  isLastMove,
  isInCheck,
}: BoardSquareProps) {
  const baseColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;

  let overlayColor: string | null = null;
  if (isInCheck) overlayColor = CHECK_OVERLAY;
  else if (isSelected) overlayColor = SELECTED_OVERLAY;
  else if (isLastMove) overlayColor = LAST_MOVE_OVERLAY;

  const dotRadius = size * 0.15;

  return (
    <>
      <Rect x={x} y={y} width={size} height={size} fill={baseColor} />
      {overlayColor && (
        <Rect x={x} y={y} width={size} height={size} fill={overlayColor} />
      )}
      {isLegalTarget && (
        <Circle
          cx={x + size / 2}
          cy={y + size / 2}
          r={dotRadius}
          fill="rgba(20, 85, 30, 0.5)"
        />
      )}
    </>
  );
}
