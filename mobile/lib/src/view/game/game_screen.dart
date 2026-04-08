import 'package:flutter/material.dart';

class GameScreen extends StatelessWidget {
  const GameScreen({super.key, required this.gameId});

  final String gameId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Game $gameId')),
      body: const Center(child: Text('Game screen — coming in Phase 7')),
    );
  }
}
