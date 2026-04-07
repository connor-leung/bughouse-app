import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChessClockProps {
  remainingMs: number;
  isActive: boolean;
  playerName: string;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ChessClock({ remainingMs, isActive, playerName }: ChessClockProps) {
  const isLow = remainingMs > 0 && remainingMs < 10_000; // < 10 seconds
  const isDead = remainingMs <= 0;

  return (
    <View style={[styles.container, isActive && styles.active]}>
      <Text style={styles.name} numberOfLines={1}>
        {playerName}
      </Text>
      <Text
        style={[
          styles.time,
          isLow && styles.timeLow,
          isDead && styles.timeDead,
        ]}
      >
        {formatTime(remainingMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    minWidth: 80,
  },
  active: {
    backgroundColor: 'rgba(20, 180, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#14b43c',
  },
  name: {
    color: '#aaa',
    fontSize: 11,
    marginBottom: 2,
  },
  time: {
    color: '#f0f0f0',
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  timeLow: {
    color: '#f4a261',
  },
  timeDead: {
    color: '#e63946',
  },
});
