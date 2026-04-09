import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/board/chess_board.dart';
import '../../widgets/board/piece_painter.dart';
import '../../model/game/game_state.dart';
import 'promotion_picker.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/// Bughouse bank indices: 0=b1white, 1=b1black, 2=b2white, 3=b2black.
/// When player P captures, the piece goes to _partnerIdx[P]'s bank.
const _partnerIdx = [3, 2, 1, 0];

typedef _Banks = List<Map<Role, int>>;

class _DebugState {
  const _DebugState({
    this.fen1 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    this.fen2 = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    this.banks = const [{}, {}, {}, {}],
    this.sel1,
    this.sel2,
    this.targets1 = const {},
    this.targets2 = const {},
    this.dropRole1,
    this.dropRole2,
    this.lastFrom1,
    this.lastTo1,
    this.lastFrom2,
    this.lastTo2,
    this.outcome1,
    this.outcome2,
  });

  final String fen1;
  final String fen2;
  final _Banks banks; // [b1w, b1b, b2w, b2b]
  final Square? sel1;
  final Square? sel2;
  final Set<Square> targets1;
  final Set<Square> targets2;
  final Role? dropRole1;
  final Role? dropRole2;
  final Square? lastFrom1;
  final Square? lastTo1;
  final Square? lastFrom2;
  final Square? lastTo2;
  final Outcome? outcome1;
  final Outcome? outcome2;

  _DebugState copyWith({
    String? fen1,
    String? fen2,
    _Banks? banks,
    Object? sel1 = _sentinel,
    Object? sel2 = _sentinel,
    Set<Square>? targets1,
    Set<Square>? targets2,
    Object? dropRole1 = _sentinel,
    Object? dropRole2 = _sentinel,
    Object? lastFrom1 = _sentinel,
    Object? lastTo1 = _sentinel,
    Object? lastFrom2 = _sentinel,
    Object? lastTo2 = _sentinel,
    Object? outcome1 = _sentinel,
    Object? outcome2 = _sentinel,
  }) =>
      _DebugState(
        fen1: fen1 ?? this.fen1,
        fen2: fen2 ?? this.fen2,
        banks: banks ?? this.banks,
        sel1: sel1 == _sentinel ? this.sel1 : sel1 as Square?,
        sel2: sel2 == _sentinel ? this.sel2 : sel2 as Square?,
        targets1: targets1 ?? this.targets1,
        targets2: targets2 ?? this.targets2,
        dropRole1: dropRole1 == _sentinel ? this.dropRole1 : dropRole1 as Role?,
        dropRole2: dropRole2 == _sentinel ? this.dropRole2 : dropRole2 as Role?,
        lastFrom1: lastFrom1 == _sentinel ? this.lastFrom1 : lastFrom1 as Square?,
        lastTo1: lastTo1 == _sentinel ? this.lastTo1 : lastTo1 as Square?,
        lastFrom2: lastFrom2 == _sentinel ? this.lastFrom2 : lastFrom2 as Square?,
        lastTo2: lastTo2 == _sentinel ? this.lastTo2 : lastTo2 as Square?,
        outcome1: outcome1 == _sentinel ? this.outcome1 : outcome1 as Outcome?,
        outcome2: outcome2 == _sentinel ? this.outcome2 : outcome2 as Outcome?,
      );
}

