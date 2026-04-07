import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayerSlot } from '../../src/components/lobby/PlayerSlot';
import { useLobbyStore } from '../../src/store/useLobbyStore';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { useGameStore } from '../../src/store/useGameStore';
import { supabase } from '../../src/lib/supabase';
import { createInitialBoardState } from '../../src/engine/BughouseEngine';
import type { SeatId, LobbyPlayer, Lobby } from '../../src/types/lobby';
import type { GameState } from '../../src/types/game';

const ALL_SEATS: SeatId[] = ['A_white', 'A_black', 'B_white', 'B_black'];

export default function LobbyWaitingScreen() {
  const { lobbyId } = useLocalSearchParams<{ lobbyId: string }>();
  const { id: myId, name: myName } = usePlayerStore();
  const { currentLobby, setCurrentLobby, updateLobbyPlayers, joinLobby, leaveLobby } =
    useLobbyStore();
  const { initGame } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Load lobby on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: lobbyData } = await supabase
        .from('lobbies')
        .select('*')
        .eq('id', lobbyId)
        .single();

      const { data: playersData } = await supabase
        .from('lobby_players')
        .select('*')
        .eq('lobby_id', lobbyId);

      if (lobbyData) {
        const players: LobbyPlayer[] = (playersData ?? []).map((p: any) => ({
          id: p.id,
          lobbyId: p.lobby_id,
          playerId: p.player_id,
          playerName: p.player_name,
          seat: p.seat,
          joinedAt: p.joined_at,
        }));
        const lobby: Lobby = {
          id: lobbyData.id,
          name: lobbyData.name,
          hostId: lobbyData.host_id,
          status: lobbyData.status,
          timeControlSeconds: lobbyData.time_control_seconds,
          createdAt: lobbyData.created_at,
          gameId: lobbyData.game_id ?? null,
          players,
        };
        setCurrentLobby(lobby);
      }
      setLoading(false);
    }
    load();

    // Subscribe to player changes for this lobby
    const playerSub = supabase
      .channel(`lobby_players:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobby_players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async () => {
          const { data } = await supabase
            .from('lobby_players')
            .select('*')
            .eq('lobby_id', lobbyId);
          if (data) {
            const players: LobbyPlayer[] = data.map((p: any) => ({
              id: p.id,
              lobbyId: p.lobby_id,
              playerId: p.player_id,
              playerName: p.player_name,
              seat: p.seat,
              joinedAt: p.joined_at,
            }));
            updateLobbyPlayers(lobbyId, players);
          }
        },
      )
      .subscribe();

    // Subscribe to lobby status changes (game start)
    const lobbySub = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`,
        },
        async (payload: any) => {
          const updatedLobby = payload.new;
          if (updatedLobby.status === 'in_game' && updatedLobby.game_id) {
            await navigateToGame(updatedLobby.game_id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(playerSub);
      supabase.removeChannel(lobbySub);
    };
  }, [lobbyId]);

  const navigateToGame = async (gameId: string) => {
    const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (!data || !currentLobby) return;

    const game: GameState = {
      gameId: data.id,
      lobbyId,
      boardA: data.board_a,
      boardB: data.board_b,
      players: {
        boardA: {
          white: { playerId: getPlayerIdForSeat('A_white'), playerName: getPlayerNameForSeat('A_white') },
          black: { playerId: getPlayerIdForSeat('A_black'), playerName: getPlayerNameForSeat('A_black') },
        },
        boardB: {
          white: { playerId: getPlayerIdForSeat('B_white'), playerName: getPlayerNameForSeat('B_white') },
          black: { playerId: getPlayerIdForSeat('B_black'), playerName: getPlayerNameForSeat('B_black') },
        },
      },
      clocks: data.clocks,
      status: 'active',
      startedAt: new Date(data.started_at).getTime(),
      finishedAt: null,
      moveHistory: data.move_history ?? [],
      winnerTeam: null,
    };

    initGame(game);
    router.replace(`/game/${gameId}`);
  };

  const getPlayerIdForSeat = (seat: SeatId): string => {
    return currentLobby?.players.find((p) => p.seat === seat)?.playerId ?? '';
  };

  const getPlayerNameForSeat = (seat: SeatId): string => {
    return currentLobby?.players.find((p) => p.seat === seat)?.playerName ?? '';
  };

  const handleJoinSeat = async (seat: SeatId) => {
    const success = await joinLobby(lobbyId, myId, myName, seat);
    if (!success) {
      Alert.alert('Error', 'Could not join that seat. It may have just been taken.');
    }
  };

  const handleLeave = async () => {
    await leaveLobby(lobbyId, myId);
    router.back();
  };

  const handleStartGame = async () => {
    if (!currentLobby) return;
    setStarting(true);

    const timeMs = currentLobby.timeControlSeconds * 1000;
    const aWhite = getPlayerIdForSeat('A_white');
    const aBlack = getPlayerIdForSeat('A_black');
    const bWhite = getPlayerIdForSeat('B_white');
    const bBlack = getPlayerIdForSeat('B_black');

    const initialBoardState = createInitialBoardState();

    const clocks = {
      [aWhite]: timeMs,
      [aBlack]: timeMs,
      [bWhite]: timeMs,
      [bBlack]: timeMs,
      lastSyncAt: Date.now(),
    };

    const { data: gameData, error } = await supabase
      .from('games')
      .insert({
        lobby_id: lobbyId,
        status: 'active',
        board_a: initialBoardState,
        board_b: initialBoardState,
        clocks,
        move_history: [],
      })
      .select()
      .single();

    if (error || !gameData) {
      setStarting(false);
      Alert.alert('Error', 'Failed to start game.');
      return;
    }

    // Update lobby to in_game and attach gameId
    await supabase
      .from('lobbies')
      .update({ status: 'in_game', game_id: gameData.id })
      .eq('id', lobbyId);

    setStarting(false);
  };

  if (loading || !currentLobby) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#14b43c" size="large" />
      </View>
    );
  }

  const myPlayer = currentLobby.players.find((p) => p.playerId === myId);
  const iAmHost = currentLobby.hostId === myId;
  const allSeatedCount = currentLobby.players.length;
  const canStart = iAmHost && allSeatedCount === 4;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.lobbyName}>{currentLobby.name}</Text>
        <Text style={styles.subtitle}>
          {Math.floor(currentLobby.timeControlSeconds / 60)}m per player
          {iAmHost ? ' · You are the host' : ''}
        </Text>

        <Text style={styles.sectionTitle}>Board A</Text>
        <PlayerSlot
          seat="A_white"
          player={currentLobby.players.find((p) => p.seat === 'A_white')}
          isMe={myPlayer?.seat === 'A_white'}
          canJoin={!myPlayer}
          onJoin={handleJoinSeat}
        />
        <PlayerSlot
          seat="A_black"
          player={currentLobby.players.find((p) => p.seat === 'A_black')}
          isMe={myPlayer?.seat === 'A_black'}
          canJoin={!myPlayer}
          onJoin={handleJoinSeat}
        />

        <Text style={styles.sectionTitle}>Board B</Text>
        <PlayerSlot
          seat="B_white"
          player={currentLobby.players.find((p) => p.seat === 'B_white')}
          isMe={myPlayer?.seat === 'B_white'}
          canJoin={!myPlayer}
          onJoin={handleJoinSeat}
        />
        <PlayerSlot
          seat="B_black"
          player={currentLobby.players.find((p) => p.seat === 'B_black')}
          isMe={myPlayer?.seat === 'B_black'}
          canJoin={!myPlayer}
          onJoin={handleJoinSeat}
        />

        <Text style={styles.teamNote}>
          Team A: Board A White + Board B Black{'\n'}
          Team B: Board A Black + Board B White
        </Text>

        <View style={styles.actions}>
          {canStart ? (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleStartGame}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startBtnText}>Start Game</Text>
              )}
            </TouchableOpacity>
          ) : iAmHost ? (
            <Text style={styles.waitingText}>
              Waiting for {4 - allSeatedCount} more player{4 - allSeatedCount !== 1 ? 's' : ''}...
            </Text>
          ) : null}

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Text style={styles.leaveBtnText}>Leave Lobby</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0d1a' },
  container: { padding: 16, paddingBottom: 40 },
  lobbyName: { color: '#f0f0f0', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#7070a0', fontSize: 14, marginBottom: 24 },
  sectionTitle: {
    color: '#a0a0c0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  teamNote: {
    color: '#505070',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  actions: { marginTop: 32, gap: 12 },
  startBtn: {
    backgroundColor: '#14b43c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  waitingText: { color: '#7070a0', textAlign: 'center', fontSize: 15 },
  leaveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#4a2a2a',
  },
  leaveBtnText: { color: '#e63946', fontSize: 15, fontWeight: '600' },
});
