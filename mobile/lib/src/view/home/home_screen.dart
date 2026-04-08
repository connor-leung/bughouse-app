import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/user/user_preferences.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bughouse Chess'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => context.push('/name-entry'),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (prefs != null) ...[
                Text(
                  'Welcome, ${prefs.displayName}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 32),
              ],
              ElevatedButton.icon(
                icon: const Icon(Icons.sports_esports),
                label: const Text('Browse Lobbies'),
                onPressed: () => context.push('/lobbies'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
