import 'package:flutter/material.dart';
import '../../model/game/game_state.dart';
import '../../model/lobby/lobby.dart';

class GameEndOverlay extends StatelessWidget {
  const GameEndOverlay({
    super.key,
    required this.result,
    required this.myRole,
    required this.onHome,
  });

  final GameResult result;
  final BoardRole myRole;
  final VoidCallback onHome;

  bool get _didWin => myRole.team == result.winningTeam;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final won = _didWin;

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                won ? '🏆 Victory!' : '💀 Defeat',
                style: theme.textTheme.displaySmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                'Team ${result.winningTeam} wins',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _reasonText(result.reason),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                icon: const Icon(Icons.home),
                label: const Text('Back to Home'),
                onPressed: onHome,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _reasonText(GameEndReason reason) {
    return switch (reason) {
      GameEndReason.checkmate => 'by checkmate',
      GameEndReason.timeout => 'on time',
      GameEndReason.resignation => 'by resignation',
    };
  }
}
