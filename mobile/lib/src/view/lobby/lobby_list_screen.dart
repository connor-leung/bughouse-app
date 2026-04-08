import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/lobby/lobby.dart';
import '../../model/lobby/lobby_notifier.dart';
import '../../model/lobby/lobby_socket_service.dart';
import '../../model/user/user_preferences.dart';
import 'widgets/lobby_card.dart';
import 'create_lobby_sheet.dart';

class LobbyListScreen extends ConsumerWidget {
  const LobbyListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lobbiesAsync = ref.watch(lobbyListProvider);

    // Navigate to game when server fires game:starting
    ref.listen(pendingGameProvider, (_, next) {
      if (next != null) {
        ref.read(pendingGameProvider.notifier).clear();
        context.go('/game/${next.gameId}');
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lobbies'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(lobbySocketServiceProvider).requestList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('Create'),
        onPressed: () => _showCreateSheet(context, ref),
      ),
      body: lobbiesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (lobbies) {
          final open = lobbies
              .where((l) => l.status == LobbyStatus.waiting)
              .toList();
          if (open.isEmpty) {
            return const Center(
              child: Text('No open lobbies — create one!'),
            );
          }
          return RefreshIndicator(
            onRefresh: () async =>
                ref.read(lobbySocketServiceProvider).requestList(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: open.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) {
                return LobbyCard(
                  lobby: open[i],
                  onTap: () => _joinLobby(context, ref, open[i]),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const CreateLobbySheet(),
    );
  }

  Future<void> _joinLobby(
      BuildContext context, WidgetRef ref, Lobby lobby) async {
    final prefs = ref.read(userPreferencesProvider).valueOrNull;
    if (prefs == null) return;

    // Find first empty slot
    final slotIdx = lobby.slots.indexWhere((s) => s == null);
    if (slotIdx == -1) return;

    // Set lobby immediately so the room screen has data before the server echoes back
    ref.read(currentLobbyProvider.notifier).set(lobby);
    ref.read(lobbySocketServiceProvider).joinLobby(lobby.id, slotIndex: slotIdx);
    context.push('/lobby/${lobby.id}');
  }
}
