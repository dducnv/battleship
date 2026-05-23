import { CellState, TOTAL_HITS_TO_WIN } from './constants';
import { cloneBoard } from './board';
import type { Board, PlacedShip } from './types';

export interface ProcessShotResult {
  board: Board;
  ships: PlacedShip[];
  isHit: boolean;
  isSunk: boolean;
  sunkShipId: string | null;
}

/**
 * Process a shot at (x, y) on the given board.
 * Returns new board, updated ships, and hit/sunk info.
 * 
 * Assumes the shot coordinates are valid (in-bounds, not already shot).
 */
export function processShot(
  board: Board,
  ships: PlacedShip[],
  x: number,
  y: number
): ProcessShotResult {
  const newBoard = cloneBoard(board);
  const cellValue = newBoard[y][x];

  // Miss
  if (cellValue === CellState.Empty) {
    newBoard[y][x] = CellState.Miss;
    return {
      board: newBoard,
      ships,
      isHit: false,
      isSunk: false,
      sunkShipId: null,
    };
  }

  // Hit
  newBoard[y][x] = CellState.Hit;
  const newShips = ships.map(ship => {
    const isThisShip = ship.coordinates.some(([cx, cy]) => cx === x && cy === y);
    if (!isThisShip) return ship;
    return { ...ship, hitCount: ship.hitCount + 1 };
  });

  // Check if any ship was sunk
  const sunkShip = newShips.find(
    ship =>
      ship.coordinates.some(([cx, cy]) => cx === x && cy === y) &&
      ship.hitCount === ship.coordinates.length
  );

  return {
    board: newBoard,
    ships: newShips,
    isHit: true,
    isSunk: !!sunkShip,
    sunkShipId: sunkShip?.id ?? null,
  };
}

/**
 * Check if the game is over (all ships sunk).
 * Total hits needed = 17 (5 + 4 + 3 + 3 + 2).
 */
export function checkGameOver(ships: PlacedShip[]): boolean {
  const totalHits = ships.reduce((sum, s) => sum + s.hitCount, 0);
  return totalHits >= TOTAL_HITS_TO_WIN;
}
