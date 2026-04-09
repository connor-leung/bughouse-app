import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../model/game/game_notifier.dart';
import '../../model/game/game_state.dart';
import '../../model/lobby/lobby.dart';
import '../../model/user/user_preferences.dart';
import '../../widgets/board/chess_board.dart';
import '../../widgets/game/chess_clock.dart';
import '../../widgets/game/piece_bank_bar.dart';
import 'game_end_overlay.dart';
import 'promotion_picker.dart';
import 'quick_messages.dart';
import 'team_chat_drawer.dart';

class GameScreen extends ConsumerStatefulWidget {
  const GameScreen({super.key, required this.gameId});

  final String gameId;

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  Square? _selectedSquare;
  Set<Square> _legalTargets = {};
  Role? _selectedDropRole;

  @override
  Widget build(BuildContext context) {
    final gameAsync = ref.watch(gameNotifierProvider(widget.gameId));
    final prefs = ref.watch(userPreferencesProvider).valueOrNull;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: FloatingActionButton.small(
        heroTag: 'chat',
        tooltip: 'Team Chat',
        onPressed: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => TeamChatDrawer(gameId: widget.gameId),
        ),
        child: const Icon(Icons.chat_bubble_outline),
      ),
      body: gameAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (gameState) {
          if (gameState == null) {
            return const Center(child: CircularProgressIndicator());
          }

          final notifier = ref.read(gameNotifierProvider(widget.gameId).notifier);
          final myRole = notifier.myRole;
          if (myRole == null) {
            return const Center(child: CircularProgressIndicator());
          }

          // Show end overlay when game is over
          if (gameState.isFinished) {
            return GameEndOverlay(
              result: gameState.result!,
              myRole: myRole,
              onHome: () => context.go('/home'),
            );
          }

          final isBoard1 = myRole == BoardRole.board1White ||
              myRole == BoardRole.board1Black;
          final myBoard =
              isBoard1 ? gameState.board1 : gameState.board2;
          final partnerBoard =
              isBoard1 ? gameState.board2 : gameState.board1;

          // Determine my color
          final myColor = (myRole == BoardRole.board1White ||
                  myRole == BoardRole.board2White)
              ? Side.white
              : Side.black;

          final myBank = gameState.bank.bankFor(myRole);
          final myClockIdx = _clockIndex(myRole);
          final oppRole = _opponentRole(myRole);
          final oppClockIdx = _clockIndex(oppRole);

          // Is it my turn?
          Position? pos;
          try {
            pos = Chess.fromSetup(Setup.parseFen(myBoard.fen));
          } catch (_) {}
          final isMyTurn = pos?.turn == myColor;

          return SafeArea(
            child: Column(
              children: [
                // Opponent clock
                _ClockRow(
                  clockMs: gameState.clocksMs[oppClockIdx],
                  isActive: !isMyTurn,
                  label: _playerName(gameState, oppRole),
                ),
                // Opponent bank (read-only)
                PieceBankBar(
                  bank: gameState.bank.bankFor(oppRole),
                  color: myColor.opposite,
                  selectedRole: null,
                  onTap: (_) {},
                  enabled: false,
                ),
                // Main board
                Expanded(
                  flex: 5,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChessBoard(
                      fen: myBoard.fen,
                      orientation: myColor,
                      isCheck: myBoard.isCheck && isMyTurn,
                      legalMoveTargets: _legalTargets,
                      selectedSquare: _selectedSquare,
                      lastMoveFrom: myBoard.lastFrom,
                      lastMoveTo: myBoard.lastTo,
                      interactive: isMyTurn,
                      onSquareTap: (sq) => _onSquareTap(
                          sq, pos, myColor, myRole, notifier, gameState),
                      onPieceDrop: isMyTurn
                          ? (from, to) => _onPieceDrop(
                              from, to, pos, myColor, myRole, notifier)
                          : null,
                    ),
                  ),
                ),
                // My bank
                PieceBankBar(
                  bank: myBank,
                  color: myColor,
                  selectedRole: _selectedDropRole,
                  onTap: (role) {
                    if (!isMyTurn) return;
                    setState(() {
                      _selectedDropRole =
                          _selectedDropRole == role ? null : role;
                      _selectedSquare = null;
                      _legalTargets = _selectedDropRole != null
                          ? _dropTargets(pos)
                          : {};
                    });
                  },
                  enabled: isMyTurn,
                ),
                // My clock
                _ClockRow(
                  clockMs: gameState.clocksMs[myClockIdx],
                  isActive: isMyTurn,
                  label: prefs?.displayName ?? 'You',
                  trailing: IconButton(
                    icon: const Icon(Icons.flag_outlined),
                    tooltip: 'Resign',
                    onPressed: () => _confirmResign(context, notifier),
                  ),
                ),
                // Companion board + quick messages
                const Divider(height: 1),
                Expanded(
                  flex: 2,
                  child: Row(
                    children: [
                      // Partner's board (mini, read-only)
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: SizedBox(
                          width: 120,
                          child: ChessBoard(
                            fen: partnerBoard.fen,
                            orientation: myColor.opposite,
                            interactive: false,
                            isCheck: partnerBoard.isCheck,
                          ),
                        ),
                      ),
                      // Quick messages
                      Expanded(
                        child: QuickMessages(
                          gameId: widget.gameId,
                          myRole: myRole,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _onPieceDrop(
    Square from,
    Square to,
    Position? pos,
    Side myColor,
    BoardRole myRole,
    GameNotifier notifier,
  ) {
    if (pos == null) return;
    final piece = pos.board.pieceAt(from);
    if (piece == null || piece.color != myColor) return;

    // Check promotion
    if (piece.role == Role.pawn) {
      final toRank = to.rank;
      final isPromo = (myColor == Side.white && toRank == 7) ||
          (myColor == Side.black && toRank == 0);
      if (isPromo) {
        _showPromotionPicker(context, from, to, notifier);
        setState(() {
          _selectedSquare = null;
          _legalTargets = {};
        });
        return;
      }
    }

    notifier.sendMove(from.name, to.name);
    setState(() {
      _selectedSquare = null;
      _legalTargets = {};
    });
  }

  void _onSquareTap(
    Square sq,
    Position? pos,
    Side myColor,
    BoardRole myRole,
    GameNotifier notifier,
    BughouseGameState gameState,
  ) {
    // Drop mode
    if (_selectedDropRole != null) {
      notifier.sendDrop(_selectedDropRole!.name, sq.name);
      setState(() {
        _selectedDropRole = null;
        _legalTargets = {};
      });
      return;
    }

    if (pos == null) return;

    // If a square is already selected and this is a legal target → move
    if (_selectedSquare != null && _legalTargets.contains(sq)) {
      final from = _selectedSquare!;
      final piece = pos.board.pieceAt(from);

      // Check if promotion needed
      if (piece?.role == Role.pawn) {
        final toRank = sq.rank;
        final isPromo =
            (myColor == Side.white && toRank == 7) ||
            (myColor == Side.black && toRank == 0);
        if (isPromo) {
          _showPromotionPicker(context, from, sq, notifier);
          setState(() { _selectedSquare = null; _legalTargets = {}; });
          return;
        }
      }

      notifier.sendMove(from.name, sq.name);
      setState(() { _selectedSquare = null; _legalTargets = {}; });
      return;
    }

    // Select a piece
    final piece = pos.board.pieceAt(sq);
    if (piece != null && piece.color == myColor) {
      final squareSet = pos.legalMovesOf(sq);
      setState(() {
        _selectedSquare = sq;
        _legalTargets = squareSet?.squares.toSet() ?? {};
      });
    } else {
      setState(() { _selectedSquare = null; _legalTargets = {}; });
    }
  }

  Set<Square> _dropTargets(Position? pos) {
    if (pos == null) return {};
    // All empty squares (simplified — server enforces pawn rank rule)
    final targets = <Square>{};
    for (final sq in Square.values) {
      if (pos.board.pieceAt(sq) == null) targets.add(sq);
    }
    return targets;
  }

  void _showPromotionPicker(
      BuildContext context, Square from, Square to, GameNotifier notifier) {
    showDialog(
      context: context,
      builder: (_) => PromotionPicker(
        color: from.rank < 4 ? Side.white : Side.black,
        onSelect: (role) {
          notifier.sendMove(from.name, to.name, promotion: role.name);
        },
      ),
    );
  }

  Future<void> _confirmResign(
      BuildContext context, GameNotifier notifier) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Resign?'),
        content: const Text('Your team will lose the game.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Resign')),
        ],
      ),
    );
    if (confirmed == true) notifier.resign();
  }

  int _clockIndex(BoardRole role) {
    return switch (role) {
      BoardRole.board1White => 0,
      BoardRole.board1Black => 1,
      BoardRole.board2White => 2,
      BoardRole.board2Black => 3,
    };
  }

  BoardRole _opponentRole(BoardRole myRole) {
    return switch (myRole) {
      BoardRole.board1White => BoardRole.board1Black,
      BoardRole.board1Black => BoardRole.board1White,
      BoardRole.board2White => BoardRole.board2Black,
      BoardRole.board2Black => BoardRole.board2White,
    };
  }

  String _playerName(BughouseGameState state, BoardRole role) {
    try {
      return state.players.firstWhere((p) => p.role == role).displayName;
    } catch (_) {
      return role.name;
    }
  }
}

class _ClockRow extends StatelessWidget {
  const _ClockRow({
    required this.clockMs,
    required this.isActive,
    required this.label,
    this.trailing,
  });

  final int clockMs;
  final bool isActive;
  final String label;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.7),
                  ),
            ),
          ),
          ChessClock(remainingMs: clockMs, isActive: isActive),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
