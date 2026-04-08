import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../utils/server_config.dart';
import '../user/user_preferences.dart';
import 'lobby.dart';
import 'lobby_socket_service.dart';

// ---------------------------------------------------------------------------
// Lobby list provider
// ---------------------------------------------------------------------------

final lobbyListProvider =
    AsyncNotifierProvider<LobbyListNotifier, List<Lobby>>(
  LobbyListNotifier.new,
);

class LobbyListNotifier extends AsyncNotifier<List<Lobby>> {
  @override
  Future<List<Lobby>> build() async {
    final service = ref.watch(lobbySocketServiceProvider);
    final prefs = await ref.watch(userPreferencesProvider.future);

    service.connect(serverUrl, prefs.userId);
    service.events.listen((event) {
      switch (event) {
        case LobbyListEvent(:final lobbies):
          state = AsyncData(lobbies);
        case LobbyUpdatedEvent(:final lobby):
          state = state.whenData((list) {
            final idx = list.indexWhere((l) => l.id == lobby.id);
            if (idx == -1) return [...list, lobby];
            return [...list]..[idx] = lobby;
          });
        case LobbyCreatedEvent(:final lobby):
          state = state.whenData((list) => [...list, lobby]);
        case LobbyErrorEvent(:final message):
          state = AsyncError(message, StackTrace.current);
        case GameStartingEvent():
          break; // handled by currentLobbyProvider
      }
    });

    return [];
  }
}

// ---------------------------------------------------------------------------
// Current lobby (room view)
// ---------------------------------------------------------------------------

final currentLobbyProvider =
    StateNotifierProvider<CurrentLobbyNotifier, AsyncValue<Lobby?>>(
  (ref) => CurrentLobbyNotifier(ref),
);

class CurrentLobbyNotifier extends StateNotifier<AsyncValue<Lobby?>> {
  CurrentLobbyNotifier(this._ref) : super(const AsyncData(null)) {
    _ref.watch(lobbySocketServiceProvider).events.listen((event) {
      switch (event) {
        case LobbyUpdatedEvent(:final lobby):
          if (state.value?.id == lobby.id) {
            state = AsyncData(lobby);
          }
        case LobbyCreatedEvent(:final lobby):
          state = AsyncData(lobby);
        default:
          break;
      }
    });
  }

  final Ref _ref;

  void set(Lobby l) => state = AsyncData(l);
  void clear() => state = const AsyncData(null);
}

// ---------------------------------------------------------------------------
// Pending game start (game:starting event)
// ---------------------------------------------------------------------------

final pendingGameProvider =
    NotifierProvider<PendingGameNotifier, GameStartingEvent?>(
  PendingGameNotifier.new,
);

class PendingGameNotifier extends Notifier<GameStartingEvent?> {
  @override
  GameStartingEvent? build() {
    ref.watch(lobbySocketServiceProvider).events.listen((event) {
      if (event is GameStartingEvent) state = event;
    });
    return null;
  }

  void clear() => state = null;
}
