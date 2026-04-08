import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/lobby/lobby.dart';
import '../../model/lobby/lobby_notifier.dart';
import '../../model/lobby/lobby_socket_service.dart';
import '../../model/user/user_preferences.dart';
import 'widgets/player_slot_tile.dart';

class LobbyRoomScreen extends ConsumerWidget {
  const LobbyRoomScreen({super.key, required this.lobbyId});

  final String lobbyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lobbyAsync = ref.watch(currentLobbyProvider);
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;

    ref.listen(pendingGameProvider, (_, next) {
      if (next != null) {
        ref.read(pendingGameProvider.notifier).clear();
        context.go('/game/${next.gameId}');
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lobby'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            ref.read(lobbySocketServiceProvider).leaveLobby(lobbyId);
            context.pop();
          },
        ),
      ),
      body: lobbyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (lobby) {
          if (lobby == null) {
            return const Center(child: CircularProgressIndicator());
          }
          final isHost = prefs?.userId == lobby.hostUserId;

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Lobby name + time control
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(lobby.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.copyWith(fontWeight: FontWeight.bold)),
                              Text(lobby.timeControl.label,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary)),
                            ],
                          ),
                        ),
                        Text('${lobby.filledSlots}/4',
                            style: Theme.of(context).textTheme.headlineSmall),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Team layout
                _TeamSection(
                  teamName: 'Team A',
                  slots: [
                    (lobby.slots[0], BoardRole.board1White, 'Board 1 · White'),
                    (lobby.slots[3], BoardRole.board2Black, 'Board 2 · Black'),
                  ],
                  color: Colors.lightBlue,
                ),
                const SizedBox(height: 12),
                _TeamSection(
                  teamName: 'Team B',
                  slots: [
                    (lobby.slots[1], BoardRole.board1Black, 'Board 1 · Black'),
                    (lobby.slots[2], BoardRole.board2White, 'Board 2 · White'),
                  ],
                  color: Colors.orange,
                ),
                const Spacer(),
                // Start button (host only)
                if (isHost)
                  ElevatedButton(
                    onPressed: lobby.isFull
                        ? () => ref
                            .read(lobbySocketServiceProvider)
                            .startGame(lobbyId)
                        : null,
                    child: Text(
                        lobby.isFull ? 'Start Game' : 'Waiting for players…'),
                  )
                else
                  Center(
                    child: Text(
                      lobby.isFull
                          ? 'Waiting for host to start…'
                          : 'Waiting for players…',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6)),
                    ),
                  ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TeamSection extends StatelessWidget {
  const _TeamSection({
    required this.teamName,
    required this.slots,
    required this.color,
  });

  final String teamName;
  final List<(PlayerSlot?, BoardRole, String)> slots;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Text(teamName,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  letterSpacing: 1.2)),
        ),
        ...slots.map(
          (entry) => PlayerSlotTile(
            slot: entry.$1,
            role: entry.$2,
            label: entry.$3,
            teamColor: color,
          ),
        ),
      ],
    );
  }
}
