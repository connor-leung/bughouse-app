# Bughouse Chess — Design System & UI Redesign Handoff

> Original handoff spec for the dark-navy reskin of the web client. Most of it is now implemented in `web/app/globals.css` and the components; the remaining gaps are tracked in the issue tracker. The logo source lives in [`assets/bughouse-four-quadrants.svg`](assets/bughouse-four-quadrants.svg).

**Date:** May 2, 2026  
**Scope:** Visual reskin only — zero logic changes, zero new dependencies (except one Google Font)

---

## Design System

### Color tokens
Add these CSS variables to `web/app/globals.css`, then expose as Tailwind v4 theme tokens.

```css
/* web/app/globals.css */
@import "tailwindcss";

:root {
  --bg-base:        #080e1a;
  --bg-surface:     #0f1829;
  --bg-elevated:    #151f33;
  --bg-hover:       #1c2840;
  --border:         rgba(255, 255, 255, 0.07);
  --border-strong:  rgba(255, 255, 255, 0.12);
  --text-primary:   #e8eef8;
  --text-secondary: #7a8fae;
  --text-muted:     #4a5a73;
  --accent:         #2d6ff0;
  --accent-bright:  #4a86f5;
  --accent-dim:     rgba(45, 111, 240, 0.15);
  --green:          #22c55e;
  --green-dim:      rgba(34, 197, 94, 0.15);
  --red:            #ef4444;
  --red-dim:        rgba(239, 68, 68, 0.15);
  --board-light:    #c5d3e8;
  --board-dark:     #3e5a80;
}

@theme {
  --color-base:           var(--bg-base);
  --color-surface:        var(--bg-surface);
  --color-elevated:       var(--bg-elevated);
  --color-hover:          var(--bg-hover);
  --color-accent:         var(--accent);
  --color-accent-bright:  var(--accent-bright);
  --color-text-primary:   var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted:     var(--text-muted);
  --color-board-light:    var(--board-light);
  --color-board-dark:     var(--board-dark);
}
```

### Typography
Add to `<head>` in `web/app/layout.tsx`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Update `<body>` className:
```tsx
// Before
<body className="h-full bg-gray-950 text-gray-100 antialiased">

// After
<body className="h-full bg-[#080e1a] text-[#e8eef8] antialiased font-['DM_Sans',sans-serif]">
```

### Chess board colors
Find the square color definitions in `InteractiveBoard.tsx` and `ReadOnlyBoard.tsx` (passed to `react-chessboard` as `customDarkSquareStyle` / `customLightSquareStyle`):
```tsx
customLightSquareStyle={{ backgroundColor: '#c5d3e8' }}
customDarkSquareStyle={{  backgroundColor: '#3e5a80' }}
```

---

## File-by-file changes

---

### `web/app/globals.css`
Full replacement — see Design System section above.

---

### `web/app/layout.tsx`
1. Add Google Font `<link>` tags to `<head>` (see Typography above)
2. Update `<body>` className (see Typography above)

---

### `web/app/home/page.tsx`
```tsx
// WRAPPER div
// Before:  "min-h-screen flex items-center justify-center"
// After:
"min-h-screen flex items-center justify-center bg-[#080e1a]"

// INNER container
// Before:  "flex flex-col items-center gap-4 w-full max-w-md px-6"
// After:
"flex flex-col items-center gap-3 w-full max-w-xs px-6"

// h1
// Before:  "text-4xl font-bold text-center text-white"
// After:
"text-3xl font-bold text-center text-[#e8eef8] tracking-tight"

// "Playing as" paragraph
// Before:  "text-gray-400 text-center mb-2"
// After:
"text-[#7a8fae] text-center mb-2 text-sm"

// displayName span
// Before:  "text-blue-400 font-semibold"
// After:
"text-[#4a86f5] font-semibold"

// Quick Play button
// Before:  "w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2"
// After:
"w-full bg-[#2d6ff0] hover:bg-[#4a86f5] disabled:opacity-50 rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(45,111,240,0.3)]"

// Browse Lobbies button
// Before:  "w-full bg-[#1e2130] hover:bg-[#252a3d] rounded-2xl py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2"
// After:
"w-full bg-[#151f33] hover:bg-[#1c2840] border border-white/7 hover:border-white/12 rounded-xl py-4 font-bold text-base transition-colors flex items-center justify-center gap-2"

// Change name button
// Before:  "text-gray-500 hover:text-gray-300 text-sm text-center transition-colors"
// After:
"text-[#4a5a73] hover:text-[#7a8fae] text-sm text-center transition-colors"

// Help (?) button — bottom right
// Before:  "fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[#1e2130] hover:bg-[#252a3d] text-gray-400 hover:text-white flex items-center justify-center text-lg font-bold transition-colors"
// After:
"fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[#151f33] hover:bg-[#1c2840] border border-white/7 text-[#7a8fae] hover:text-[#e8eef8] flex items-center justify-center text-lg font-bold transition-colors"
```

