import 'package:flutter/material.dart';

class LobbyRoomScreen extends StatelessWidget {
  const LobbyRoomScreen({super.key, required this.lobbyId});

  final String lobbyId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Lobby $lobbyId')),
      body: const Center(child: Text('Lobby room — coming in Phase 6')),
    );
  }
}
