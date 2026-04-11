import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import '../../styles/theme.dart';
import 'piece_painter.dart';

typedef OnSquareTap = void Function(Square square);
typedef OnPieceDrop = void Function(Square from, Square to);
typedef OnDragStart = void Function(Square square);

class ChessBoard extends StatefulWidget {
  const ChessBoard({
    super.key,
    required this.fen,
    required this.orientation,
    this.onSquareTap,
    this.onPieceDrop,
    this.onDragStart,
    this.lastMoveFrom,
    this.lastMoveTo,
    this.isCheck = false,
    this.legalMoveTargets = const {},
    this.selectedSquare,
    this.interactive = true,
  });

  final String fen;
  final Side orientation;
  final OnSquareTap? onSquareTap;
  final OnPieceDrop? onPieceDrop;
  final OnDragStart? onDragStart;
  final Square? lastMoveFrom;
  final Square? lastMoveTo;
  final bool isCheck;
  final Set<Square> legalMoveTargets;
  final Square? selectedSquare;
  final bool interactive;

  @override
  State<ChessBoard> createState() => _ChessBoardState();
}

class _ChessBoardState extends State<ChessBoard> {
  Position? _position;
  Square? _draggingFrom;

  @override
  void initState() {
    super.initState();
    _parsePosition();
  }

  @override
  void didUpdateWidget(ChessBoard old) {
    super.didUpdateWidget(old);
    if (old.fen != widget.fen) _parsePosition();
  }

