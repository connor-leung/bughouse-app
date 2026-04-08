import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'game_socket_service.dart';

class ChatMessage {
  const ChatMessage({
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
  });

  final String senderId;
  final String senderName;
  final String text;
  final DateTime timestamp;
}

final chatProvider =
    NotifierProviderFamily<ChatNotifier, List<ChatMessage>, String>(
  ChatNotifier.new,
);

class ChatNotifier extends FamilyNotifier<List<ChatMessage>, String> {
  @override
  List<ChatMessage> build(String gameId) {
    ref.watch(gameSocketServiceProvider).events.listen((event) {
      if (event is TeamMessageEvent) {
        state = [
          ...state,
          ChatMessage(
            senderId: event.senderId,
            senderName: event.senderName,
            text: event.text,
            timestamp: DateTime.now(),
          ),
        ];
      }
    });
    return [];
  }

  void send(String gameId, String text) {
    ref.read(gameSocketServiceProvider).sendTeamMessage(gameId, text);
  }
}