---

### `web/components/lobby/LobbyList.tsx`
```tsx
// Wrapper
// Before:  "min-h-screen p-4 sm:p-6 max-w-2xl mx-auto"
// After:
"min-h-screen p-4 sm:p-6 max-w-2xl mx-auto bg-[#080e1a]"

// Back button
// Before:  "text-gray-400 hover:text-gray-200"
// After:
"text-[#4a5a73] hover:text-[#e8eef8] text-sm transition-colors"

// h1
// Before:  "text-xl font-bold"
// After:
"text-lg font-semibold text-[#e8eef8]"

// "Live" pill (isConnected)
// Before:  "bg-green-900 text-green-300"
// After:
"bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.25)]"

// "Connecting..." pill
// Before:  "bg-gray-700 text-gray-400"
// After:
"bg-[#151f33] text-[#4a5a73] border border-white/7"

// + Create button
// Before:  "bg-blue-600 hover:bg-blue-500 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
// After:
"bg-[#2d6ff0] hover:bg-[#4a86f5] rounded-lg px-4 py-2 text-sm font-semibold transition-colors shadow-[0_2px_12px_rgba(45,111,240,0.25)]"

// Empty state text
// Before:  "text-center text-gray-500 py-16" / "text-lg" / "text-sm mt-1"
// After:
"text-center text-[#4a5a73] py-16" / "text-base" / "text-sm mt-1 text-[#4a5a73]"
```

---

### `web/components/lobby/LobbyCard.tsx`
```tsx
// Card wrapper
// Before:  "bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
// After:
"bg-[#0f1829] border border-white/7 hover:bg-[#151f33] hover:border-white/12 rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer"

// Lobby name
// Before:  "font-semibold text-gray-100"
// After:
"font-semibold text-[#e8eef8] text-sm"

// Meta line (tc · filled/4)
// Before:  "text-sm text-gray-400 mt-0.5"
// After:
"text-xs text-[#7a8fae] mt-1 font-['DM_Mono']"

// "Random" label
// Before:  "ml-1 text-blue-400"
// After:
"ml-1 text-[#4a86f5]"

// View button
// Before:  "bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
// After:
"bg-[#151f33] hover:bg-[#1c2840] border border-white/7 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors text-[#7a8fae]"

// Join button
// Before:  "bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
// After:
"bg-[#2d6ff0] hover:bg-[#4a86f5] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
```

---

### `web/components/lobby/CreateLobbyModal.tsx`
```tsx
// Backdrop
// Before:  "fixed inset-0 bg-black/70 flex items-center justify-center z-50"
// After:
"fixed inset-0 bg-[#080e1a]/80 backdrop-blur-xl flex items-center justify-center z-50"

// Modal card
// Before:  "bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl"
// After:
"bg-[#0f1829] border border-white/12 rounded-2xl p-6 w-full max-w-sm shadow-[0_24px_64px_rgba(0,0,0,0.6)]"

// h2
// Before:  "text-lg font-bold mb-4"
// After:
"text-lg font-bold mb-5 text-[#e8eef8]"

// Text input
// Before:  "bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
// After:
"w-full bg-[#151f33] border border-[#2d6ff0] rounded-lg px-4 py-2.5 text-[#e8eef8] placeholder-[#4a5a73] focus:outline-none focus:border-[#4a86f5] transition-colors"

// Time control label
// Before:  "text-sm text-gray-400 mb-2"
// After:
"text-xs font-semibold text-[#4a5a73] uppercase tracking-widest mb-2"

// TC pill — inactive
// Before:  "bg-gray-800 text-gray-300 hover:bg-gray-700"
// After:
"bg-[#151f33] text-[#7a8fae] hover:bg-[#1c2840] border border-white/7"

// TC pill — active
// Before:  "bg-blue-600 text-white"
// After:
"bg-[#2d6ff0] text-white border border-transparent"

// Toggle track — on
// Before:  "bg-blue-600"
// After:
"bg-[#2d6ff0]"

// Toggle track — off
// Before:  "bg-gray-700"
// After:
"bg-[#151f33] border border-white/7"

// "Random teams" label
// Before:  "text-sm text-gray-300"
// After:
"text-sm text-[#e8eef8] font-medium"

// Cancel button
// Before:  "flex-1 bg-gray-800 hover:bg-gray-700 rounded-lg py-2 text-sm font-semibold transition-colors"
// After:
"flex-1 bg-[#151f33] hover:bg-[#1c2840] border border-white/7 rounded-lg py-2.5 text-sm font-medium transition-colors text-[#7a8fae]"

// Create button
// Before:  "flex-1 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 text-sm font-semibold transition-colors"
// After:
"flex-1 bg-[#2d6ff0] hover:bg-[#4a86f5] rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-[0_2px_12px_rgba(45,111,240,0.25)]"
```

