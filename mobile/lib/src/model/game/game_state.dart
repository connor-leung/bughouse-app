import 'package:dartchess/dartchess.dart';
import '../lobby/lobby.dart';

// ---------------------------------------------------------------------------
// Piece bank — pieces a player has captured (held for drops)
// ---------------------------------------------------------------------------

class PieceBank {
  const PieceBank(this._counts);

  factory PieceBank.empty() => const PieceBank({});

  factory PieceBank.fromJson(Map<String, dynamic> json) => PieceBank(
        Map.fromEntries(
          json.entries.map(
            (e) => MapEntry(
              Role.values.firstWhere((r) => r.name == e.key),
              e.value as int,
            ),
          ),
        ),
      );

  final Map<Role, int> _counts;

  int count(Role role) => _counts[role] ?? 0;

  bool get isEmpty => _counts.values.every((c) => c == 0);

  /// All piece types available to drop, with their counts.
  List<MapEntry<Role, int>> get available =>
      _counts.entries.where((e) => e.value > 0).toList();
}

// ---------------------------------------------------------------------------
// Per-board state (FEN + last move)
// ---------------------------------------------------------------------------

class BoardSnapshot {
  const BoardSnapshot({
    required this.fen,
    this.lastFrom,
    this.lastTo,
    this.isCheck = false,
  });

  final String fen;
  final Square? lastFrom;
  final Square? lastTo;
  final bool isCheck;

  factory BoardSnapshot.initial() => const BoardSnapshot(fen: kInitialFEN);

  factory BoardSnapshot.fromJson(Map<String, dynamic> json) => BoardSnapshot(
        fen: json['fen'] as String,
        lastFrom: json['lastFrom'] != null
            ? Square.fromName(json['lastFrom'] as String)
            : null,
        lastTo: json['lastTo'] != null
            ? Square.fromName(json['lastTo'] as String)
            : null,
        isCheck: json['isCheck'] as bool? ?? false,
      );
}

// ---------------------------------------------------------------------------
// Game end
// ---------------------------------------------------------------------------

enum GameEndReason { checkmate, timeout, resignation }

class GameResult {
  const GameResult({required this.winningTeam, required this.reason});

  final int winningTeam; // 1 or 2
  final GameEndReason reason;

  factory GameResult.fromJson(Map<String, dynamic> json) => GameResult(
        winningTeam: json['winningTeam'] as int,
        reason: GameEndReason.values
            .firstWhere((r) => r.name == json['reason']),
      );
}

// ---------------------------------------------------------------------------
// Full Bughouse game state (mirrors server)
// ---------------------------------------------------------------------------

class BughouseGameState {
  const BughouseGameState({
    required this.gameId,
    required this.board1,
    required this.board2,
    required this.bank,
    required this.clocksMs,
    required this.players,
    this.result,
  });

  final String gameId;
  final BoardSnapshot board1;
  final BoardSnapshot board2;
  final GameBanks bank;
  final List<int> clocksMs; // [b1white, b1black, b2white, b2black]
  final List<PlayerSlot> players; // length 4, matches BoardRole order
  final GameResult? result;

  bool get isFinished => result != null;

  factory BughouseGameState.fromJson(Map<String, dynamic> json) =>
      BughouseGameState(
        gameId: json['gameId'] as String,
        board1: BoardSnapshot.fromJson(json['board1'] as Map<String, dynamic>),
        board2: BoardSnapshot.fromJson(json['board2'] as Map<String, dynamic>),
        bank: GameBanks.fromJson(json['bank'] as Map<String, dynamic>),
        clocksMs: List<int>.from((json['clocksMs'] as List?) ?? [0, 0, 0, 0]),
        players: ((json['players'] as List?) ?? [])
            .map((p) => PlayerSlot.fromJson(p as Map<String, dynamic>))
            .toList(),
        result: json['result'] != null
            ? GameResult.fromJson(json['result'] as Map<String, dynamic>)
            : null,
      );
}

// Four banks, one per player position
class GameBanks {
  const GameBanks({
    required this.board1White,
    required this.board1Black,
    required this.board2White,
    required this.board2Black,
  });

  final PieceBank board1White;
  final PieceBank board1Black;
  final PieceBank board2White;
  final PieceBank board2Black;

  factory GameBanks.empty() => GameBanks(
        board1White: PieceBank.empty(),
        board1Black: PieceBank.empty(),
        board2White: PieceBank.empty(),
        board2Black: PieceBank.empty(),
      );

  factory GameBanks.fromJson(Map<String, dynamic> json) => GameBanks(
        board1White: PieceBank.fromJson(json['board1White'] as Map<String, dynamic>),
        board1Black: PieceBank.fromJson(json['board1Black'] as Map<String, dynamic>),
        board2White: PieceBank.fromJson(json['board2White'] as Map<String, dynamic>),
        board2Black: PieceBank.fromJson(json['board2Black'] as Map<String, dynamic>),
      );

  PieceBank bankFor(BoardRole role) => switch (role) {
        BoardRole.board1White => board1White,
        BoardRole.board1Black => board1Black,
        BoardRole.board2White => board2White,
        BoardRole.board2Black => board2Black,
      };
}
