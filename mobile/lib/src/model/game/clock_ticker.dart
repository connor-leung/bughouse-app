import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'game_notifier.dart';

/// Polls game state at 100ms so clocks stay smooth between server move events.
final clockTickerProvider = StreamProvider.family<List<int>, String>((ref, gameId) async* {
  final game = ref.watch(gameNotifierProvider(gameId)).valueOrNull;
  if (game == null || game.isFinished) return;

  yield List<int>.from(game.clocksMs);

  await for (final _ in Stream.periodic(const Duration(milliseconds: 100))) {
    final updated = ref.read(gameNotifierProvider(gameId)).valueOrNull;
    if (updated == null || updated.isFinished) break;
    yield List<int>.from(updated.clocksMs);
  }
});