  void _parsePosition() {
    try {
      _position = Chess.fromSetup(Setup.parseFen(widget.fen));
    } catch (_) {
      _position = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final squareSize = constraints.maxWidth / 8;
          return Stack(
            children: [
              // Board squares with drag targets
              _BoardSquares(
                orientation: widget.orientation,
                squareSize: squareSize,
                lastMoveFrom: widget.lastMoveFrom,
                lastMoveTo: widget.lastMoveTo,
                legalTargets: widget.legalMoveTargets,
                selected: widget.selectedSquare,
                draggingFrom: _draggingFrom,
                kingInCheck: widget.isCheck
                    ? _position?.board.kingOf(_position!.turn)
                    : null,
                interactive: widget.interactive,
                onDrop: widget.onPieceDrop,
              ),
              // Pieces (draggable when interactive)
              if (_position != null)
                _BoardPieces(
                  position: _position!,
                  orientation: widget.orientation,
                  squareSize: squareSize,
                  interactive: widget.interactive,
                  draggingFrom: _draggingFrom,
                  onDragStart: (sq) {
                    setState(() => _draggingFrom = sq);
                    widget.onDragStart?.call(sq);
                  },
                  onDragEnd: () => setState(() => _draggingFrom = null),
                ),
              // Tap layer (behind nothing — receives taps for click-to-move)
              if (widget.interactive && widget.onSquareTap != null)
                _TapLayer(
                  orientation: widget.orientation,
                  squareSize: squareSize,
                  onTap: widget.onSquareTap!,
                ),
            ],
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Board squares with DragTarget support
// ---------------------------------------------------------------------------

class _BoardSquares extends StatelessWidget {
  const _BoardSquares({
    required this.orientation,
    required this.squareSize,
    this.lastMoveFrom,
    this.lastMoveTo,
    this.legalTargets = const {},
    this.selected,
    this.draggingFrom,
    this.kingInCheck,
    required this.interactive,
    this.onDrop,
  });

  final Side orientation;
  final double squareSize;
  final Square? lastMoveFrom;
  final Square? lastMoveTo;
  final Set<Square> legalTargets;
  final Square? selected;
  final Square? draggingFrom;
  final Square? kingInCheck;
  final bool interactive;
  final OnPieceDrop? onDrop;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 8,
      ),
      itemCount: 64,
      itemBuilder: (_, idx) {
        final sq = _squareForIndex(idx, orientation);
        final isLight = (sq.file + sq.rank) % 2 != 0;
        Color baseColor = isLight ? AppTheme.boardLight : AppTheme.boardDark;

        if (sq == selected || sq == draggingFrom) {
          baseColor = Colors.yellow.shade600.withValues(alpha: 0.7);
        } else if (sq == lastMoveFrom || sq == lastMoveTo) {
          baseColor = Colors.yellow.shade400.withValues(alpha: 0.5);
        } else if (sq == kingInCheck) {
          baseColor = Colors.red.withValues(alpha: 0.7);
        }

        final isLegal = legalTargets.contains(sq);

        Widget cell = Container(
          color: baseColor,
          child: isLegal
              ? Center(
                  child: Container(
                    width: squareSize * 0.35,
                    height: squareSize * 0.35,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                  ),
                )
              : null,
        );

        if (interactive && onDrop != null) {
          cell = DragTarget<Square>(
            onWillAcceptWithDetails: (details) =>
                legalTargets.contains(sq) && details.data != sq,
            onAcceptWithDetails: (details) => onDrop!(details.data, sq),
            builder: (context, candidateData, _) {
              final highlight = candidateData.isNotEmpty && isLegal;
              return Container(
                color: highlight
                    ? Colors.green.withValues(alpha: 0.45)
                    : baseColor,
                child: isLegal && candidateData.isEmpty
                    ? Center(
                        child: Container(
                          width: squareSize * 0.35,
                          height: squareSize * 0.35,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                        ),
                      )
                    : null,
              );
            },
          );
        }

        return cell;
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Pieces overlay (Draggable when interactive)
// ---------------------------------------------------------------------------

class _BoardPieces extends StatelessWidget {
  const _BoardPieces({
    required this.position,
    required this.orientation,
    required this.squareSize,
    required this.interactive,
    required this.draggingFrom,
    required this.onDragStart,
    required this.onDragEnd,
  });

  final Position position;
  final Side orientation;
  final double squareSize;
  final bool interactive;
  final Square? draggingFrom;
  final void Function(Square) onDragStart;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        for (final (square, piece) in position.board.pieces)
          _PieceWidget(
            key: ValueKey('${square.name}-${piece.kind.name}'),
            square: square,
            piece: piece,
            orientation: orientation,
            squareSize: squareSize,
            isDragging: square == draggingFrom,
            interactive: interactive,
            onDragStart: () => onDragStart(square),
            onDragEnd: onDragEnd,
          ),
      ],
    );
  }
}

class _PieceWidget extends StatelessWidget {
  const _PieceWidget({
    super.key,
    required this.square,
    required this.piece,
    required this.orientation,
    required this.squareSize,
    required this.isDragging,
    required this.interactive,
    required this.onDragStart,
    required this.onDragEnd,
  });

  final Square square;
  final Piece piece;
  final Side orientation;
  final double squareSize;
  final bool isDragging;
  final bool interactive;
  final VoidCallback onDragStart;
  final VoidCallback onDragEnd;

  @override
  Widget build(BuildContext context) {
    final file = square.file;
    final rank = square.rank;
    final left = orientation == Side.white
        ? file * squareSize
        : (7 - file) * squareSize;
    final top = orientation == Side.white
        ? (7 - rank) * squareSize
        : rank * squareSize;

    final pieceWidget = _buildPieceImage(squareSize);

    if (!interactive) {
      return Positioned(
        left: left,
        top: top,
        width: squareSize,
        height: squareSize,
        child: pieceWidget,
      );
    }

    return Positioned(
      left: left,
      top: top,
      width: squareSize,
      height: squareSize,
      child: Draggable<Square>(
        data: square,
        feedback: _buildPieceImage(squareSize * 1.15),
        childWhenDragging: Opacity(
          opacity: 0.25,
          child: pieceWidget,
        ),
        onDragStarted: onDragStart,
        onDraggableCanceled: (_, __) => onDragEnd(),
        onDragCompleted: onDragEnd,
        child: pieceWidget,
      ),
    );
  }

  Widget _buildPieceImage(double size) {
    return PieceWidget(piece: piece, size: size);
  }
}

// ---------------------------------------------------------------------------
// Tap detection layer
// ---------------------------------------------------------------------------

class _TapLayer extends StatelessWidget {
  const _TapLayer({
    required this.orientation,
    required this.squareSize,
    required this.onTap,
  });

  final Side orientation;
  final double squareSize;
  final OnSquareTap onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTapDown: (details) {
        final x = details.localPosition.dx;
        final y = details.localPosition.dy;
        final file = (x / squareSize).floor().clamp(0, 7);
        final rank = (y / squareSize).floor().clamp(0, 7);
        final sq = orientation == Side.white
            ? Square.fromCoords(File(file), Rank(7 - rank))
            : Square.fromCoords(File(7 - file), Rank(rank));
        onTap(sq);
      },
      child: const SizedBox.expand(),
    );
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

Square _squareForIndex(int idx, Side orientation) {
  final file = idx % 8;
  final rank = 7 - idx ~/ 8;
  if (orientation == Side.white) {
    return Square.fromCoords(File(file), Rank(rank));
  }
  return Square.fromCoords(File(7 - file), Rank(7 - rank));
}
