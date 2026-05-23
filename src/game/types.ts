export type Coordinate = [number, number]; // [x, y]

export interface ShipDef {
  id: string;
  name: string;
  length: number;
  asset: string;
}

export interface PlacedShip {
  id: string;
  coordinates: Coordinate[];
  hitCount: number;
}

export type Board = number[][]; // 10x10, values are CellState

export type GamePhase = 'waiting' | 'placing' | 'playing' | 'ended';

export interface ShotResult {
  attackerId: string;
  x: number;
  y: number;
  isHit: boolean;
  isSunk: boolean;
  sunkShipId: string | null;
  nextTurnId: string;
}

export interface PlacementData {
  shipId: string;
  x: number;
  y: number;
  isHorizontal: boolean;
}

// Server-side types
export interface Player {
  socketId: string;
  ready: boolean;
  board: Board;
  shipsPlaced: PlacedShip[];
  totalHitsReceived: number;
}

export interface Room {
  roomId: string;
  players: Record<string, Player>;
  turn: string; // socketId of active player
  gameState: GamePhase;
  winnerId: string | null;
}
