import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import '../../styles/theme.dart';

typedef OnSquareTap = void Function(Square square);

class ChessBoard extends StatefulWidget {
  const ChessBoard({
    super.key,
    required this.fen,
    required this.orientation,
    this.onSquareTap,
    this.lastMoveFrom,
    this.lastMoveTo,
    this.isCheck = false,
    this.legalMoveTargets = const {},
    this.selectedSquare,
    this.interactive = true,
  });

  final String fen;
  final Side orientation; // which side is at the bottom
  final OnSquareTap? onSquareTap;
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
              // Board squares
              _BoardSquares(
                orientation: widget.orientation,
                squareSize: squareSize,
                lastMoveFrom: widget.lastMoveFrom,
                lastMoveTo: widget.lastMoveTo,
                legalTargets: widget.legalMoveTargets,
                selected: widget.selectedSquare,
                kingInCheck: widget.isCheck
                    ? _position?.board.kingOf(_position!.turn)
                    : null,
              ),
              // Pieces
              if (_position != null)
                _BoardPieces(
                  position: _position!,
                  orientation: widget.orientation,
                  squareSize: squareSize,
                ),
              // Tap layer
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
// Board squares (background colors + highlights)
// ---------------------------------------------------------------------------

class _BoardSquares extends StatelessWidget {
  const _BoardSquares({
    required this.orientation,
    required this.squareSize,
    this.lastMoveFrom,
    this.lastMoveTo,
    this.legalTargets = const {},
    this.selected,
    this.kingInCheck,
  });

  final Side orientation;
  final double squareSize;
  final Square? lastMoveFrom;
  final Square? lastMoveTo;
  final Set<Square> legalTargets;
  final Square? selected;
  final Square? kingInCheck;

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
        Color color = isLight ? AppTheme.boardLight : AppTheme.boardDark;

        if (sq == selected) {
          color = Colors.yellow.shade600.withValues(alpha: 0.7);
        } else if (sq == lastMoveFrom || sq == lastMoveTo) {
          color = Colors.yellow.shade400.withValues(alpha: 0.5);
        } else if (sq == kingInCheck) {
          color = Colors.red.withValues(alpha: 0.7);
        }

        return Container(
          color: color,
          child: legalTargets.contains(sq)
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
}

// ---------------------------------------------------------------------------
// Pieces overlay
// ---------------------------------------------------------------------------

class _BoardPieces extends StatelessWidget {
  const _BoardPieces({
    required this.position,
    required this.orientation,
    required this.squareSize,
  });

  final Position position;
  final Side orientation;
  final double squareSize;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        for (final (square, piece) in position.board.pieces)
          _PieceWidget(
            square: square,
            piece: piece,
            orientation: orientation,
            squareSize: squareSize,
          ),
      ],
    );
  }
}

class _PieceWidget extends StatelessWidget {
  const _PieceWidget({
    required this.square,
    required this.piece,
    required this.orientation,
    required this.squareSize,
  });

  final Square square;
  final Piece piece;
  final Side orientation;
  final double squareSize;

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

    return Positioned(
      left: left,
      top: top,
      width: squareSize,
      height: squareSize,
      child: Center(
        child: Text(
          _pieceUnicode(piece),
          style: TextStyle(
            fontSize: squareSize * 0.72,
            height: 1,
            shadows: const [
              Shadow(color: Colors.black54, blurRadius: 2),
            ],
          ),
        ),
      ),
    );
  }

  String _pieceUnicode(Piece p) {
    const map = {
      PieceKind.whiteKing: '♔',
      PieceKind.whiteQueen: '♕',
      PieceKind.whiteRook: '♖',
      PieceKind.whiteBishop: '♗',
      PieceKind.whiteKnight: '♘',
      PieceKind.whitePawn: '♙',
      PieceKind.blackKing: '♚',
      PieceKind.blackQueen: '♛',
      PieceKind.blackRook: '♜',
      PieceKind.blackBishop: '♝',
      PieceKind.blackKnight: '♞',
      PieceKind.blackPawn: '♟',
    };
    return map[p.kind] ?? '?';
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
      child: Container(color: Colors.transparent),
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