---

### `web/components/lobby/PlayerSlotTile.tsx`
```tsx
// Card wrapper — "you"
// Before:  "border-blue-600 bg-blue-900/20"
// After:
"border-[rgba(45,111,240,0.4)] bg-[rgba(45,111,240,0.08)]"

// Card wrapper — others
// Before:  "border-gray-800 bg-gray-900/50"
// After:
"border-white/7 bg-[#0f1829]"

// Ready dot — ready
// Before:  "bg-green-400"
// After:
"bg-[#22c55e]"

// Ready dot — not ready / empty
// Before:  "bg-gray-600" / "bg-gray-800"
// After:
"bg-[#4a5a73]" / "bg-[#151f33]"

// Role label
// Before:  "text-xs text-gray-500 font-medium"
// After:
"text-xs text-[#4a5a73] font-medium"

// Player name — "you"
// Before:  "text-blue-300"
// After:
"text-[#4a86f5]"

// Player name — others
// Before:  "text-gray-200"
// After:
"text-[#e8eef8]"

// "(you)" label
// Before:  "text-xs text-blue-400"
// After:
"text-xs text-[#4a86f5]"

// Empty slot label
// Before:  "text-gray-600 mt-0.5"
// After:
"text-[#4a5a73] mt-0.5"

// Join button
// Before:  "bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1 text-xs font-semibold transition-colors"
// After:
"bg-[#151f33] hover:bg-[#1c2840] border border-white/7 hover:border-white/12 rounded-lg px-3 py-1 text-xs font-medium transition-colors text-[#7a8fae]"

// "Ready" badge
// Before:  "text-xs text-green-400 font-semibold"
// After:
"text-xs text-[#22c55e] font-semibold"
```

---

### `web/components/lobby/LobbyRoom.tsx`
```tsx
// Card wrapper
// Before:  "bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
// After:
"bg-[#0f1829] border border-white/12 rounded-2xl p-6 w-full max-w-md shadow-[0_24px_64px_rgba(0,0,0,0.5)]"

// Back button
// Before:  "text-gray-400 hover:text-gray-200 transition-colors"
// After:
"text-[#4a5a73] hover:text-[#e8eef8] transition-colors text-lg"

// h1
// Before:  "text-xl font-bold"
// After:
"text-lg font-bold text-[#e8eef8]"

// Meta line
// Before:  "text-sm text-gray-400"
// After:
"text-xs text-[#7a8fae] font-['DM_Mono']"

// "Random teams" inline label
// Before:  "ml-1 text-blue-400"
// After:
"ml-1 text-[#4a86f5]"

// Error block
// Before:  "bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm"
// After:
"bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] rounded-lg p-3 mb-4 text-[#ef4444] text-sm"

// Team label (Team A / Team B / Players)
// Before:  "text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2"
// After:
"text-xs text-[#4a5a73] font-semibold uppercase tracking-widest mb-2"

// Countdown number
// Before:  "text-5xl font-black text-green-400 mb-1"
// After:
"text-5xl font-black text-[#22c55e] mb-1"

// Countdown subtext
// Before:  "text-gray-400 text-sm"
// After:
"text-[#7a8fae] text-sm"

// Ready button — not ready
// Before:  "bg-green-700 hover:bg-green-600 text-white"
// After:
"bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-[0_4px_16px_rgba(34,197,94,0.25)]"

// Ready button — already ready (toggle to unready)
// Before:  "bg-green-800/60 hover:bg-red-900/60 text-green-300 hover:text-red-300 border border-green-700 hover:border-red-700"
// After:
"bg-[rgba(34,197,94,0.12)] hover:bg-[rgba(239,68,68,0.12)] text-[#22c55e] hover:text-[#ef4444] border border-[rgba(34,197,94,0.3)] hover:border-[rgba(239,68,68,0.3)]"

// "0/4 ready" text
// Before:  "text-center text-gray-500 text-xs"
// After:
"text-center text-[#4a5a73] text-xs"

// "Join a slot to ready up" text
// Before:  "text-center text-gray-500 text-sm"
// After:
"text-center text-[#4a5a73] text-sm"

// Loading state
// Before:  "bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
// After:
"bg-[#0f1829] border border-white/12 rounded-2xl p-6 w-full max-w-md shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
```

