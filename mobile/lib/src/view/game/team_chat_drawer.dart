import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../model/game/chat_notifier.dart';
import '../../model/user/user_preferences.dart';

class TeamChatDrawer extends ConsumerStatefulWidget {
  const TeamChatDrawer({super.key, required this.gameId});

  final String gameId;

  @override
  ConsumerState<TeamChatDrawer> createState() => _TeamChatDrawerState();
}

class _TeamChatDrawerState extends ConsumerState<TeamChatDrawer> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    ref.read(chatProvider(widget.gameId).notifier).send(widget.gameId, text);
    _controller.clear();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatProvider(widget.gameId));
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;
    final theme = Theme.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.4,
      minChildSize: 0.2,
      maxChildSize: 0.75,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text('Team Chat',
                    style: theme.textTheme.titleSmall),
              ),
              const Divider(),
              // Messages
              Expanded(
                child: messages.isEmpty
                    ? Center(
                        child: Text(
                          'No messages yet',
                          style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface
                                  .withValues(alpha: 0.4)),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        itemCount: messages.length,
                        itemBuilder: (_, i) {
                          final msg = messages[i];
                          final isMe = msg.senderId == prefs?.userId;
                          return Align(
                            alignment: isMe
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              margin:
                                  const EdgeInsets.symmetric(vertical: 3),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? theme.colorScheme.primary
                                        .withValues(alpha: 0.3)
                                    : theme.colorScheme.surface,
                                border: Border.all(
                                    color: theme.colorScheme.onSurface
                                        .withValues(alpha: 0.1)),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: isMe
                                    ? CrossAxisAlignment.end
                                    : CrossAxisAlignment.start,
                                children: [
                                  if (!isMe)
                                    Text(
                                      msg.senderName,
                                      style: theme.textTheme.labelSmall
                                          ?.copyWith(
                                              color: theme.colorScheme.primary),
                                    ),
                                  Text(msg.text,
                                      style: theme.textTheme.bodySmall),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              // Input
              Padding(
                padding: EdgeInsets.only(
                  left: 12,
                  right: 12,
                  bottom:
                      MediaQuery.of(context).viewInsets.bottom + 12,
                  top: 8,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: const InputDecoration(
                          hintText: 'Message teammate…',
                          contentPadding: EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.send),
                      onPressed: _send,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
