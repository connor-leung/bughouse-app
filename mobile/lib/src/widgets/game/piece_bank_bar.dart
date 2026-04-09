import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import '../../model/game/game_state.dart';
import '../board/piece_painter.dart';

class PieceBankBar extends StatelessWidget {
  const PieceBankBar({
    super.key,
    required this.bank,
    required this.color,
    required this.selectedRole,
    required this.onTap,
    this.enabled = true,
  });

  final PieceBank bank;
  final Side color; // whose bank this is (for Unicode display)
  final Role? selectedRole;
  final void Function(Role role) onTap;
  final bool enabled;

  static const _roles = [Role.pawn, Role.knight, Role.bishop, Role.rook, Role.queen];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final available = bank.available;

    if (available.isEmpty) {
      return SizedBox(
        height: 48,
        child: Center(
          child: Text(
            'No pieces in hand',
            style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
          ),
        ),
      );
    }

    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        children: _roles
            .where((r) => bank.count(r) > 0)
            .map((role) {
              final count = bank.count(role);
              final isSelected = selectedRole == role;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: GestureDetector(
                  onTap: enabled ? () => onTap(role) : null,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? theme.colorScheme.primary.withValues(alpha: 0.3)
                          : theme.colorScheme.surface,
                      border: Border.all(
                        color: isSelected
                            ? theme.colorScheme.primary
                            : Colors.transparent,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        PieceIcon(role: role, color: color, size: 32),
                        if (count > 1) ...[
                          const SizedBox(width: 2),
                          Text(
                            '×$count',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurface
                                  .withValues(alpha: 0.7),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            })
            .toList(),
      ),
    );
  }
}
