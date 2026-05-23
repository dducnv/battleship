import { BOARD_SIZE, CellState } from './constants';
import type { Board } from './types';

/**
 * Validate that a shot coordinate is:
 * 1. Within board bounds
 * 2. Not already shot at (Miss or Hit)
 */
export function validateShot(board: Board, x: number, y: number): { valid: boolean; reason?: string } {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return { valid: false, reason: 'Coordinates out of bounds' };
  }

  const cell = board[y][x];
  if (cell === CellState.Miss || cell === CellState.Hit) {
    return { valid: false, reason: 'Cell already targeted' };
  }

  return { valid: true };
}

/**
 * Validate that all ships have been placed (total cells = 17).
 */
export function validateAllShipsPlaced(board: Board): boolean {
  let shipCells = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] === CellState.Ship) {
        shipCells++;
      }
    }
  }
  return shipCells === 17; // 5 + 4 + 3 + 3 + 2
}
