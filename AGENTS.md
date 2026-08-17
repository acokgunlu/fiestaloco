# FiestaLoco - Developer & Game Design Guidelines

## Core Architecture Principle: Universal Online TV Host & Phone Controller (Jackbox Style)

> **MANDATORY DIRECTIVE:**
> **Every single game mode in the platform MUST feature a dedicated "Online TV Host / Observer Screen" option alongside mobile phone controllers ("Telefondan Katıl").**

### Key Requirements for All Games:
1. **Online TV Host (Ana Ekran / TV Modu)**:
   - Must generate a unique 4-character Room Code (e.g., `WOLF`, `CODE`, `BLUF`, `BOMB`).
   - Must display a scannable QR code linking directly to `?game=<gameName>&room=<ROOM_CODE>`.
   - The TV screen is the central observer/spectator board with sound effects, timers, animations, and live updates.
2. **Mobile Controller (Telefon Kumandası)**:
   - Players join the room using their phones.
   - Secret actions (secret words, bluff submission, private voting, drawing, answering trivia, passing the bomb) happen privately on each player's mobile phone screen.
3. **Local Pass-and-Play Option (Tek Cihaz)**:
   - Kept as a fallback for offline / single-device play.
4. **Real-time Server State (`server.ts`)**:
   - Centralized WebSocket room management broadcasting public state to TV screens and secret role/inputs to player sockets.

---

## Deployment Architecture (Vercel + Railway + Supabase)

The app is split across two hosts. **Do not try to move the WebSocket server into a
serverless function** — Vercel Functions cap connection lifetime at 300s (Hobby) /
800s (Pro) and do not guarantee that the TV screen and the phones land on the same
instance. All room state lives in RAM.

| Piece | Host | Build | Entry |
|---|---|---|---|
| Frontend | Vercel | `npm run build` → `dist/` | `vercel.json` |
| Game server | Railway | `npm run build:server` → `dist-server/` | `railway.json`, `Dockerfile` |
| Persistence | Supabase | — | `server/persistence.ts` |

### Rules when adding a new game mode

1. **Client URLs must go through `src/utils/serverUrl.ts`.** Never hardcode
   `window.location.host` for WebSocket or `/api` calls — the frontend and the
   server are on different origins in production. Use `getWsUrl()` / `getApiUrl()`.
2. **Register the room map** in `ROOM_REGISTRY` (`server.ts`) so the new mode gets
   snapshotting and restart-resilience for free.
3. **Add a `maybeRecordMatch('<gameType>', room)` call** as the first line of the
   mode's `broadcast*RoomState()` function, and teach `detectFinishedMatch()`
   (`server/matchResult.ts`) how to spot game-over and compute the winner.
4. **Call `forgetRoom('<gameType>', code)`** wherever the room is deleted, so its
   snapshot is cleaned up too.
5. **Add the mode to `scripts/smokeTest.ts`** with its create/join message types.

### Constraints to preserve

- The server must run as a **single replica** — room state is in-memory and cannot
  be shared across instances.
- Anything stored on a room object that is a `Set`, `Map`, WebSocket, or timer
  handle is stripped by `serializeRoom()`. Keep serializable game state in plain
  objects/arrays or it will not survive a restart.
- Supabase is **optional**. Every persistence call must no-op cleanly when
  `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unset, and gameplay must not
  block on a database write.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it through a `VITE_`
  variable — those are inlined into the public bundle at build time.

See `DEPLOY.md` for the full deployment walkthrough.
