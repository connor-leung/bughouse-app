import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LobbyCard } from '../../src/components/lobby/LobbyCard';
import { useLobbyStore } from '../../src/store/useLobbyStore';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { supabase } from '../../src/lib/supabase';
import type { Lobby, LobbyPlayer } from '../../src/types/lobby';

const TIME_CONTROLS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
];

export default function LobbyListScreen() {
  const { id: playerId, name: playerName } = usePlayerStore();
  const { lobbies, isLoading, fetchLobbies, createLobby, updateLobby, updateLobbyPlayers } =
    useLobbyStore();

  const [showCreate, setShowCreate] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [selectedTime, setSelectedTime] = useState(180);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLobbies();

    // Subscribe to real-time lobby list changes
    const lobbySub = supabase
      .channel('public:lobbies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobbies' },
        () => fetchLobbies(),
      )
      .subscribe();

    const playerSub = supabase
      .channel('public:lobby_players')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby_players' },
        async (payload: any) => {
          // Refresh players for the affected lobby
          const lobbyId =
            payload.new?.lobby_id ?? payload.old?.lobby_id;
          if (!lobbyId) return;
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

    return () => {
      supabase.removeChannel(lobbySub);
      supabase.removeChannel(playerSub);
    };
  }, []);

  const handleCreate = async () => {
    const name = lobbyName.trim() || `${playerName}'s Game`;
    setCreating(true);
    const lobbyId = await createLobby({
      name,
      timeControlSeconds: selectedTime,
      hostId: playerId,
      hostName: playerName,
    });
    setCreating(false);
    setShowCreate(false);
    setLobbyName('');

    if (lobbyId) {
      router.push(`/lobby/${lobbyId}`);
    } else {
      Alert.alert('Error', 'Failed to create lobby. Check your connection.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Open Lobbies</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#14b43c" style={{ marginTop: 40 }} />
        ) : lobbies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No open lobbies.</Text>
            <Text style={styles.emptySubtext}>Create one to start playing!</Text>
          </View>
        ) : (
          <FlatList
            data={lobbies}
            keyExtractor={(l) => l.id}
            renderItem={({ item }) => (
              <LobbyCard
                lobby={item}
                onPress={() => router.push(`/lobby/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      {/* Create Lobby Modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Lobby</Text>

            <Text style={styles.fieldLabel}>Lobby name (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={lobbyName}
              onChangeText={setLobbyName}
              placeholder={`${playerName}'s Game`}
              placeholderTextColor="#555"
              maxLength={30}
            />

            <Text style={styles.fieldLabel}>Time control</Text>
            <View style={styles.timeRow}>
              {TIME_CONTROLS.map((tc) => (
                <TouchableOpacity
                  key={tc.seconds}
                  style={[
                    styles.timeBtn,
                    selectedTime === tc.seconds && styles.timeBtnSelected,
                  ]}
                  onPress={() => setSelectedTime(tc.seconds)}
                >
                  <Text
                    style={[
                      styles.timeBtnText,
                      selectedTime === tc.seconds && styles.timeBtnTextSelected,
                    ]}
                  >
                    {tc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: { color: '#f0f0f0', fontSize: 22, fontWeight: '700' },
  createBtn: {
    backgroundColor: '#14b43c',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { paddingBottom: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: '#a0a0c0', fontSize: 17, fontWeight: '600' },
  emptySubtext: { color: '#606080', fontSize: 14, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { color: '#f0f0f0', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  fieldLabel: { color: '#a0a0c0', fontSize: 13, marginBottom: 6, marginTop: 16 },
  textInput: {
    backgroundColor: '#0d0d1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e2e5e',
    color: '#f0f0f0',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  timeBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0d0d1a',
    borderWidth: 1,
    borderColor: '#2e2e5e',
  },
  timeBtnSelected: { backgroundColor: '#14b43c', borderColor: '#14b43c' },
  timeBtnText: { color: '#a0a0c0', fontWeight: '600' },
  timeBtnTextSelected: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
  },
  cancelBtnText: { color: '#a0a0c0', fontWeight: '600', fontSize: 16 },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#14b43c',
  },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
