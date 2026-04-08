import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'game_state.dart';

// ---------------------------------------------------------------------------
// Server events (inbound)
// ---------------------------------------------------------------------------

sealed class ServerEvent {}

class GameStateEvent extends ServerEvent {
  GameStateEvent(this.state);
  final BughouseGameState state;
}

class GameUpdateEvent extends ServerEvent {
  GameUpdateEvent(this.state);
  final BughouseGameState state;
}

class GameEndedEvent extends ServerEvent {
  GameEndedEvent(this.result);
  final GameResult result;
}

class TeamMessageEvent extends ServerEvent {
  TeamMessageEvent({required this.senderId, required this.senderName, required this.text});
  final String senderId;
  final String senderName;
  final String text;
}

class ErrorEvent extends ServerEvent {
  ErrorEvent(this.message);
  final String message;
}

// ---------------------------------------------------------------------------
// WebSocket service
// ---------------------------------------------------------------------------

final gameSocketServiceProvider = Provider<GameSocketService>((ref) {
  final service = GameSocketService();
  ref.onDispose(service.dispose);
  return service;
});

class GameSocketService {
  WebSocketChannel? _channel;
  final _controller = StreamController<ServerEvent>.broadcast();

  Stream<ServerEvent> get events => _controller.stream;

  void connect(String serverUrl, String gameId, String userId) {
    final uri = Uri.parse('$serverUrl/game/$gameId?userId=$userId');
    _channel = WebSocketChannel.connect(uri);
    _channel!.stream.listen(
      _onMessage,
      onError: (e) => _controller.add(ErrorEvent(e.toString())),
      onDone: () {},
    );
  }

  void _onMessage(dynamic raw) {
    final json = jsonDecode(raw as String) as Map<String, dynamic>;
    final type = json['type'] as String;
    final data = json['data'] as Map<String, dynamic>;

    final event = switch (type) {
      'game:state' => GameStateEvent(BughouseGameState.fromJson(data)),
      'game:update' => GameUpdateEvent(BughouseGameState.fromJson(data)),
      'game:ended' => GameEndedEvent(GameResult.fromJson(data)),
      'game:message' => TeamMessageEvent(
          senderId: data['senderId'] as String,
          senderName: data['senderName'] as String,
          text: data['text'] as String,
        ),
      _ => null,
    };

    if (event != null) _controller.add(event);
  }

  void sendMove({
    required String gameId,
    required String from,
    required String to,
    String? promotion,
  }) {
    _send({
      'type': 'game:move',
      'data': {
        'gameId': gameId,
        'from': from,
        'to': to,
        if (promotion != null) 'promotion': promotion,
      },
    });
  }

  void sendDrop({
    required String gameId,
    required String pieceRole,
    required String to,
  }) {
    _send({
      'type': 'game:drop',
      'data': {'gameId': gameId, 'pieceRole': pieceRole, 'to': to},
    });
  }

  void sendResign(String gameId) {
    _send({'type': 'game:resign', 'data': {'gameId': gameId}});
  }

  void sendTeamMessage(String gameId, String text) {
    _send({'type': 'game:message', 'data': {'gameId': gameId, 'text': text}});
  }

  void _send(Map<String, dynamic> payload) {
    _channel?.sink.add(jsonEncode(payload));
  }

  void dispose() {
    _channel?.sink.close();
    _controller.close();
  }
}
