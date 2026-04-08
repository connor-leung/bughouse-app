import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';

class PromotionPicker extends StatelessWidget {
  const PromotionPicker({
    super.key,
    required this.color,
    required this.onSelect,
  });

  final Side color;
  final void Function(Role role) onSelect;

  static const _roles = [Role.queen, Role.rook, Role.bishop, Role.knight];

  static const _whiteUnicode = {
    Role.queen: '♕', Role.rook: '♖', Role.bishop: '♗', Role.knight: '♘',
  };
  static const _blackUnicode = {
    Role.queen: '♛', Role.rook: '♜', Role.bishop: '♝', Role.knight: '♞',
  };

  @override
  Widget build(BuildContext context) {
    final map = color == Side.white ? _whiteUnicode : _blackUnicode;

    return AlertDialog(
      title: const Text('Promote to'),
      content: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: _roles.map((role) {
          return GestureDetector(
            onTap: () {
              Navigator.pop(context);
              onSelect(role);
            },
            child: Text(
              map[role] ?? '?',
              style: const TextStyle(fontSize: 48),
            ),
          );
        }).toList(),
      ),
    );
  }
}