const _sentinel = Object();

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class _DebugNotifier extends StateNotifier<_DebugState> {
  _DebugNotifier() : super(const _DebugState());

  void reset() => state = const _DebugState();

  // ---------- board tap ----------

  void tapSquare(int board, Square sq) {
    final fen = board == 0 ? state.fen1 : state.fen2;
    final pos = _pos(fen);

    final drop = board == 0 ? state.dropRole1 : state.dropRole2;
    final sel = board == 0 ? state.sel1 : state.sel2;
    final targets = board == 0 ? state.targets1 : state.targets2;

    // ── drop mode ──
    if (drop != null) {
      if (pos.board.pieceAt(sq) == null) {
        _applyDrop(board, sq, drop, pos.turn);
      } else {
        // tapped occupied square — cancel drop selection
        _clearSelection(board);
      }
      return;
    }

    // ── move mode ──
    if (sel != null && targets.contains(sq)) {
      _applyMove(board, NormalMove(from: sel, to: sq));
      return;
    }

    // ── select piece ──
    final piece = pos.board.pieceAt(sq);
    if (piece != null && piece.color == pos.turn) {
      final t = pos.legalMovesOf(sq)?.squares.toSet() ?? {};
      if (board == 0) {
        state = state.copyWith(sel1: sq, targets1: t, dropRole1: null);
      } else {
        state = state.copyWith(sel2: sq, targets2: t, dropRole2: null);
      }
    } else {
      _clearSelection(board);
    }
  }

  void tapDropRole(int board, Role role) {
    final fen = board == 0 ? state.fen1 : state.fen2;
    final pos = _pos(fen);
    final playerIdx = _playerIdx(board, pos.turn);
    final bank = state.banks[playerIdx];
    if ((bank[role] ?? 0) == 0) return;

    final current = board == 0 ? state.dropRole1 : state.dropRole2;
    final next = current == role ? null : role;
    if (board == 0) {
      state = state.copyWith(dropRole1: next, sel1: null, targets1: {});
    } else {
      state = state.copyWith(dropRole2: next, sel2: null, targets2: {});
    }
  }

  // ---------- drag-and-drop ----------

  void dropPiece(int board, Square from, Square to) {
    final fen = board == 0 ? state.fen1 : state.fen2;
    final pos = _pos(fen);
    final piece = pos.board.pieceAt(from);
    if (piece == null || piece.color != pos.turn) return;
    _applyMove(board, NormalMove(from: from, to: to));
  }

  // ---------- promotion ----------

  void promoteMove(int board, Square from, Square to, Role promo) {
    _applyMove(board, NormalMove(from: from, to: to, promotion: promo));
  }

  // ---------- internals ----------

  void _applyMove(int board, NormalMove move) {
    // Don't allow moves on a finished board
    if (board == 0 && state.outcome1 != null) return;
    if (board == 1 && state.outcome2 != null) return;

    final fen = board == 0 ? state.fen1 : state.fen2;
    final pos = _pos(fen);

    if (!pos.isLegal(move)) {
      _clearSelection(board);
      return;
    }

    // Detect capture BEFORE playing the move
    Piece? captured = pos.board.pieceAt(move.to);
    // En passant
    if (captured == null &&
        pos.board.pieceAt(move.from)?.role == Role.pawn &&
        move.to == pos.epSquare) {
      captured = Piece(role: Role.pawn, color: pos.turn.opposite);
    }

    final newPos = pos.play(move);
    final newFen = newPos.fen;

    // Update banks if a capture occurred
    _Banks newBanks = state.banks;
    if (captured != null) {
      final playerIdx = _playerIdx(board, pos.turn);
      final recipient = _partnerIdx[playerIdx];
      // Captured promoted pieces revert to pawns
      final bankRole = captured.role == Role.king ? Role.pawn : captured.role;
      newBanks = _addToBank(newBanks, recipient, bankRole);
    }

    // Detect game over
    final outcome = newPos.outcome;

    _clearSelectionInState(
      board,
      state.copyWith(
        fen1: board == 0 ? newFen : null,
        fen2: board == 1 ? newFen : null,
        banks: newBanks,
        lastFrom1: board == 0 ? move.from : null,
        lastTo1: board == 0 ? move.to : null,
        lastFrom2: board == 1 ? move.from : null,
        lastTo2: board == 1 ? move.to : null,
        outcome1: board == 0 ? outcome : _sentinel,
        outcome2: board == 1 ? outcome : _sentinel,
      ),
    );
  }

  void _applyDrop(int board, Square sq, Role role, Side color) {
    final fen = board == 0 ? state.fen1 : state.fen2;
    final pos = _pos(fen);
    final playerIdx = _playerIdx(board, color);
    final bank = state.banks[playerIdx];
    final count = bank[role] ?? 0;
    if (count == 0) return;
    // Don't drop pawns on back ranks
    if (role == Role.pawn && (sq.rank == 0 || sq.rank == 7)) return;
    if (pos.board.pieceAt(sq) != null) return;

    final newFen = _fenWithPiece(fen, sq, role, color);
    final newBanks = _removeFromBank(state.banks, playerIdx, role);

    _clearSelectionInState(
      board,
      state.copyWith(
        fen1: board == 0 ? newFen : null,
        fen2: board == 1 ? newFen : null,
        banks: newBanks,
        lastFrom1: board == 0 ? null : _sentinel as Square?,
        lastTo1: board == 0 ? sq : null,
        lastFrom2: board == 1 ? null : _sentinel as Square?,
        lastTo2: board == 1 ? sq : null,
      ),
    );
  }

  void _clearSelection(int board) {
    if (board == 0) {
      state = state.copyWith(sel1: null, targets1: {}, dropRole1: null);
    } else {
      state = state.copyWith(sel2: null, targets2: {}, dropRole2: null);
    }
  }

  void _clearSelectionInState(int board, _DebugState s) {
    if (board == 0) {
      state = s.copyWith(sel1: null, targets1: {}, dropRole1: null);
    } else {
      state = s.copyWith(sel2: null, targets2: {}, dropRole2: null);
    }
  }

  // ---------- helpers ----------

  static Chess _pos(String fen) =>
      Chess.fromSetup(Setup.parseFen(fen));

  static int _playerIdx(int board, Side turn) =>
      board * 2 + (turn == Side.white ? 0 : 1);

  static _Banks _addToBank(_Banks b, int idx, Role role) {
    final updated = Map<Role, int>.from(b[idx]);
    updated[role] = (updated[role] ?? 0) + 1;
    return List<Map<Role, int>>.from(b)..[idx] = updated;
  }

  static _Banks _removeFromBank(_Banks b, int idx, Role role) {
    final updated = Map<Role, int>.from(b[idx]);
    final count = (updated[role] ?? 0) - 1;
    if (count <= 0) {
      updated.remove(role);
    } else {
      updated[role] = count;
    }
    return List<Map<Role, int>>.from(b)..[idx] = updated;
  }

  /// Inserts [role]/[color] at [sq] in the FEN and toggles the turn.
  static String _fenWithPiece(String fen, Square sq, Role role, Side color) {
    final parts = fen.split(' ');
    final ranks = parts[0].split('/');

    final fenRank = 7 - sq.rank;
    final expanded = _expandRank(ranks[fenRank]);
    expanded[sq.file] = _fenChar(role, color);
    ranks[fenRank] = _compressRank(expanded);

    parts[0] = ranks.join('/');
    parts[1] = parts[1] == 'w' ? 'b' : 'w';
    parts[3] = '-'; // clear en passant
    return parts.join(' ');
  }

  static List<String> _expandRank(String rank) {
    final out = <String>[];
    for (final c in rank.split('')) {
      final n = int.tryParse(c);
      if (n != null) {
        out.addAll(List.filled(n, '.'));
      } else {
        out.add(c);
      }
    }
    return out;
  }

  static String _compressRank(List<String> cells) {
    final sb = StringBuffer();
    var empty = 0;
    for (final c in cells) {
      if (c == '.') {
        empty++;
      } else {
        if (empty > 0) {
          sb.write(empty);
          empty = 0;
        }
        sb.write(c);
      }
    }
    if (empty > 0) sb.write(empty);
    return sb.toString();
  }

  static String _fenChar(Role role, Side color) {
    const letters = {
      Role.pawn: 'p', Role.knight: 'n', Role.bishop: 'b',
      Role.rook: 'r', Role.queen: 'q', Role.king: 'k',
    };
    final l = letters[role]!;
    return color == Side.white ? l.toUpperCase() : l;
  }
}

