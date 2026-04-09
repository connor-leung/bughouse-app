import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/game/test_game_service.dart';
import '../../model/user/user_preferences.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _startingTest = false;

  Future<void> _startTestGame() async {
    final prefs = ref.read(userPreferencesProvider).valueOrNull;
    if (prefs == null) return;

    setState(() => _startingTest = true);
    try {
      final gameId = await ref.read(testGameServiceProvider).createTestGame(
            userId: prefs.userId,
            displayName: prefs.displayName,
          );
      if (mounted) context.push('/game/$gameId');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not connect to server: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _startingTest = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bughouse Chess'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'Profile',
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (prefs != null) ...[
                Text(
                  'Welcome back,',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
                Text(
                  prefs.displayName,
                  style: theme.textTheme.headlineMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),
              ],
              Center(
                child: Icon(
                  Icons.grid_on,
                  size: 80,
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                ),
              ),
              const SizedBox(height: 48),
              // Test game — prominent, solo play
              ElevatedButton.icon(
                icon: _startingTest
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.smart_toy_outlined),
                label: Text(_startingTest ? 'Starting…' : 'Test Game vs Bots'),
                onPressed: _startingTest ? null : _startTestGame,
              ),
              const SizedBox(height: 24),
              const Row(children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text('or play with others'),
                ),
                Expanded(child: Divider()),
              ]),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('Create Lobby'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.colorScheme.surface,
                  foregroundColor: theme.colorScheme.onSurface,
                ),
                onPressed: () => context.push('/lobbies?create=true'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.list),
                label: const Text('Browse Lobbies'),
                onPressed: () => context.push('/lobbies'),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                icon: const Icon(Icons.bug_report_outlined),
                label: const Text('Debug — Free Play'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: theme.colorScheme.onSurface
                      .withValues(alpha: 0.5),
                  side: BorderSide(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                  ),
                ),
                onPressed: () => context.push('/debug'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
