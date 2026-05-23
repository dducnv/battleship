📄 Product Requirements Document (PRD)Multiplayer Battleship Game (MVP Phase)1. Document OverviewThis document outlines the product requirements for a 2-player online Battleship game. The focus of Phase 1 (MVP) is to establish solid, bug-free core gameplay mechanics, reliable 2-player room-based connectivity, and clear game state synchronization. Visual polish will be addressed in subsequent phases.2. Core Architecture & Tech StackTo ensure optimal performance, real-time synchronization, and architectural scaling, the following stack is specified:Frontend Framework: Next.js (App Router, React 19)Real-Time Communication: Socket.io-clientBackend Server: Dedicated Node.js with Express and Socket.ioNote: A separate Node.js server is required because serverless environments (e.g., Vercel) do not support the persistent stateful connections needed for WebSocket rooms.State Management: Zustand (For clean, lightweight, decoupled client-side game state management)Styling: Tailwind CSS (Focusing on a clean, functional layout)Icons/Placeholders: Lucide React3. Game Rules & MechanicsThe game follows the standard Hasbro Battleship ruleset:The Board: Each player manages two 10x10 grids:Primary Grid: Where the player places their own fleet and observes incoming enemy attacks.Tracking Grid (Radar): Where the player logs their own attacks against the enemy fleet.Coordination System: X-axis (Columns A-J), Y-axis (Rows 1-10).The Fleet: Each player possesses 5 distinct ships with fixed lengths:Ship ClassLengthCarrier5 cellsBattleship4 cellsCruiser3 cellsSubmarine3 cellsDestroyer2 cellsPlacement Constraints: Ships can be placed horizontally or vertically. They cannot overlap, extend beyond the grid boundaries, or be repositioned once the game begins.Turn-Based Gameplay: Players take turns firing a single shot at a coordinate on the tracking grid.Hit: If the coordinate contains an enemy ship cell, it is marked as a Hit (Red). Turn alternates.Miss: If the coordinate contains no ship, it is marked as a Miss (Grey/White). Turn alternates.Sunk: When all cells of a specific ship are hit, that ship is declared Sunk.Win Condition: The first player to register 17 total hits (sinking all 5 enemy ships) is immediately declared the winner.4. Game States & FlowThe application moves through four explicit states managed via the gameState variable:[ waiting ] $\rightarrow$ [ placing ] $\rightarrow$ [ playing ] $\rightarrow$ [ ended ]waiting (Lobby): Player 1 creates a room and receives a unique roomId. Player 2 joins using this roomId. The game transitions when exactly 2 players are connected.placing (Fleet Deployment): Both players independently place their 5 Shot3: Successful Hit5.2. Server State SchemaTypeScriptinterface Player {
  socketId: string;
  ready 6. Socket.io Event Dictionary

### Client $\rightarrow$ Server (Emits)
| Event Name | Payload | Description |
| :---: boolean;
  board: number[][]; // 10x10 grid containing cell states
  shipsPlaced: {
    id: string; // 'carrier | :--- | :--- |
| `create_room` | `{}` | Initiates a new room instance. |
| `join_room` | `{ roomId', 'battleship', etc.
    coordinates: [number, number][];
    hitCount: number;
  }[];
  totalHitsReceived: number: string }` | Requests entry into an existing room. |
| `player_ready`| `{ roomId, board, shipsPlaced }` | Submits; 
}

interface Room {
  roomId: string;
  players: { [socketId: string]: Player };
  turn: string; // socketId finalized ship placements. |
| `fire_shot` | `{ roomId, x, y }` | Dispatches targeted coordinate. |
| `request_restart`| `{ of the active player
  gameState: 'waiting' | 'placing' | 'playing' | 'ended';
  winnerId: string | null;
}
 roomId }` | Signals intent for a rematch. |

### Server $\rightarrow$ Client (Listens)
| Event Name | Payload | Description |
| :--- | :
6. Socket.io Event SchemaTo enable clean automation by AI coding assistants, the network layer must strictly adhere to the following event payload blueprints:6.1. Client-to-Server Emitscreate_room: {}join_room: { roomId: string }player_ready: { roomId: string, board: number[][], shipsPlaced: any[] }fire_shot: { roomId: string, x: number, y: number }request_restart: { roomId: string }6.2. Server-to-Client Broadcastsroom_created: { roomId: string }room_joined: { roomId: string, totalPlayers: number }error_message: { message: string }start_placement: {}game_start: { activeTurnId: string }shot_result:{
attackerId: string;, "Join" button, and "Create Room" action.1-click clipboard copy for the generated Room ID.7.2x: number;
y: number;
isHit: boolean;
isSunk: boolean;
sunkShipId: string | null;
nextTurnId: string;
}*   `game_over`: `{ winnerId: string }`
*   `room_reset`: `{}`

---

### 7. Functional Requirements Matrix

**7.1. Lobby View (`waiting`)**
*   **REQ-01:** Provide an explicit interface featuring an input field for `Room ID`, a "Join Match" button, and a prominent "Generate New Room" action.
*   **REQ-02:** Upon generating a room, render the text-string ID visibly with a 1-click clipboard copy mechanic.

**7.2. Fleet Deployment View (`placing`)**
*   **REQ-03:** Render a single `10x10` layout representing the Primary Grid alongside a selection tray containing the 5 unplaced ships.
*   **REQ-04:** Implement a placement toggle or keypress (e.g., `R` or a Rotate Button) to switch placement orientation between Horizontal and Vertical.
*   **REQ-05:** Enforce a hover preview overlay on the grid indicating validity (Green for valid, Red for collisions/overflow).
*   **REQ-06:** Provide an optional "Auto-Generate Placement" button that runs a local collision-free random distribution loop.

**7.3. Live Battle View (`playing`)**
*   **REQ-07:** Render two distinct grids simultaneously side-by-side or stacked cleanly:
    *   **Primary Grid:** Disabled for user clicks. Renders own ships (`1`), enemy misses (`2`), and enemy hits (`3`).
    *   **Tracking Radar:** Enables target selections. Renders own misses (`2`) and hits (`3`).
*   **REQ-08:** Lock inputs on the Tracking Grid completely if the local player's client `socket.id` does not match the active `turn` string returned by the server.

**7.4. Post-Game View (`ended`)**
*   **REQ-09:** Overlay a modal or end-screen announcing outcome explicitly via `"VICTORY"` or `"DEFEAT"`.
*   **REQ-10:** Reveal the unhit coordinates of any remaining enemy ships for complete match clarity.

---

### 8. Engineering & Implementation Notes (For AI Developers)
*   **Edge Case Handling:** If a player disconnects mid-game, the server must automatically close the room and notify the remaining player via a standard alert notification.
*   **Grid Coordination Mapping:** Map the `10x10` matrix using standard nested arrays `board[y][x]` where `y` is rows 0-9 and `x` is columns 0-9.
*   **Local State Isolation:** Keep the state inside Zustand decoupled from individual UI components to prevent unnecessary re-renders when managing complex multi-dimensional arrays.