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

class _LocalState {
  const _LocalState({
    this.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    this.banks = const [{}, {}], // [white, black]
    this.selected,
    this.legalTargets = const {},
    this.dropRole,
    this.lastFrom,
    this.lastTo,
    this.outcome,
    this.awaitingPass = false,
  });

  final String fen;
  final List<Map<Role, int>> banks;
  final Square? selected;
  final Set<Square> legalTargets;
  final Role? dropRole;
  final Square? lastFrom;
  final Square? lastTo;
  final Outcome? outcome;
  final bool awaitingPass; // show "pass device" overlay

  _LocalState copyWith({
    String? fen,
    List<Map<Role, int>>? banks,
    Object? selected = _sentinel,
    Set<Square>? legalTargets,
    Object? dropRole = _sentinel,
    Object? lastFrom = _sentinel,
    Object? lastTo = _sentinel,
    Object? outcome = _sentinel,
    bool? awaitingPass,
  }) =>
      _LocalState(
        fen: fen ?? this.fen,
        banks: banks ?? this.banks,
        selected: selected == _sentinel ? this.selected : selected as Square?,
        legalTargets: legalTargets ?? this.legalTargets,
        dropRole: dropRole == _sentinel ? this.dropRole : dropRole as Role?,
        lastFrom: lastFrom == _sentinel ? this.lastFrom : lastFrom as Square?,
        lastTo: lastTo == _sentinel ? this.lastTo : lastTo as Square?,
        outcome: outcome == _sentinel ? this.outcome : outcome as Outcome?,
        awaitingPass: awaitingPass ?? this.awaitingPass,
      );
}

