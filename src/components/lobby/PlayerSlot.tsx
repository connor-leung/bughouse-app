import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { LobbyPlayer, SeatId } from '../../types/lobby';

interface PlayerSlotProps {
  seat: SeatId;
  player: LobbyPlayer | undefined;
  isMe: boolean;
  canJoin: boolean;
  onJoin: (seat: SeatId) => void;
}

const SEAT_LABELS: Record<SeatId, string> = {
  A_white: 'Board A — White',
  A_black: 'Board A — Black',
  B_white: 'Board B — White',
  B_black: 'Board B — Black',
};

const TEAM_LABELS: Record<SeatId, string> = {
  A_white: 'Team A',
  A_black: 'Team B',
  B_white: 'Team B',
  B_black: 'Team A',
};

export function PlayerSlot({ seat, player, isMe, canJoin, onJoin }: PlayerSlotProps) {
  return (
    <TouchableOpacity
      style={[
        styles.slot,
        player ? styles.slotFilled : styles.slotEmpty,
        isMe && styles.slotMe,
      ]}
      onPress={() => !player && canJoin && onJoin(seat)}
      disabled={!!player || !canJoin}
    >
      <Text style={styles.seatLabel}>{SEAT_LABELS[seat]}</Text>
      <View style={styles.row}>
        <Text style={styles.teamLabel}>{TEAM_LABELS[seat]}</Text>
        {player ? (
          <Text style={styles.playerName}>
            {player.playerName} {isMe ? '(you)' : ''}
          </Text>
        ) : (
          <Text style={styles.empty}>{canJoin ? 'Tap to join' : 'Empty'}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  slotFilled: {
    backgroundColor: '#1a2a1a',
    borderColor: '#2a4a2a',
  },
  slotEmpty: {
    backgroundColor: '#1e1e2e',
    borderColor: '#2e2e4e',
    borderStyle: 'dashed',
  },
  slotMe: {
    borderColor: '#14b43c',
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  seatLabel: {
    color: '#a0a0c0',
    fontSize: 12,
    fontWeight: '500',
  },
  teamLabel: {
    color: '#6060a0',
    fontSize: 12,
  },
  playerName: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    color: '#505070',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
