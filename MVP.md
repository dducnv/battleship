:

🚢 PRODUCT REQUIREMENTS DOCUMENT: BATTLESHIP (MVP)
1. Document Overview
This document outlines the product requirements for a 2-player online Battleship game. The focus of Phase 1 (Minimum Viable Product) is to establish solid core gameplay mechanics, reliable room-based connectivity, and clear game state synchronization.

2. Core Architecture & Tech Stack
To ensure optimal performance and real-time synchronization, the following stack is specified:

Frontend Framework: Next.js (App Router, React 19)

Real-Time Engine: Socket.io-client

Backend Server: Dedicated Node.js + Express + Socket.io

State Management: Zustand (Lightweight & decoupled)

Styling: Tailwind CSS (Clean, functional layout)

Icons/UI: Lucide React

Architectural Note: A separate Node.js server is required. Serverless environments (e.g., Vercel) do not support the persistent stateful connections needed for WebSocket rooms.

3. The Fleet & Grid System
The Board:
Each player manages two 10x10 grids (Primary Grid for own ships, Tracking Radar for enemy attacks). Coordination System uses X-axis (A-J) and Y-axis (1-10).

The Fleet Assets:
Players cannot overlap ships, extend them beyond the grid, or reposition them once the game starts.

Ship Class	Length (Cells)	Code ID	Target Hits to Sink
Carrier	5	carrier	5
Battleship	4	battleship	4
Cruiser	3	cruiser	3
Submarine	3	submarine	3
Destroyer	2	destroyer	2
Win Condition: The first player to register 17 total hits (sinking all 5 enemy ships) wins.

4. Game Flow & States
The application moves through four explicit states:

[ WAITING ] → [ PLACING ] → [ PLAYING ] → [ ENDED ]

Waiting (Lobby): Player 1 creates a room → Receives roomId → Player 2 joins.

Placing (Deployment): Both players independently place their 5 ships.

Playing (Battle): Server randomly assigns the first turn. Players alternate firing shots.

Ended (Game Over): Displays victory/defeat screen and a "Rematch" option.

5. Data Structures (TypeScript)
5.1. Cell State Map
Every grid coordinate is represented by a specific integer:

0: Water (Empty)

1: Ship (Occupied - visible only to owner)

2: Missed Shot (Grey)

3: Successful Hit (Red)

5.2. Server State Schema
TypeScript
interface Player {
  socketId: string;
  ready ships. Each clicks a "Ready" button when finished.
3.  **`playing` (Battle Phase):** The server randomly assigns the first turn. Players alternate firing: boolean;
  board: number[][]; // 10x10 Grid Array
  shipsPlaced: {
    id: string;  shots until the win condition is achieved.
4.  **`ended` (Game Over):** Displays the victory/defeat screen and a "Play Again" option.
    coordinates: [number, number][];
    hitCount: number;
  }[];
  totalHitsReceived: number; 
}

interface Room

---

### 5. Data Structures & Models

#### 5.1. Cell States
Every grid coordinate is represented by an integer state value:
*    {
  roomId: string;
  players: { [socketId: string]: Player };
  turn: string; // Active player's socketId
`0`: Empty / Water
*   `1`: Occupied by Ship *(Only visible on the player's Primary Grid)*
*   `2`: Missed  gameState: 'waiting' | 'placing' | 'playing' | 'ended';
  winnerId: string | null;
}
##--- | :--- |
| room_created | { roomId: string } | Returns room code to host. |
| room_joined | { roomId, totalPlayers } | Confirms successful entry. |
| game_start | { activeTurnId: string } | Triggers when both are ready. |
| shot_result | { attackerId, x, y, isHit, isSunk, nextTurnId }| Updates boards and transfers turn. |
| game_over | { winnerId: string } | Fires when total hits = 17. |

7. UI / UX Requirements
7.1. Lobby View (waiting)
Explicit interface with Room ID input. Deployment View (placing)

Render 10x10 Primary Grid alongside a selection tray of 5 ships.

Rotate Mechanic: Toggle between Horizontal and Vertical placement.

Validation: Green hover borders for valid placement, Red for collisions/out-of-bounds.

Dev Tool: Provide an "Auto-Deploy" button for fast local testing.

7.3. Battle View (playing)
Side-by-side or stacked grids:

Primary Grid (Disabled): Shows your ships and incoming attacks.

Tracking Radar (Active): Clickable grid to target the enemy.

Lock Tracking Radar inputs when socket.id does not match the active turn.

7.4. Post-Game View (ended)
Explicit "VICTORY" or "DEFEAT" overlay modal.

Reveal unhit enemy coordinates for match clarity.

"Rematch" flow resetting states to placing phase.

