import 'package:flutter/material.dart';

class LobbyListScreen extends StatelessWidget {
  const LobbyListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lobbies')),
      body: const Center(child: Text('Lobby list — coming in Phase 6')),
    );
  }
}
