import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../../src/components/board/ChessBoard';
import { ReserveBar } from '../../src/components/board/ReserveBar';
import { ChessClock } from '../../src/components/board/ChessClock';
import { useGameStore } from '../../src/store/useGameStore';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { useGame } from '../../src/hooks/useGame';
import { useClock } from '../../src/hooks/useClock';
import type { BoardSide, Color, PieceSymbol } from '../../src/types/game';

export default function GameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const { id: myId } = usePlayerStore();
  const game = useGameStore((s) => s.game);
  const clocksMs = useGameStore((s) => s.clocksMs);
  const { sendMove, sendResign } = useGame(gameId, myId);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Determine my seat
  const mySeat = useMemo(() => {
    if (!game) return null;
    const { players } = game;
    if (players.boardA.white.playerId === myId) return { side: 'A' as BoardSide, color: 'w' as Color };
    if (players.boardA.black.playerId === myId) return { side: 'A' as BoardSide, color: 'b' as Color };
    if (players.boardB.white.playerId === myId) return { side: 'B' as BoardSide, color: 'w' as Color };
    if (players.boardB.black.playerId === myId) return { side: 'B' as BoardSide, color: 'b' as Color };
    return null; // spectator
  }, [game, myId]);

  // Determine active player per board
  const activePlayerIdA = useMemo(() => {
    if (!game || game.status !== 'active') return null;
    return game.boardA.turn === 'w'
      ? game.players.boardA.white.playerId
      : game.players.boardA.black.playerId;
  }, [game?.boardA.turn, game?.status]);

  const activePlayerIdB = useMemo(() => {
    if (!game || game.status !== 'active') return null;
    return game.boardB.turn === 'w'
      ? game.players.boardB.white.playerId
      : game.players.boardB.black.playerId;
  }, [game?.boardB.turn, game?.status]);

  const activeClockId = mySeat
    ? mySeat.side === 'A'
      ? activePlayerIdA
      : activePlayerIdB
    : null;

  const moveSeqRef = useRef(
    game ? game.moveHistory.length : 0,
  );

  const handleClockExpire = useCallback(
    (playerId: string) => {
      if (playerId === myId && game && mySeat) {
        sendResign(mySeat.side, mySeat.color);
      }
    },
    [myId, game, mySeat, sendResign],
  );

  useClock(activeClockId, handleClockExpire);

  const getNextSeq = () => {
    moveSeqRef.current += 1;
    return moveSeqRef.current;
  };

  const handleMove = useCallback(
    async (boardSide: BoardSide, from: string, to: string, promotion?: PieceSymbol) => {
      if (!mySeat || mySeat.side !== boardSide) return;
      await sendMove({
        type: 'regular',
        boardSide,
        from,
        to,
        promotion,
        playerId: myId,
        timestamp: Date.now(),
        seq: getNextSeq(),
      });
    },
    [mySeat, myId, sendMove],
  );

  const handleDrop = useCallback(
    async (boardSide: BoardSide, piece: PieceSymbol, to: string) => {
      if (!mySeat || mySeat.side !== boardSide) return;
      await sendMove({
        type: 'drop',
        boardSide,
        piece,
        to,
        playerId: myId,
        timestamp: Date.now(),
        seq: getNextSeq(),
      });
    },
    [mySeat, myId, sendMove],
  );

  const handleResign = () => {
    if (!mySeat) return;
    Alert.alert(
      'Resign',
      'Are you sure you want to resign? This ends the game for your team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resign',
          style: 'destructive',
          onPress: () => sendResign(mySeat.side, mySeat.color),
        },
      ],
    );
  };

  if (!game) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const { players, boardA, boardB } = game;

  const boardSize = isLandscape
    ? Math.min(width / 2 - 48, height - 120)
    : Math.min(width - 32, (height - 200) / 2);

  const isMyTurnA = mySeat?.side === 'A' && boardA.turn === mySeat?.color;
  const isMyTurnB = mySeat?.side === 'B' && boardB.turn === mySeat?.color;

  const lastMoveA = game.moveHistory
    .filter((m) => m.boardSide === 'A' && m.type === 'regular')
    .slice(-1)[0] as any;
  const lastMoveB = game.moveHistory
    .filter((m) => m.boardSide === 'B' && m.type === 'regular')
    .slice(-1)[0] as any;

  const renderBoard = (side: BoardSide) => {
    const board = side === 'A' ? boardA : boardB;
    const boardPlayers = side === 'A' ? players.boardA : players.boardB;
    const isMyBoard = mySeat?.side === side;
    const myColor = isMyBoard ? mySeat!.color : 'w';
    const isMyTurn = side === 'A' ? isMyTurnA : isMyTurnB;
    const lastMove = side === 'A' ? lastMoveA : lastMoveB;
    const activePlayerId = side === 'A' ? activePlayerIdA : activePlayerIdB;

    const topPlayer = myColor === 'w' ? boardPlayers.black : boardPlayers.white;
    const bottomPlayer = myColor === 'w' ? boardPlayers.white : boardPlayers.black;
    const topColor: Color = myColor === 'w' ? 'b' : 'w';
    const bottomColor: Color = myColor;

    return (
      <View key={side} style={styles.boardSection}>
        {/* Top player info */}
        <View style={styles.playerRow}>
          <ChessClock
            remainingMs={clocksMs[topPlayer.playerId] ?? 0}
            isActive={activePlayerId === topPlayer.playerId}
            playerName={topPlayer.playerName}
          />
          <ReserveBar
            boardSide={side}
            color={topColor}
            reserve={topColor === 'w' ? board.reserveWhite : board.reserveBlack}
            isMyTurn={false}
            playerName={topPlayer.playerName}
          />
        </View>

        {/* Chess board */}
        <ChessBoard
          side={side}
          size={boardSize}
          perspective={myColor}
          myColor={myColor}
          isMyTurn={isMyTurn}
          onMove={(from, to, promotion) => handleMove(side, from, to, promotion)}
          onDrop={(piece, to) => handleDrop(side, piece, to)}
          lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
          inCheckSquare={null}
        />

        {/* Bottom player info */}
        <View style={styles.playerRow}>
          <ChessClock
            remainingMs={clocksMs[bottomPlayer.playerId] ?? 0}
            isActive={activePlayerId === bottomPlayer.playerId}
            playerName={bottomPlayer.playerName}
          />
          <ReserveBar
            boardSide={side}
            color={bottomColor}
            reserve={bottomColor === 'w' ? board.reserveWhite : board.reserveBlack}
            isMyTurn={isMyTurn}
            playerName={bottomPlayer.playerName}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, isLandscape ? styles.landscape : styles.portrait]}>
        {renderBoard('A')}
        <View style={styles.divider} />
        {renderBoard('B')}
      </View>

      {/* Footer controls */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.resignBtn} onPress={handleResign}>
          <Text style={styles.resignBtnText}>Resign</Text>
        </TouchableOpacity>
      </View>

      {/* Game over overlay */}
      {game.status === 'finished' && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>
                {game.winnerTeam === null ? 'Draw' : `Team ${game.winnerTeam} Wins!`}
              </Text>
              <Text style={styles.overlaySubtitle}>
                {game.boardA.termination === 'checkmate' || game.boardB.termination === 'checkmate'
                  ? 'by Checkmate'
                  : game.boardA.termination === 'timeout' || game.boardB.termination === 'timeout'
                  ? 'on Time'
                  : 'by Resignation'}
              </Text>

              <TouchableOpacity
                style={styles.overlayBtn}
                onPress={() => router.replace('/lobby')}
              >
                <Text style={styles.overlayBtnText}>Back to Lobby</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d1a' },
  loadingText: { color: '#a0a0c0', fontSize: 16 },
  container: { flex: 1 },
  portrait: { flexDirection: 'column' },
  landscape: { flexDirection: 'row' },
  boardSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  divider: {
    backgroundColor: '#2a2a4a',
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resignBtn: {
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#4a2a2a',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  resignBtnText: { color: '#e63946', fontWeight: '600', fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 260,
    borderWidth: 1,
    borderColor: '#2e2e5e',
  },
  overlayTitle: {
    color: '#f0f0f0',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  overlaySubtitle: {
    color: '#a0a0c0',
    fontSize: 16,
    marginBottom: 32,
  },
  overlayBtn: {
    backgroundColor: '#14b43c',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  overlayBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
