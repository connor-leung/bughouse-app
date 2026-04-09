/// CBurnett chess piece SVGs (viewBox "0 0 45 45").
/// Based on the Lichess CBurnett piece set.
library;

// ── White pieces ──────────────────────────────────────────────────────────────

const String wP = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 1.31.64 2.46 1.62 3.19C17.54 17.5 14 22.07 14 28h17c0-5.93-3.54-10.5-5.62-11.81A3.99 3.99 0 0 0 26.5 13c0-2.21-1.79-4-4-4z"
    fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M20 28h5v7h-5z" fill="#fff" stroke="none"/>
  <path d="M11 39c0-2 2.5-5 11.5-5S34 37 34 39v1H11v-1z"
    fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M11 39h23" fill="none" stroke="#000" stroke-width="1.5"/>
</svg>
''';

const String wN = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/>
    <path d="M24 18c.38 5.12-1.5 5.5-2 3.5 1 4.5.5 6.5-3 6.5-4 1-6.5.5-6.5-3.5" fill="#fff"/>
    <path d="M9.5 25.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="#000" stroke-width="1"/>
    <path d="M14.933 15.75a.5 1.5 30 1 0 .866-.5.5 1.5 30 0 0-.866.5z" fill="#000" stroke-width="0"/>
    <path d="M9 27c-1-3.5 0-6.5 3-8.5 1.5-1 3.5-1.5 5-2.5 0-2.5.5-5 1.5-7" stroke="#000"/>
    <path d="M9 39h27v-4H9v4z" fill="#fff" stroke-linejoin="miter"/>
  </g>
</svg>
''';

const String wB = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#fff" stroke-linecap="butt">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/>
  </g>
</svg>
''';

const String wR = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3z" stroke-linejoin="miter"/>
    <path d="M12 36v-4h21v4H12z" stroke-linejoin="miter"/>
    <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linejoin="miter"/>
    <path d="M34 14H11l1.5 23h20L34 14z" stroke-linecap="butt"/>
    <path d="M31 17H14l1 18h15l1-18z" fill="#fff" stroke="none"/>
  </g>
</svg>
''';

const String wQ = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm16.5-4.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM29 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12L31 24.5V11l-5.5 13.5-3-15-3 15L14 11v13.5L6.5 14 9 26z" stroke-linecap="butt"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none"/>
  </g>
</svg>
''';

const String wK = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
      fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s.5-5.5-5.5-5.5S11 17 11 17v4c-2.5 8 6 10.5 6 10.5V37"
      fill="#fff"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/>
  </g>
</svg>
''';

// ── Black pieces ──────────────────────────────────────────────────────────────

const String bP = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 1.31.64 2.46 1.62 3.19C17.54 17.5 14 22.07 14 28h17c0-5.93-3.54-10.5-5.62-11.81A3.99 3.99 0 0 0 26.5 13c0-2.21-1.79-4-4-4z"
    fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M20 28h5v7h-5z" fill="#000" stroke="none"/>
  <path d="M11 39c0-2 2.5-5 11.5-5S34 37 34 39v1H11v-1z"
    fill="#000" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M11 39h23" fill="none" stroke="#000" stroke-width="1.5"/>
</svg>
''';

const String bN = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/>
    <path d="M24 18c.38 5.12-1.5 5.5-2 3.5 1 4.5.5 6.5-3 6.5-4 1-6.5.5-6.5-3.5" fill="#000"/>
    <path d="M9.5 25.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z" fill="#ccc" stroke="#ccc" stroke-width="1"/>
    <path d="M14.933 15.75a.5 1.5 30 1 0 .866-.5.5 1.5 30 0 0-.866.5z" fill="#ccc" stroke-width="0"/>
    <path d="M9 27c-1-3.5 0-6.5 3-8.5 1.5-1 3.5-1.5 5-2.5 0-2.5.5-5 1.5-7" stroke="#ccc"/>
    <path d="M9 39h27v-4H9v4z" fill="#000" stroke-linejoin="miter"/>
  </g>
</svg>
''';

const String bB = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#000" stroke-linecap="butt">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#ccc" stroke-linejoin="miter"/>
  </g>
</svg>
''';

const String bR = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3z" stroke-linejoin="miter"/>
    <path d="M12 36v-4h21v4H12z" stroke-linejoin="miter"/>
    <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linejoin="miter"/>
    <path d="M34 14H11l1.5 23h20L34 14z" stroke-linecap="butt"/>
    <path d="M31 17H14l1 18h15l1-18z" fill="#000" stroke="none"/>
  </g>
</svg>
''';

const String bQ = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm16.5-4.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM29 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12L31 24.5V11l-5.5 13.5-3-15-3 15L14 11v13.5L6.5 14 9 26z" stroke-linecap="butt"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" fill="none" stroke="#ccc"/>
  </g>
</svg>
''';

const String bK = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
  <g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke="#ccc" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
      fill="#000" stroke="#000" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s.5-5.5-5.5-5.5S11 17 11 17v4c-2.5 8 6 10.5 6 10.5V37"
      fill="#000"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"
      stroke="#ccc"/>
  </g>
</svg>
''';

/// Returns the SVG string for [role] and [isWhite].
String piecesvg(String role, {required bool isWhite}) {
  if (isWhite) {
    return switch (role) {
      'pawn'   => wP,
      'knight' => wN,
      'bishop' => wB,
      'rook'   => wR,
      'queen'  => wQ,
      'king'   => wK,
      _        => wP,
    };
  } else {
    return switch (role) {
      'pawn'   => bP,
      'knight' => bN,
      'bishop' => bB,
      'rook'   => bR,
      'queen'  => bQ,
      'king'   => bK,
      _        => bP,
    };
  }
}
