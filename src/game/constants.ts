export const BOARD_SIZE = 10;

export const SHIPS = [
  { id: 'carrier',    name: 'Carrier',    length: 5, asset: '/ships/5x.png' },
  { id: 'battleship', name: 'Battleship', length: 4, asset: '/ships/4x.png' },
  { id: 'cruiser',    name: 'Cruiser',    length: 3, asset: '/ships/3x.png' },
  { id: 'submarine',  name: 'Submarine',  length: 3, asset: '/ships/3x_2.png' },
  { id: 'destroyer',  name: 'Destroyer',  length: 2, asset: '/ships/2x.png' },
] as const;

export const TOTAL_HITS_TO_WIN = SHIPS.reduce((sum, s) => sum + s.length, 0); // 17

export enum CellState {
  Empty = 0,
  Ship  = 1,
  Miss  = 2,
  Hit   = 3,
  Revealed = 4, // Ship detected but not hit yet
}
