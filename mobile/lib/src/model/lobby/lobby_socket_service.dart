import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'lobby.dart';

// ---------------------------------------------------------------------------
// Server events (inbound)
// ---------------------------------------------------------------------------

sealed class LobbyServerEvent {}

class LobbyListEvent extends LobbyServerEvent {
  LobbyListEvent(this.lobbies);
  final List<Lobby> lobbies;
}

class LobbyUpdatedEvent extends LobbyServerEvent {
  LobbyUpdatedEvent(this.lobby);
  final Lobby lobby;
}

class LobbyCreatedEvent extends LobbyServerEvent {
  LobbyCreatedEvent(this.lobby);
  final Lobby lobby;
}

class GameStartingEvent extends LobbyServerEvent {
  GameStartingEvent({required this.gameId, required this.role});
  final String gameId;
  final BoardRole role;
}

class LobbyErrorEvent extends LobbyServerEvent {
  LobbyErrorEvent(this.message);
  final String message;
}

// ---------------------------------------------------------------------------
// Lobby WebSocket service
// ---------------------------------------------------------------------------

final lobbySocketServiceProvider = Provider<LobbySocketService>((ref) {
  final service = LobbySocketService();
  ref.onDispose(service.dispose);
  return service;
});

class LobbySocketService {
  WebSocketChannel? _channel;
  final _controller = StreamController<LobbyServerEvent>.broadcast();

  Stream<LobbyServerEvent> get events => _controller.stream;

  void connect(String serverUrl, String userId) {
    final uri = Uri.parse('$serverUrl/lobby?userId=$userId');
    _channel = WebSocketChannel.connect(uri);
    _channel!.stream.listen(
      _onMessage,
      onError: (e) => _controller.add(LobbyErrorEvent(e.toString())),
      onDone: () {},
    );
    requestList();
  }

  void _onMessage(dynamic raw) {
    final json = jsonDecode(raw as String) as Map<String, dynamic>;
    final type = json['type'] as String;
    final data = json['data'];

    final event = switch (type) {
      'lobby:list' => LobbyListEvent(
          (data as List).map((l) => Lobby.fromJson(l as Map<String, dynamic>)).toList(),
        ),
      'lobby:updated' => LobbyUpdatedEvent(Lobby.fromJson(data as Map<String, dynamic>)),
      'lobby:created' => LobbyCreatedEvent(Lobby.fromJson(data as Map<String, dynamic>)),
      'game:starting' => GameStartingEvent(
          gameId: (data as Map<String, dynamic>)['gameId'] as String,
          role: BoardRole.values.firstWhere((r) => r.name == data['role']),
        ),
      'lobby:error' => LobbyErrorEvent((data as Map<String, dynamic>)['message'] as String),
      _ => null,
    };

    if (event != null) _controller.add(event);
  }

  void requestList() => _send({'type': 'lobby:list'});

  void createLobby({
    required String name,
    required TimeControl timeControl,
  }) {
    _send({
      'type': 'lobby:create',
      'data': {'name': name, 'timeControl': timeControl.toJson()},
    });
  }

  void joinLobby(String lobbyId, {int? slotIndex}) {
    _send({
      'type': 'lobby:join',
      'data': {
        'lobbyId': lobbyId,
        if (slotIndex != null) 'slotIndex': slotIndex,
      },
    });
  }

  void leaveLobby(String lobbyId) {
    _send({'type': 'lobby:leave', 'data': {'lobbyId': lobbyId}});
  }

  void startGame(String lobbyId) {
    _send({'type': 'lobby:start', 'data': {'lobbyId': lobbyId}});
  }

  void _send(Map<String, dynamic> payload) {
    _channel?.sink.add(jsonEncode(payload));
  }

  void dispose() {
    _channel?.sink.close();
    _controller.close();
  }
}
