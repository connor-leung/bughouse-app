import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/lobby/lobby.dart';
import '../../model/lobby/lobby_socket_service.dart';

class CreateLobbySheet extends ConsumerStatefulWidget {
  const CreateLobbySheet({super.key});

  @override
  ConsumerState<CreateLobbySheet> createState() => _CreateLobbySheetState();
}

class _CreateLobbySheetState extends ConsumerState<CreateLobbySheet> {
  final _nameController = TextEditingController();
  TimeControl _selectedTC = TimeControl.presets[2]; // 3+0 default
  bool _creating = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;
    setState(() => _creating = true);
    ref.read(lobbySocketServiceProvider).createLobby(
          name: name,
          timeControl: _selectedTC,
        );
    if (mounted) {
      Navigator.pop(context);
      context.push('/lobbies');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Create Lobby', style: theme.textTheme.titleLarge),
          const SizedBox(height: 20),
          TextField(
            controller: _nameController,
            autofocus: true,
            maxLength: 30,
            decoration: const InputDecoration(
              labelText: 'Lobby name',
              counterText: '',
            ),
          ),
          const SizedBox(height: 20),
          Text('Time Control', style: theme.textTheme.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: TimeControl.presets.map((tc) {
              final selected = tc.label == _selectedTC.label;
              return ChoiceChip(
                label: Text(tc.label),
                selected: selected,
                onSelected: (_) => setState(() => _selectedTC = tc),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _creating ? null : _create,
            child: _creating
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Create'),
          ),
        ],
      ),
    );
  }
}
