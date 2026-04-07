import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Svg from 'react-native-svg';
import { ChessPiece } from './ChessPiece';
import { useGameStore } from '../../store/useGameStore';
import type { BoardSide, Color, PieceSymbol, Reserve } from '../../types/game';

interface ReserveBarProps {
  boardSide: BoardSide;
  color: Color;
  reserve: Reserve;
  isMyTurn: boolean;
  playerName: string;
}

const PIECE_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

export function ReserveBar({
  boardSide,
  color,
  reserve,
  isMyTurn,
  playerName,
}: ReserveBarProps) {
  const selection = useGameStore((s) => s.selection);
  const setSelection = useGameStore((s) => s.setSelection);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const engine = useGameStore((s) => s.engine);

  const handlePieceTap = (piece: PieceSymbol) => {
    if (!isMyTurn || !engine) return;

    const count = reserve[piece] ?? 0;
    if (count <= 0) return;

    // If same piece already selected, deselect
    if (
      selection.boardSide === boardSide &&
      selection.dropPiece === piece
    ) {
      clearSelection();
      return;
    }

    const validSquares = engine.getValidDropSquares(boardSide, piece, color);
    setSelection({
      boardSide,
      square: null,
      dropPiece: piece,
      legalSquares: validSquares,
    });
  };

  const pieceSize = 36;

  return (
    <View style={styles.container}>
      <Text style={styles.playerName} numberOfLines={1}>
        {playerName}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PIECE_ORDER.map((piece) => {
          const count = reserve[piece] ?? 0;
          if (count === 0) return null;

          const isSelected =
            selection.boardSide === boardSide && selection.dropPiece === piece;

          return (
            <TouchableOpacity
              key={piece}
              onPress={() => handlePieceTap(piece)}
              style={[
                styles.pieceButton,
                isSelected && styles.pieceButtonSelected,
                !isMyTurn && styles.pieceButtonDisabled,
              ]}
            >
              <Svg width={pieceSize} height={pieceSize}>
                <ChessPiece
                  type={piece}
                  color={color}
                  x={0}
                  y={0}
                  size={pieceSize}
                  opacity={isMyTurn ? 1 : 0.5}
                />
              </Svg>
              {count > 1 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 48,
  },
  playerName: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    marginRight: 4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pieceButton: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pieceButtonSelected: {
    backgroundColor: 'rgba(20, 180, 60, 0.4)',
    borderWidth: 2,
    borderColor: '#14b43c',
  },
  pieceButtonDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e63946',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