---

### `web/components/game/ChessClock.tsx`
```tsx
// Active, normal time
// Before:  "bg-blue-900 text-blue-100"
// After:
"bg-[#2d6ff0] text-white"

// Active, low time (<10s)
// Before:  "bg-red-900 text-red-200"
// After:
"bg-[#ef4444] text-white"

// Inactive
// Before:  "bg-gray-800 text-gray-400"
// After:
"bg-[#151f33] border border-white/7 text-[#7a8fae]"

// Dead (0ms)
// Before:  "bg-gray-800 text-gray-600"
// After:
"bg-[#151f33] border border-white/7 text-[#4a5a73]"

// Label span
// Before:  (inherits)
// After — add explicit class:
"text-xs font-medium opacity-70 mb-0.5 font-['DM_Sans']"

// Time display
// Before:  "font-mono font-bold tabular-nums" + size conditional
// After:
"font-['DM_Mono'] font-bold tabular-nums" + keep existing size conditional
```

---

### `web/components/game/PieceBankBar.tsx`
```tsx
// White tile background
// Before:  "bg-gray-700"
// After:
"bg-[#c5d3e8]"
// NOTE: pieces on light bg — the SVG pieces are already dark so this works

// Black tile background
// Before:  "bg-gray-300"
// After:
"bg-[#3e5a80]"

// Selected ring offset
// Before:  "ring-offset-gray-900"
// After:
"ring-offset-[#0f1829]"

// Count badge
// Before:  "bg-blue-500"
// After:
"bg-[#2d6ff0]"

// "No pieces in reserve" text
// Before:  "text-gray-600"
// After:
"text-[#4a5a73]"
```

---

### `web/components/game/GameResultBanner.tsx`
```tsx
// Win banner
// Before:  "bg-yellow-950/60 border-yellow-800/40"
// After:
"bg-[rgba(250,204,21,0.06)] border-[rgba(250,204,21,0.2)]"

// Defeat banner
// Before:  "bg-gray-900 border-gray-800"
// After:
"bg-[#0f1829] border-white/7"

// "Victory" text
// Before:  "text-yellow-400"
// After:
"text-[#facc15]"

// "Defeat" text
// Before:  "text-gray-400"
// After:
"text-[#7a8fae]"

// Reason text
// Before:  "text-gray-500 text-xs"
// After:
"text-[#4a5a73] text-xs"

// Vote dot — voted
// Before:  "bg-green-400"
// After:
"bg-[#22c55e]"

// Vote dot — not voted
// Before:  "bg-gray-700"
// After:
"bg-[#1c2840]"

// Vote count
// Before:  "text-gray-600 text-xs"
// After:
"text-[#4a5a73] text-xs font-['DM_Mono']"

// Rematch button
// Before:  "bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-default rounded-lg px-3 py-1 font-semibold transition-colors"
// After:
"bg-[#2d6ff0] hover:bg-[#4a86f5] disabled:opacity-50 disabled:cursor-default rounded-lg px-3 py-1 font-semibold transition-colors shadow-[0_2px_8px_rgba(45,111,240,0.25)]"

// Leave button
// Before:  "bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1 text-gray-300 transition-colors"
// After:
"bg-[#151f33] hover:bg-[#1c2840] border border-white/7 rounded-lg px-3 py-1 text-[#7a8fae] transition-colors"
```

---

### `web/components/game/Scoreboard.tsx`
```tsx
// Wrapper
// Before:  "bg-gray-900 rounded-xl p-3 w-full"
// After:
"bg-[#0f1829] border border-white/7 rounded-xl p-3 w-full"

// Divider
// Before:  "border-t border-gray-800 my-1"
// After:
"border-t border-white/7 my-1"

// Player name — me
// Before:  "text-blue-300 font-semibold"
// After:
"text-[#4a86f5] font-semibold"

// Player name — others
// Before:  "text-gray-300"
// After:
"text-[#e8eef8]"

// Score — leading
// Before:  "text-white font-bold"
// After:
"text-[#22c55e] font-bold"

// Score — not leading
// Before:  "text-gray-500"
// After:
"text-[#4a5a73]"
```

