import 'package:dartchess/dartchess.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'piece_svgs.dart';

/// A chess piece rendered from the CBurnett SVG set.
class PieceIcon extends StatelessWidget {
  const PieceIcon({
    super.key,
    required this.role,
    required this.color,
    required this.size,
  });

  final Role role;
  final Side color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      piecesvg(role.name, isWhite: color == Side.white),
      width: size,
      height: size,
    );
  }
}

/// Same as [PieceIcon] but takes a [Piece] directly — used by the board widget.
class PieceWidget extends StatelessWidget {
  const PieceWidget({super.key, required this.piece, required this.size});

  final Piece piece;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      piecesvg(piece.role.name, isWhite: piece.color == Side.white),
      width: size,
      height: size,
    );
  }
}
