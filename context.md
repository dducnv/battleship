# Battleship Game - Project Context

## 1. Overview & Tech Stack
- **Project:** Peer-to-Peer (P2P) Multiplayer Battleship Game.
- **Framework:** Next.js (App Router, React).
- **State Management:** Zustand (Stores split into `game-store.ts` and `lobby-store.ts`).
- **Backend/Multiplayer:** Supabase Realtime (Channels, Presence, and Broadcasts) - No custom backend server is used for game logic; everything is P2P.

## 2. Core Architecture
- **Multiplayer Connection (`src/hooks/useSupabaseRoom.ts`):**
  - Connects to Supabase channels using `room:[roomId]`.
  - **Presence:** Used to track players joining/leaving and their `ready` status.
  - **Broadcast:** Used to send game actions like `player_ready`, `fire_shot`, `shot_result`, `game_over`, and `request_restart`.
- **Game State (`src/store/game-store.ts`):**
  - Tracks the phases of the game: `waiting` -> `placing` -> `playing` -> `ended`.
  - Manages `myBoard` (10x10 grid), `trackingBoard` (for recording hits/misses on the opponent), and ship coordinates.
  - Tracks turn order, `opponentId`, and readiness of both players.
- **Game Logic (`src/game/board.ts` & `constants.ts`):**
  - Defines the 5 standard ships and grid boundaries.
  - Handles collision detection, hit registration, and auto-placement algorithms.

## 3. Recently Fixed Critical Bugs (Do NOT revert these)
1. **Supabase Realtime REST Fallback Warning:** 
   - Fixed a race condition where calling `send()` or `track()` immediately upon connection caused a fallback to the REST API. Handled by adding `setTimeout` delays in `status === 'SUBSCRIBED'`.
2. **TypeScript Presence Errors:** 
   - Fixed mapping of Supabase's `{ presence_ref: string }` default type to our custom `{ userId, ready }` presence payload using `as unknown as Type`.
3. **Ship Placement Rotation UX:**
   - Fixed a bug where picking up a ship from the board (to replace it) would reset its orientation. Now, `removeShipById` preserves the `isHorizontal` state and auto-selects the ship for a seamless drag-and-drop/click UX.
4. **Game Start Sync / Infinite Loading Bug (CRITICAL):**
   - Fixed a P2P sync desynchronization where Player 1 would get stuck on "Waiting for opponent...".
   - Previously, receiving a `player_ready` broadcast would incorrectly start the game for the receiver if they had merely placed all ships (`isAllShipsPlaced`). It now strictly requires the receiver to have also clicked Ready (`myReady === true`).
   - Added robust tracking of `opponentId` in the Zustand store to ensure both peers deterministically sort their user IDs to decide who takes the first turn.

## 4. Current Status
- The core loop is fully playable: **Lobby -> Ship Placement -> Ready Sync -> Turn-based Combat -> Victory/Defeat screen.**
- Future chats should use this context to understand the established P2P architecture before making sweeping changes to game logic or multiplayer sync.
