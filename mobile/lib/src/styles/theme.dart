import 'package:flutter/material.dart';

class AppTheme {
  static const _boardLight = Color(0xFFF0D9B5);
  static const _boardDark = Color(0xFFB58863);
  static const _primary = Color(0xFF81B64C);
  static const _background = Color(0xFF262421);
  static const _surface = Color(0xFF302E2C);
  static const _onSurface = Color(0xFFBABABA);

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _background,
      colorScheme: const ColorScheme.dark(
        primary: _primary,
        surface: _surface,
        onSurface: _onSurface,
        background: _background,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: _background,
        foregroundColor: _onSurface,
        elevation: 0,
      ),
      cardTheme: const CardThemeData(
        color: _surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primary,
          foregroundColor: Colors.white,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(6)),
          ),
        ),
      ),
      inputDecorationTheme: const InputDecorationTheme(
        filled: true,
        fillColor: _surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(6)),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  // Board square colours
  static const boardLight = _boardLight;
  static const boardDark = _boardDark;
}
