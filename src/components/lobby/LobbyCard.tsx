import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Lobby } from '../../types/lobby';

interface LobbyCardProps {
  lobby: Lobby;
  onPress: () => void;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

export function LobbyCard({ lobby, onPress }: LobbyCardProps) {
  const playerCount = lobby.players.length;
  const isFull = playerCount >= 4;

  return (
    <TouchableOpacity
      style={[styles.card, isFull && styles.cardFull]}
      onPress={onPress}
      disabled={isFull}
    >
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {lobby.name}
        </Text>
        <Text style={styles.time}>{formatTime(lobby.timeControlSeconds)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.players}>
          {playerCount}/4 players
        </Text>
        <View style={styles.seatRow}>
          {['A_white', 'A_black', 'B_white', 'B_black'].map((seat) => {
            const filled = lobby.players.some((p) => p.seat === seat);
            return (
              <View
                key={seat}
                style={[styles.seatDot, filled ? styles.seatFilled : styles.seatEmpty]}
              />
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2e2e4e',
  },
  cardFull: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    color: '#a0a0c0',
    fontSize: 14,
    marginLeft: 8,
  },
  players: {
    color: '#a0a0c0',
    fontSize: 13,
  },
  seatRow: {
    flexDirection: 'row',
    gap: 4,
  },
  seatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  seatFilled: {
    backgroundColor: '#14b43c',
  },
  seatEmpty: {
    backgroundColor: '#3e3e5e',
  },
});
