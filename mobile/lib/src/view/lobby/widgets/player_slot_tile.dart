import 'package:flutter/material.dart';
import '../../../model/lobby/lobby.dart';

class PlayerSlotTile extends StatelessWidget {
  const PlayerSlotTile({
    super.key,
    required this.slot,
    required this.role,
    required this.label,
    required this.teamColor,
  });

  final PlayerSlot? slot;
  final BoardRole role;
  final String label;
  final Color teamColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filled = slot != null;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor:
                  filled ? teamColor.withValues(alpha: 0.2) : theme.colorScheme.surface,
              child: Icon(
                filled ? Icons.person : Icons.person_outline,
                color: filled
                    ? teamColor
                    : theme.colorScheme.onSurface.withValues(alpha: 0.3),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    filled ? slot!.displayName : 'Waiting…',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight:
                          filled ? FontWeight.w600 : FontWeight.normal,
                      color: filled
                          ? null
                          : theme.colorScheme.onSurface.withValues(alpha: 0.4),
                    ),
                  ),
                  Text(
                    label,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color:
                          theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
