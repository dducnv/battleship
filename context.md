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
4. **Turn Logic & "Hit-Again" Rule:**
   - Fixed a bug where turns always switched after every shot. Implemented the standard rule: the attacker keeps their turn if they hit a ship, and only passes the turn on a miss.
   - Synchronized `onShotResult` to update state for both the attacker and the defender, ensuring consistent UI feedback (Hit/Miss messages) for both players simultaneously.
5. **Audio & SFX Integration:**
   - Implemented a global `AudioProvider` via `useAudio` hook to manage game sounds and background music.
   - Added `theme_battle` music that triggers when the `playing` phase begins.
   - Integrated SFX triggers for `shot`, `explosion` (on hit), `your_turn`, `win`, and `lose` events.
   - Added a global volume control slider in the `StatusBar` with persistent state via React Context.

## 4. Current Status
- The core loop is fully playable: **Lobby -> Ship Placement -> Ready Sync -> Turn-based Combat -> Victory/Defeat screen.**
- Future chats should use this context to understand the established P2P architecture before making sweeping changes to game logic or multiplayer sync.

## 5. Credits & Assets
- **Battle Theme:** [Battle Theme A](https://opengameart.org/content/battle-theme-a) by remy_sharma.
- **Sound Effects:** [Sci-Fi Sound Effects Library](https://opengameart.org/content/sci-fi-sound-effects-library) by LittleRobotSoundFactory.
- **Ship Assets:** [Sea Warfare Set](https://opengameart.org/content/sea-warfare-set-ships-and-more) by Skorpio.
