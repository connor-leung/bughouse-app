import 'package:flutter/material.dart';
import '../../../model/lobby/lobby.dart';

class LobbyCard extends StatelessWidget {
  const LobbyCard({super.key, required this.lobby, required this.onTap});

  final Lobby lobby;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filled = lobby.filledSlots;

    return Card(
      child: InkWell(
        onTap: lobby.isFull ? null : onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(lobby.name,
                        style: theme.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      lobby.timeControl.label,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              // Player slots indicator
              Row(
                children: List.generate(4, (i) {
                  final taken = i < filled;
                  return Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Icon(
                      Icons.person,
                      size: 18,
                      color: taken
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface.withValues(alpha: 0.2),
                    ),
                  );
                }),
              ),
              const SizedBox(width: 12),
              Text(
                '$filled/4',
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
