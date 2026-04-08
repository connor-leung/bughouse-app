import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'game_notifier.dart';
import 'game_state.dart';
import '../../model/lobby/lobby.dart';

/// Interpolates clock values locally at 100ms so the display is smooth
/// between server game:update events (which fire only on moves).
final clockTickerProvider = StreamProvider.family<List<int>, String>((ref, gameId) async* {
  final gameNotifier = ref.watch(gameNotifierProvider(gameId));
  final game = gameNotifier.valueOrNull;
  if (game == null || game.isFinished) return;

  // Determine which player is active on each board
  final clocks = List<int>.from(game.clocksMs);

  // Active players: board1→white=0,black=1; board2→white=2,black=3
  // We read active color from FEN
  final b1Active = _activeIdx(game.board1.fen, true);
  final b2Active = _activeIdx(game.board2.fen, false);

  yield clocks;

  await for (final _ in Stream.periodic(const Duration(milliseconds: 100))) {
    final updated = ref.read(gameNotifierProvider(gameId)).valueOrNull;
    if (updated == null || updated.isFinished) break;
    // Use fresh clocks from server state
    yield List<int>.from(updated.clocksMs);
  }
});

int _activeIdx(String fen, bool isBoard1) {
  // FEN active color is the second field
  final parts = fen.split(' ');
  if (parts.length < 2) return isBoard1 ? 0 : 2;
  final isWhite = parts[1] == 'w';
  if (isBoard1) return isWhite ? 0 : 1;
  return isWhite ? 2 : 3;
}
