# Bughouse Chess

A real-time 4-player team chess application. Bughouse is a chess variant where two teams of two play on separate boards simultaneously — captured pieces from one board become available for the partner on the other board to place ("drop") anywhere on their board.

## Architecture

The project is a monorepo with three applications:

```
bughouse-app/
├── web/       # Next.js frontend
├── server/    # Go WebSocket backend
└── mobile/    # Flutter mobile app
```

**Communication:** Clients request HMAC-signed WebSocket tickets from the web server, then connect to the Go backend. Tickets are valid for 60 seconds.

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 16, TypeScript, Tailwind CSS 4, Zustand |
| Chess UI | react-chessboard, chess.js |
| Backend | Go 1.23, gorilla/websocket |
| Mobile | Flutter/Dart 3.7, Riverpod, go_router |
| Web deploy | Vercel |
| Server deploy | Fly.io (Toronto region) |

## Getting Started

### Prerequisites

- Node.js (web)
- Go 1.23+ (server)
- Flutter SDK (mobile)

### Server

```bash
cd server
go run ./cmd/server
# Listens on :3001
# Set WS_SECRET env var for auth; unset = auth skipped in dev
```

### Web

```bash
cd web
npm install
npm run dev
# http://localhost:3000
```

Create `web/.env.local`:
```
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
WS_SECRET=<shared with server>
```

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Features

- **Lobbies** — Create or join 4-player lobbies, pick teams, set time controls
- **Live games** — Two synchronized chess boards with real-time piece banks and clocks
- **Piece drops** — Drop captured pieces from partner's board anywhere on your board
- **Team chat** — In-game messaging between teammates
- **Bot mode** — Quick Play vs bots for practice
- **Scoreboard** — Game result overlay with outcome summary

## How Bughouse Works

1. Two teams of two: players A1/B2 (White on board 1, Black on board 2) vs A2/B1
2. When you capture a piece, it goes into your partner's reserve
3. On your turn, instead of moving you can **drop** a piece from your reserve onto any empty square (pawns cannot be dropped on rank 1 or 8)
4. Promoted pawns return to the reserve as pawns when captured
5. Games end by checkmate, timeout, or resignation — whichever board finishes first ends the match

## Project Structure

### Server (`server/internal/`)

| Package | Responsibility |
|---|---|
| `engine/` | Chess logic: board state, move validation, FEN, bughouse rules |
| `game/` | Game sessions, clocks, piece bank routing, bot players |
| `lobby/` | Lobby lifecycle, player slots, team randomization |
| `ws/` | WebSocket handlers for lobby and game connections |

### Web (`web/src/`)

| Directory | Responsibility |
|---|---|
| `app/` | Next.js App Router pages (home, lobbies, game) |
| `components/` | Chess boards, clocks, piece banks, chat, scoreboard |
| `store/` | Zustand stores for game and lobby state |

## Deployment

**Server:** `fly deploy` from `server/` (configured in `fly.toml`)

**Web:** Push to main branch triggers Vercel deployment

## CI

GitHub Actions runs Flutter analysis and tests on pull requests (`.github/workflows/dart.yml`).