const _sentinel = Object();

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class _LocalNotifier extends StateNotifier<_LocalState> {
  _LocalNotifier() : super(const _LocalState());

  void reset() => state = const _LocalState();

  void confirmPass() => state = state.copyWith(awaitingPass: false);

  void tapSquare(Square sq) {
    if (state.awaitingPass || state.outcome != null) return;
    final pos = _pos(state.fen);

    // Drop mode
    if (state.dropRole != null) {
      if (pos.board.pieceAt(sq) == null) {
        _applyDrop(sq, state.dropRole!, pos.turn);
      } else {
        state = state.copyWith(dropRole: null, selected: null, legalTargets: {});
      }
      return;
    }

    // Execute move
    if (state.selected != null && state.legalTargets.contains(sq)) {
      _applyMove(NormalMove(from: state.selected!, to: sq));
      return;
    }

    // Select piece
    final piece = pos.board.pieceAt(sq);
    if (piece != null && piece.color == pos.turn) {
      final targets = pos.legalMovesOf(sq)?.squares.toSet() ?? {};
      state = state.copyWith(selected: sq, legalTargets: targets, dropRole: null);
    } else {
      state = state.copyWith(selected: null, legalTargets: {}, dropRole: null);
    }
  }

  void tapDropRole(Role role) {
    if (state.awaitingPass || state.outcome != null) return;
    final pos = _pos(state.fen);
    final bank = state.banks[pos.turn == Side.white ? 0 : 1];
    if ((bank[role] ?? 0) == 0) return;
    final next = state.dropRole == role ? null : role;
    state = state.copyWith(dropRole: next, selected: null, legalTargets: {});
  }

  void dropPiece(Square from, Square to) {
    if (state.awaitingPass || state.outcome != null) return;
    final pos = _pos(state.fen);
    final piece = pos.board.pieceAt(from);
    if (piece == null || piece.color != pos.turn) return;
    _applyMove(NormalMove(from: from, to: to));
  }

  void promoteMove(Square from, Square to, Role promo) {
    _applyMove(NormalMove(from: from, to: to, promotion: promo));
  }

  void _applyMove(NormalMove move) {
    final pos = _pos(state.fen);
    if (!pos.isLegal(move)) {
      state = state.copyWith(selected: null, legalTargets: {}, dropRole: null);
      return;
    }

    // Detect capture before playing
    Piece? captured = pos.board.pieceAt(move.to);
    if (captured == null &&
        pos.board.pieceAt(move.from)?.role == Role.pawn &&
        move.to == pos.epSquare) {
      captured = Piece(role: Role.pawn, color: pos.turn.opposite);
    }

    final newPos = pos.play(move);
    var newBanks = state.banks;
    if (captured != null) {
      // Capturer gets the piece (crazyhouse-style)
      final capturerIdx = pos.turn == Side.white ? 0 : 1;
      final bankRole = captured.role == Role.king ? Role.pawn : captured.role;
      newBanks = _addToBank(newBanks, capturerIdx, bankRole);
    }

    final outcome = newPos.outcome;
    state = state.copyWith(
      fen: newPos.fen,
      banks: newBanks,
      selected: null,
      legalTargets: {},
      dropRole: null,
      lastFrom: move.from,
      lastTo: move.to,
      outcome: outcome,
      awaitingPass: outcome == null, // prompt pass if game not over
    );
  }

  void _applyDrop(Square sq, Role role, Side color) {
    final pos = _pos(state.fen);
    final playerIdx = color == Side.white ? 0 : 1;
    final bank = state.banks[playerIdx];
    if ((bank[role] ?? 0) == 0) return;
    if (role == Role.pawn && (sq.rank == 0 || sq.rank == 7)) return;
    if (pos.board.pieceAt(sq) != null) return;

    final newFen = _fenWithDrop(state.fen, sq, role, color);
    final newBanks = _removeFromBank(state.banks, playerIdx, role);
    final newPos = _pos(newFen);
    final outcome = newPos.outcome;

    state = state.copyWith(
      fen: newFen,
      banks: newBanks,
      selected: null,
      legalTargets: {},
      dropRole: null,
      lastFrom: null,
      lastTo: sq,
      outcome: outcome,
      awaitingPass: outcome == null,
    );
  }

  static Chess _pos(String fen) => Chess.fromSetup(Setup.parseFen(fen));

  static List<Map<Role, int>> _addToBank(
      List<Map<Role, int>> b, int idx, Role role) {
    final updated = Map<Role, int>.from(b[idx]);
    updated[role] = (updated[role] ?? 0) + 1;
    return List<Map<Role, int>>.from(b)..[idx] = updated;
  }

  static List<Map<Role, int>> _removeFromBank(
      List<Map<Role, int>> b, int idx, Role role) {
    final updated = Map<Role, int>.from(b[idx]);
    final count = (updated[role] ?? 0) - 1;
    if (count <= 0) {
      updated.remove(role);
    } else {
      updated[role] = count;
    }
    return List<Map<Role, int>>.from(b)..[idx] = updated;
  }

  static String _fenWithDrop(String fen, Square sq, Role role, Side color) {
    final parts = fen.split(' ');
    final ranks = parts[0].split('/');
    final fenRank = 7 - sq.rank;
    final expanded = _expandRank(ranks[fenRank]);
    expanded[sq.file] = _fenChar(role, color);
    ranks[fenRank] = _compressRank(expanded);
    parts[0] = ranks.join('/');
    parts[1] = parts[1] == 'w' ? 'b' : 'w';
    parts[3] = '-';
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

final _localProvider =
    StateNotifierProvider.autoDispose<_LocalNotifier, _LocalState>(
  (ref) => _LocalNotifier(),
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class LocalTwoPlayerScreen extends ConsumerStatefulWidget {
  const LocalTwoPlayerScreen({super.key});

  @override
  ConsumerState<LocalTwoPlayerScreen> createState() =>
      _LocalTwoPlayerScreenState();
}

class _LocalTwoPlayerScreenState extends ConsumerState<LocalTwoPlayerScreen> {
  @override
  Widget build(BuildContext context) {
    final s = ref.watch(_localProvider);
    final n = ref.read(_localProvider.notifier);
    final pos = Chess.fromSetup(Setup.parseFen(s.fen));

    // Board is always shown from the current player's perspective
    final orientation = pos.turn;
    final playerBank = PieceBank(s.banks[pos.turn == Side.white ? 0 : 1]);
    final turnLabel = pos.turn == Side.white ? 'White' : 'Black';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Local 2-Player'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'New Game',
            onPressed: n.reset,
          ),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Opponent info (top — playing from opposite side)
                _PlayerBar(
                  label: pos.turn == Side.white ? 'Black' : 'White',
                  bank: PieceBank(
                      s.banks[pos.turn == Side.white ? 1 : 0]),
                  isActive: false,
                  selectedDropRole: null,
                  onDropRoleTap: (_) {},
                ),
                const Divider(height: 1),
                // Board
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Center(
                      child: AspectRatio(
                        aspectRatio: 1,
                        child: Stack(
                          children: [
                            ChessBoard(
                              fen: s.fen,
                              orientation: orientation,
                              selectedSquare: s.selected,
                              legalMoveTargets: s.legalTargets,
                              lastMoveFrom: s.lastFrom,
                              lastMoveTo: s.lastTo,
                              interactive: s.outcome == null && !s.awaitingPass,
                              onSquareTap: (s.outcome != null || s.awaitingPass)
                                  ? null
                                  : (sq) => _handleTap(context, sq, pos, n, s),
                              onPieceDrop: (s.outcome != null || s.awaitingPass)
                                  ? null
                                  : (from, to) => n.dropPiece(from, to),
                            ),
                            if (s.outcome != null)
                              _GameOverOverlay(
                                  outcome: s.outcome!, onReset: n.reset),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const Divider(height: 1),
                // Active player info (bottom)
                _PlayerBar(
                  label: turnLabel,
                  bank: playerBank,
                  isActive: true,
                  selectedDropRole: s.dropRole,
                  onDropRoleTap: n.tapDropRole,
                ),
              ],
            ),

            // Pass-device overlay
            if (s.awaitingPass)
              _PassOverlay(
                nextPlayer: pos.turn == Side.white ? 'White' : 'Black',
                onConfirm: n.confirmPass,
              ),
          ],
        ),
      ),
    );
  }

  void _handleTap(
    BuildContext context,
    Square sq,
    Chess pos,
    _LocalNotifier n,
    _LocalState s,
  ) {
    // Promotion check
    if (s.dropRole == null && s.selected != null && s.legalTargets.contains(sq)) {
      final piece = pos.board.pieceAt(s.selected!);
      if (piece?.role == Role.pawn) {
        final isPromo = (piece!.color == Side.white && sq.rank == 7) ||
            (piece.color == Side.black && sq.rank == 0);
        if (isPromo) {
          showDialog<Role>(
            context: context,
            builder: (_) => PromotionPicker(
              color: piece.color,
              onSelect: (role) => n.promoteMove(s.selected!, sq, role),
            ),
          );
          n.tapSquare(sq); // clear selection
          return;
        }
      }
    }
    n.tapSquare(sq);
  }
}

