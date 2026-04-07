import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../src/store/usePlayerStore';

export default function HomeScreen() {
  const { name, setName } = usePlayerStore();
  const [input, setInput] = useState(name);
  const [error, setError] = useState('');

  const handleEnter = () => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or less.');
      return;
    }
    setName(trimmed);
    router.replace('/lobby');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>♟ Bughouse Chess</Text>
          <Text style={styles.subtitle}>
            4-player team chess on two boards
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(t) => {
                setInput(t);
                setError('');
              }}
              placeholder="Enter your name"
              placeholderTextColor="#555"
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleEnter}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleEnter}>
            <Text style={styles.buttonText}>Enter Lobby →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d0d1a' },
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#f0f0f0',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#7070a0',
    fontSize: 15,
    marginBottom: 48,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    color: '#a0a0c0',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e5e',
    color: '#f0f0f0',
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    color: '#e63946',
    fontSize: 13,
    marginTop: 6,
  },
  button: {
    backgroundColor: '#14b43c',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
