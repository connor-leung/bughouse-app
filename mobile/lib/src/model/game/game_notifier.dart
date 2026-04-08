import 'package:dartchess/dartchess.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../utils/server_config.dart';
import '../user/user_preferences.dart';
import '../lobby/lobby.dart';
import 'game_socket_service.dart';
import 'game_state.dart';

final gameNotifierProvider = AsyncNotifierProviderFamily<GameNotifier,
    BughouseGameState?, String>(GameNotifier.new);

class GameNotifier extends FamilyAsyncNotifier<BughouseGameState?, String> {
  // The role this client is playing
  BoardRole? myRole;

  // Pending drop selection (piece the user tapped in their bank)
  Role? pendingDropRole;

  @override
  Future<BughouseGameState?> build(String gameId) async {
    final service = ref.watch(gameSocketServiceProvider);
    final prefs = await ref.watch(userPreferencesProvider.future);

    service.connect(serverUrl, gameId, prefs.userId);

    service.events.listen((event) {
      switch (event) {
        case GameStateEvent(:final state):
          _resolveMyRole(state, prefs.userId);
          this.state = AsyncData(state);
        case GameUpdateEvent(:final state):
          this.state = AsyncData(state);
        case GameEndedEvent(:final result):
          state = state.whenData((s) {
            if (s == null) return s;
            return BughouseGameState(
              gameId: s.gameId,
              board1: s.board1,
              board2: s.board2,
              bank: s.bank,
              clocksMs: s.clocksMs,
              players: s.players,
              result: result,
            );
          });
        case TeamMessageEvent():
          break; // handled by chat notifier
        case ErrorEvent(:final message):
          this.state = AsyncError(message, StackTrace.current);
      }
    });

    return null;
  }

  void _resolveMyRole(BughouseGameState state, String userId) {
    for (final p in state.players) {
      if (p.userId == userId) {
        myRole = p.role;
        break;
      }
    }
  }

  void sendMove(String from, String to, {String? promotion}) {
    ref.read(gameSocketServiceProvider).sendMove(
          gameId: arg,
          from: from,
          to: to,
          promotion: promotion,
        );
  }

  void sendDrop(String pieceRole, String to) {
    pendingDropRole = null;
    ref.read(gameSocketServiceProvider).sendDrop(
          gameId: arg,
          pieceRole: pieceRole,
          to: to,
        );
  }

  void resign() {
    ref.read(gameSocketServiceProvider).sendResign(arg);
  }

  void selectDropPiece(Role role) {
    pendingDropRole = pendingDropRole == role ? null : role;
    // Trigger rebuild by touching state
    state = state;
  }
}

// Provider for the currently selected drop piece
final selectedDropRoleProvider =
    StateProvider.family<Role?, String>((ref, gameId) => null);