---

### `web/components/game/GameLayout.tsx`
```tsx
// Page root
// Before:  "min-h-screen bg-gray-950 flex flex-col"
// After:
"min-h-screen bg-[#080e1a] flex flex-col"

// Header bar
// Before:  "flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800"
// After:
"flex items-center justify-between px-4 py-2 bg-[#080e1a]/95 backdrop-blur-xl border-b border-white/7"

// Game ID (font-mono)
// Before:  "text-sm text-gray-500 font-mono"
// After:
"text-xs text-[#4a5a73] font-['DM_Mono']"

// Live pill
// Before:  "bg-green-900 text-green-300"
// After:
"bg-[rgba(34,197,94,0.12)] text-[#22c55e] border border-[rgba(34,197,94,0.25)]"

// Connecting pill
// Before:  "bg-gray-700 text-gray-400"
// After:
"bg-[#151f33] text-[#4a5a73] border border-white/7"

// Chat button
// Before:  "relative bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
// After:
"relative bg-[#151f33] hover:bg-[#1c2840] border border-white/7 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors text-[#7a8fae] hover:text-[#e8eef8]"

// Unread badge
// Before:  "absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
// After:
"absolute -top-1 -right-1 bg-[#2d6ff0] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"

// Resign button
// Before:  "bg-red-900/60 hover:bg-red-800 rounded-lg px-3 py-1.5 text-sm text-red-300 font-medium transition-colors"
// After:
"bg-[rgba(239,68,68,0.12)] hover:bg-[rgba(239,68,68,0.2)] border border-[rgba(239,68,68,0.25)] rounded-lg px-3 py-1.5 text-sm text-[#ef4444] font-medium transition-colors"

// Error bar
// Before:  "bg-red-900/50 border-b border-red-800 px-4 py-2 text-red-300 text-sm text-center"
// After:
"bg-[rgba(239,68,68,0.08)] border-b border-[rgba(239,68,68,0.2)] px-4 py-2 text-[#ef4444] text-sm text-center"

// Partner board divider (mobile)
// Before:  "border-t border-gray-800 pt-4 md:border-0 md:pt-0"
// After:
"border-t border-white/7 pt-4 md:border-0 md:pt-0"

// Loading / error state
// Before:  "min-h-screen flex items-center justify-center text-gray-500"
// After:
"min-h-screen flex items-center justify-center text-[#4a5a73] bg-[#080e1a]"

// Premove cancel button
// Before:  "text-xs text-orange-300 bg-orange-900/40 hover:bg-orange-900/60 rounded-lg px-3 py-1.5 self-start transition-colors"
// After:
"text-xs text-[#fb923c] bg-[rgba(251,146,60,0.12)] hover:bg-[rgba(251,146,60,0.2)] border border-[rgba(251,146,60,0.25)] rounded-lg px-3 py-1.5 self-start transition-colors"
```

---

## react-chessboard board colors

In `InteractiveBoard.tsx` and `ReadOnlyBoard.tsx`, pass custom square styles to `<Chessboard>`:

```tsx
<Chessboard
  // ... existing props
  customLightSquareStyle={{ backgroundColor: '#c5d3e8' }}
  customDarkSquareStyle={{ backgroundColor: '#3e5a80' }}
  customBoardStyle={{
    borderRadius: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
  }}
/>
```

---

## What is NOT changing
- All TypeScript types, props, hooks, state logic — untouched
- All WebSocket / server communication — untouched
- All routing and Next.js config — untouched
- No new npm packages required (DM Sans is a Google Font loaded via CDN)
- `react-chessboard` stays as-is, just custom square colors passed as props

---

## Quick smoke-test checklist
After applying changes, verify:
- [ ] Home page renders with dark navy background (not gray-950)
- [ ] Active chess clock is blue (#2d6ff0), not blue-900
- [ ] Lobby cards have subtle border, not gray-800
- [ ] Chess board squares are slate-blue (not gray/white)
- [ ] "You" player slot has blue-tinted border
- [ ] Resign button is muted red outline (not filled red-900)
- [ ] DM Sans font loads (check Network tab for fonts.gstatic.com)
