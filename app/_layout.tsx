import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0d0d1a' },
            headerTintColor: '#e0e0e0',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0d0d1a' },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Bughouse Chess', headerShown: false }} />
          <Stack.Screen name="lobby/index" options={{ title: 'Lobbies' }} />
          <Stack.Screen name="lobby/[lobbyId]" options={{ title: 'Waiting Room' }} />
          <Stack.Screen
            name="game/[gameId]"
            options={{ title: 'Game', headerShown: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
