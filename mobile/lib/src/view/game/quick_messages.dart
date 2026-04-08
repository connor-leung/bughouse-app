import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../model/game/game_socket_service.dart';
import '../../model/lobby/lobby.dart';

const _quickMessages = [
  ('♞ Knight?', 'Send me a knight'),
  ('♝ Bishop?', 'Send me a bishop'),
  ('♜ Rook?', 'Send me a rook'),
  ('♛ Queen?', 'Send me a queen'),
  ('⏳ Wait!', 'Wait!'),
  ('⚡ Go!', 'Go!'),
  ('👍 Nice!', 'Nice move!'),
];

class QuickMessages extends ConsumerWidget {
  const QuickMessages({
    super.key,
    required this.gameId,
    required this.myRole,
  });

  final String gameId;
  final BoardRole myRole;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      scrollDirection: Axis.vertical,
      padding: const EdgeInsets.all(8),
      children: _quickMessages.map((msg) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              minimumSize: const Size(0, 32),
              textStyle: const TextStyle(fontSize: 12),
            ),
            onPressed: () {
              ref.read(gameSocketServiceProvider).sendTeamMessage(gameId, msg.$2);
            },
            child: Text(msg.$1),
          ),
        );
      }).toList(),
    );
  }
}
