import 'package:flutter/material.dart';

class ChessClock extends StatelessWidget {
  const ChessClock({
    super.key,
    required this.remainingMs,
    required this.isActive,
  });

  final int remainingMs;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final seconds = remainingMs ~/ 1000;
    final isLow = seconds < 10;

    final String display;
    if (seconds >= 60) {
      final m = seconds ~/ 60;
      final s = seconds % 60;
      display = '$m:${s.toString().padLeft(2, '0')}';
    } else {
      final s = seconds;
      final tenths = (remainingMs % 1000) ~/ 100;
      display = '$s.$tenths';
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isActive
            ? (isLow ? Colors.red.shade800 : theme.colorScheme.primary)
            : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        display,
        style: theme.textTheme.titleLarge?.copyWith(
          fontFamily: 'monospace',
          fontWeight: FontWeight.bold,
          color: isActive
              ? Colors.white
              : theme.colorScheme.onSurface.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