final _debugProvider =
    StateNotifierProvider.autoDispose<_DebugNotifier, _DebugState>(
  (ref) => _DebugNotifier(),
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class DebugGameScreen extends ConsumerStatefulWidget {
  const DebugGameScreen({super.key});

  @override
  ConsumerState<DebugGameScreen> createState() => _DebugGameScreenState();
}

class _DebugGameScreenState extends ConsumerState<DebugGameScreen> {
  @override
  Widget build(BuildContext context) {
    final s = ref.watch(_debugProvider);
    final n = ref.read(_debugProvider.notifier);

    final pos1 = Chess.fromSetup(Setup.parseFen(s.fen1));
    final pos2 = Chess.fromSetup(Setup.parseFen(s.fen2));

    // Player indices for current turn on each board
    final b1PlayerIdx = pos1.turn == Side.white ? 0 : 1; // b1w=0, b1b=1
    final b2PlayerIdx = pos2.turn == Side.white ? 2 : 3; // b2w=2, b2b=3

    return Scaffold(
      appBar: AppBar(
        title: const Text('Debug — Free Play'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Reset',
            onPressed: n.reset,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // ── Board 1 ──────────────────────────────────────────────────
              _BoardSection(
                label: 'Board 1  '
                    '(${pos1.turn == Side.white ? "White" : "Black"} to move)',
                fen: s.fen1,
                orientation: Side.white,
                selected: s.sel1,
                legalTargets: s.targets1,
                lastFrom: s.lastFrom1,
                lastTo: s.lastTo1,
                activeBank: PieceBank(s.banks[b1PlayerIdx]),
                activeSide: pos1.turn,
                selectedDropRole: s.dropRole1,
                outcome: s.outcome1,
                onSquareTap: (sq) =>
                    _handleTap(context, 0, sq, pos1, n, s),
                onPieceDrop: (from, to) => n.dropPiece(0, from, to),
                onDropRoleTap: (role) => n.tapDropRole(0, role),
              ),

              const Divider(height: 1, thickness: 2),

              // ── Board 2 ──────────────────────────────────────────────────
              _BoardSection(
                label: 'Board 2  '
                    '(${pos2.turn == Side.white ? "White" : "Black"} to move)',
                fen: s.fen2,
                orientation: Side.white,
                selected: s.sel2,
                legalTargets: s.targets2,
                lastFrom: s.lastFrom2,
                lastTo: s.lastTo2,
                activeBank: PieceBank(s.banks[b2PlayerIdx]),
                activeSide: pos2.turn,
                selectedDropRole: s.dropRole2,
                outcome: s.outcome2,
                onSquareTap: (sq) =>
                    _handleTap(context, 1, sq, pos2, n, s),
                onPieceDrop: (from, to) => n.dropPiece(1, from, to),
                onDropRoleTap: (role) => n.tapDropRole(1, role),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleTap(
    BuildContext context,
    int board,
    Square sq,
    Chess pos,
    _DebugNotifier n,
    _DebugState s,
  ) {
    final sel = board == 0 ? s.sel1 : s.sel2;
    final targets = board == 0 ? s.targets1 : s.targets2;
    final drop = board == 0 ? s.dropRole1 : s.dropRole2;

    // Check for promotion
    if (drop == null && sel != null && targets.contains(sq)) {
      final piece = pos.board.pieceAt(sel);
      if (piece?.role == Role.pawn) {
        final isPromo = (piece!.color == Side.white && sq.rank == 7) ||
            (piece.color == Side.black && sq.rank == 0);
        if (isPromo) {
          showDialog<Role>(
            context: context,
            builder: (_) => PromotionPicker(
              color: piece.color == Side.white ? Side.white : Side.black,
              onSelect: (role) =>
                  n.promoteMove(board, sel, sq, role),
            ),
          );
          n.tapSquare(board, sq); // clear selection
          return;
        }
      }
    }

    n.tapSquare(board, sq);
  }
}

// ---------------------------------------------------------------------------
// Board section widget
// ---------------------------------------------------------------------------

class _BoardSection extends StatelessWidget {
  const _BoardSection({
    required this.label,
    required this.fen,
    required this.orientation,
    required this.selected,
    required this.legalTargets,
    required this.lastFrom,
    required this.lastTo,
    required this.activeBank,
    required this.activeSide,
    required this.selectedDropRole,
    required this.outcome,
    required this.onSquareTap,
    required this.onPieceDrop,
    required this.onDropRoleTap,
  });

  final String label;
  final String fen;
  final Side orientation;
  final Square? selected;
  final Set<Square> legalTargets;
  final Square? lastFrom;
  final Square? lastTo;
  final PieceBank activeBank;
  final Side activeSide;
  final Role? selectedDropRole;
  final Outcome? outcome;
  final void Function(Square) onSquareTap;
  final void Function(Square from, Square to) onPieceDrop;
  final void Function(Role) onDropRoleTap;

  @override
  Widget build(BuildContext context) {
    final gameOver = outcome != null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.7),
                  ),
            ),
          ),
          // Bank for the side about to move
          _BankRow(
            bank: activeBank,
            color: activeSide,
            selectedRole: selectedDropRole,
            onTap: onDropRoleTap,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Stack(
              children: [
                ChessBoard(
                  fen: fen,
                  orientation: orientation,
                  selectedSquare: selected,
                  legalMoveTargets: legalTargets,
                  lastMoveFrom: lastFrom,
                  lastMoveTo: lastTo,
                  interactive: !gameOver,
                  onSquareTap: gameOver ? null : onSquareTap,
                  onPieceDrop: gameOver ? null : onPieceDrop,
                ),
                if (gameOver)
                  _GameOverOverlay(outcome: outcome!, fen: fen),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Game-over overlay
// ---------------------------------------------------------------------------

class _GameOverOverlay extends StatelessWidget {
  const _GameOverOverlay({required this.outcome, required this.fen});

  final Outcome outcome;
  final String fen;

  @override
  Widget build(BuildContext context) {
    final pos = Chess.fromSetup(Setup.parseFen(fen));

    final String title;
    final String subtitle;
    if (outcome.winner != null) {
      final side = outcome.winner == Side.white ? 'White' : 'Black';
      title = '$side Wins!';
      subtitle = pos.isCheckmate ? 'Checkmate' : 'Game over';
    } else {
      title = 'Draw';
      subtitle = pos.isStalemate
          ? 'Stalemate'
          : pos.isInsufficientMaterial
              ? 'Insufficient material'
              : 'Draw';
    }

    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.55),
        child: Center(
          child: Card(
            elevation: 8,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withValues(alpha: 0.6),
                        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Compact bank row
// ---------------------------------------------------------------------------

class _BankRow extends StatelessWidget {
  const _BankRow({
    required this.bank,
    required this.color,
    required this.selectedRole,
    required this.onTap,
  });

  final PieceBank bank;
  final Side color;
  final Role? selectedRole;
  final void Function(Role) onTap;

  static const _order = [
    Role.queen, Role.rook, Role.bishop, Role.knight, Role.pawn
  ];

  @override
  Widget build(BuildContext context) {
    final available = _order.where((r) => bank.count(r) > 0).toList();
    if (available.isEmpty) {
      return const SizedBox(
        height: 40,
        child: Center(
          child: Text('— no pieces in hand —',
              style: TextStyle(fontSize: 11, color: Colors.grey)),
        ),
      );
    }

    return SizedBox(
      height: 44,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (final role in available)
            GestureDetector(
              onTap: () => onTap(role),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                margin: const EdgeInsets.symmetric(horizontal: 3, vertical: 4),
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: selectedRole == role
                      ? Theme.of(context)
                          .colorScheme
                          .primary
                          .withValues(alpha: 0.3)
                      : Colors.transparent,
                  border: Border.all(
                    color: selectedRole == role
                        ? Theme.of(context).colorScheme.primary
                        : Colors.transparent,
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    PieceIcon(role: role, color: color, size: 28),
                    if (bank.count(role) > 1)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 3, vertical: 1),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${bank.count(role)}',
                          style: const TextStyle(fontSize: 9),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
