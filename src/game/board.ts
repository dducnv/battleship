import { BOARD_SIZE, CellState, SHIPS } from './constants';
import type { Board, Coordinate, PlacedShip, ShipDef } from './types';

/**
 * Create a fresh 10x10 board filled with Empty cells.
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => CellState.Empty)
  );
}

/**
 * Deep-clone a board (avoids mutation).
 */
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * Check if a ship of given length can be placed at (x, y) with the given orientation.
 * Returns true if placement is valid (in bounds, no overlap).
 */
export function canPlaceShip(
  board: Board,
  length: number,
  x: number,
  y: number,
  isHorizontal: boolean
): boolean {
  for (let i = 0; i < length; i++) {
    const cx = isHorizontal ? x + i : x;
    const cy = isHorizontal ? y : y + i;

    // Out of bounds
    if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
      return false;
    }
    // Cell already occupied
    if (board[cy][cx] !== CellState.Empty) {
      return false;
    }
  }
  return true;
}

/**
 * Place a ship on the board. Returns new board + coordinates.
 * Caller should validate with canPlaceShip first.
 */
export function placeShip(
  board: Board,
  length: number,
  x: number,
  y: number,
  isHorizontal: boolean
): { board: Board; coordinates: Coordinate[] } {
  const newBoard = cloneBoard(board);
  const coordinates: Coordinate[] = [];

  for (let i = 0; i < length; i++) {
    const cx = isHorizontal ? x + i : x;
    const cy = isHorizontal ? y : y + i;
    newBoard[cy][cx] = CellState.Ship;
    coordinates.push([cx, cy]);
  }

  return { board: newBoard, coordinates };
}

/**
 * Remove a ship from the board by its coordinates. Returns a new board.
 */
export function removeShip(board: Board, coordinates: Coordinate[]): Board {
  const newBoard = cloneBoard(board);
  for (const [cx, cy] of coordinates) {
    newBoard[cy][cx] = CellState.Empty;
  }
  return newBoard;
}

/**
 * Auto-place all ships randomly on the board.
 * Returns a new board and an array of placed ships.
 */
export function autoPlaceAll(): { board: Board; placedShips: PlacedShip[] } {
  const board = createEmptyBoard();
  const placedShips: PlacedShip[] = [];

  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      const isHorizontal = Math.random() < 0.5;
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);

      if (canPlaceShip(board, ship.length, x, y, isHorizontal)) {
        const result = placeShip(board, ship.length, x, y, isHorizontal);
        // Mutate in-place since we own this board
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            board[r][c] = result.board[r][c];
          }
        }
        placedShips.push({
          id: ship.id,
          coordinates: result.coordinates,
          hitCount: 0,
        });
        placed = true;
      }
      attempts++;
    }

    if (!placed) {
      // Extremely unlikely, but restart if stuck
      return autoPlaceAll();
    }
  }

  return { board, placedShips };
}

/**
 * Get ship definition by id.
 */
export function getShipDef(shipId: string): ShipDef | undefined {
  return SHIPS.find(s => s.id === shipId) as ShipDef | undefined;
}
