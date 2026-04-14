import 'dart:async';

import 'package:flutter/material.dart';

class ChessClock extends StatefulWidget {
  const ChessClock({
    super.key,
    required this.remainingMs,
    required this.isActive,
  });

  final int remainingMs;
  final bool isActive;

  @override
  State<ChessClock> createState() => _ChessClockState();
}

class _ChessClockState extends State<ChessClock> {
  late int _remainingMs;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingMs = widget.remainingMs;
    _startOrStopTimer();
  }

  @override
  void didUpdateWidget(ChessClock old) {
    super.didUpdateWidget(old);
    // Sync from server whenever the authoritative value changes
    if (widget.remainingMs != old.remainingMs) {
      _remainingMs = widget.remainingMs;
    }
    if (widget.isActive != old.isActive) {
      _startOrStopTimer();
    }
  }

  void _startOrStopTimer() {
    _timer?.cancel();
    if (widget.isActive) {
      _timer = Timer.periodic(const Duration(milliseconds: 100), (_) {
        if (!mounted) return;
        setState(() {
          _remainingMs = (_remainingMs - 100).clamp(0, _remainingMs);
        });
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final seconds = _remainingMs ~/ 1000;
    final isLow = seconds < 10;

    final String display;
    if (seconds >= 60) {
      final m = seconds ~/ 60;
      final s = seconds % 60;
      display = '$m:${s.toString().padLeft(2, '0')}';
    } else {
      final tenths = (_remainingMs % 1000) ~/ 100;
      display = '$seconds.$tenths';
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: widget.isActive
            ? (isLow ? Colors.red.shade800 : theme.colorScheme.primary)
            : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        display,
        style: theme.textTheme.titleLarge?.copyWith(
          fontFamily: 'monospace',
          fontWeight: FontWeight.bold,
          color: widget.isActive
              ? Colors.white
              : theme.colorScheme.onSurface.withValues(alpha: 0.5),
        ),
      ),
    );
  }
}
