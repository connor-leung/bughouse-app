# Bughouse Chess — Web Client

The Next.js client for Bughouse Chess. For the architecture, setup and deployment, see the [root README](../README.md).

```bash
npm install
npm run dev     # http://localhost:3000 (expects the Go server on :3001)
npm run build
npm run lint
```

| Path | Purpose |
| --- | --- |
| `app/` | Routes: `/home`, `/lobbies`, `/lobbies/[id]`, `/game/[id]`, `/how-to-play`, and the `/api/ws-ticket` route |
| `components/game/` | Interactive and read-only boards, clocks, piece banks, team chat, result banner, scoreboard |
| `components/lobby/` | Lobby list, lobby room, player slots, create-lobby modal |
| `lib/hooks/` | `useLobbySocket`, `useGameSocket`, `useChessClocks`, `useBoardWidth` |
| `store/` | Zustand stores for lobby and game state |

Environment variables: `NEXT_PUBLIC_SERVER_URL` (the Go server URL) and `WS_SECRET` (the secret shared with the server for signing tickets).