// ---------------------------------------------------------------------------
// Player bar (top / bottom)
// ---------------------------------------------------------------------------

class _PlayerBar extends StatelessWidget {
  const _PlayerBar({
    required this.label,
    required this.bank,
    required this.isActive,
    required this.selectedDropRole,
    required this.onDropRoleTap,
  });

  final String label;
  final PieceBank bank;
  final bool isActive;
  final Role? selectedDropRole;
  final void Function(Role) onDropRoleTap;

  static const _order = [
    Role.queen, Role.rook, Role.bishop, Role.knight, Role.pawn
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final available = _order.where((r) => bank.count(r) > 0).toList();

    return Container(
      color: isActive
          ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3)
          : null,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        children: [
          Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              color: isActive
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  if (available.isEmpty)
                    Text(
                      'no pieces in hand',
                      style: TextStyle(
                          fontSize: 11,
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.3)),
                    )
                  else
                    for (final role in available)
                      GestureDetector(
                        onTap: isActive ? () => onDropRoleTap(role) : null,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 120),
                          margin: const EdgeInsets.only(right: 4),
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: (isActive && selectedDropRole == role)
                                ? theme.colorScheme.primary.withValues(alpha: 0.25)
                                : Colors.transparent,
                            border: Border.all(
                              color: (isActive && selectedDropRole == role)
                                  ? theme.colorScheme.primary
                                  : Colors.transparent,
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              PieceIcon(
                                role: role,
                                color: label == 'White' ? Side.white : Side.black,
                                size: 28,
                              ),
                              if (bank.count(role) > 1)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 2, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.surface,
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
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Pass device overlay
// ---------------------------------------------------------------------------

class _PassOverlay extends StatelessWidget {
  const _PassOverlay({required this.nextPlayer, required this.onConfirm});

  final String nextPlayer;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: GestureDetector(
        onTap: onConfirm,
        child: Container(
          color: Colors.black.withValues(alpha: 0.75),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.swap_horiz, color: Colors.white, size: 48),
                const SizedBox(height: 16),
                Text(
                  '$nextPlayer\'s turn',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pass device, then tap to continue',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Game over overlay
// ---------------------------------------------------------------------------

class _GameOverOverlay extends StatelessWidget {
  const _GameOverOverlay({required this.outcome, required this.onReset});

  final Outcome outcome;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final String title;
    if (outcome.winner != null) {
      title = '${outcome.winner == Side.white ? 'White' : 'Black'} Wins!';
    } else {
      title = 'Draw';
    }

    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.6),
        child: Center(
          child: Card(
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: onReset,
                    child: const Text('New Game'),
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
