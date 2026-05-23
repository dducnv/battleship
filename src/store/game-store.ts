'use client';

import { create } from 'zustand';
import { SHIPS, CellState } from '../game/constants';
import type { Board, GamePhase, PlacedShip, ShotResult } from '../game/types';
import {
  createEmptyBoard,
  canPlaceShip,
  placeShip as placeShipOnBoard,
  removeShip,
  autoPlaceAll,
  getShipDef,
} from '../game/board';

interface GameStore {
  // ── State ──
  phase: GamePhase;
  myBoard: Board;
  myShips: PlacedShip[];
  trackingBoard: Board; // records my shots on enemy board
  opponentBoard: Board | null; // revealed at game end
  isMyTurn: boolean;
  winnerId: string | null;
  mySocketId: string | null;
  selectedShipId: string | null; // currently selected ship for placement
  isHorizontal: boolean; // placement orientation
  lastShotResult: ShotResult | null;
  opponentReady: boolean;

  // ── Placement Actions ──
  selectShip: (shipId: string | null) => void;
  toggleOrientation: () => void;
  placeSelectedShip: (x: number, y: number) => boolean;
  removeShipById: (shipId: string) => void;
  rotateShipInPlace: (shipId: string) => boolean;
  autoPlace: () => void;
  canPlaceAt: (shipId: string, x: number, y: number, isHorizontal: boolean) => boolean;
  getUnplacedShips: () => typeof SHIPS[number][];
  isAllShipsPlaced: () => boolean;

  // ── Game Actions ──
  setPhase: (phase: GamePhase) => void;
  setMySocketId: (id: string) => void;
  setMyTurn: (isMyTurn: boolean) => void;

  // ── Server / Peer Event Handlers ──
  onGameStart: (activeTurnId: string) => void;
  onShotResult: (result: ShotResult) => void;
  onEnemyShot: (x: number, y: number, isHit: boolean) => void;
  receiveEnemyShot: (x: number, y: number) => { isHit: boolean; isSunk: boolean; sunkShipId: string | null; isGameOver: boolean } | null;
  onGameOver: (winnerId: string, opponentBoard?: Board) => void;
  onOpponentReady: () => void;

  // ── Reset ──
  reset: () => void;
}

const createInitialState = () => ({
  phase: 'waiting' as GamePhase,
  myBoard: createEmptyBoard(),
  myShips: [] as PlacedShip[],
  trackingBoard: createEmptyBoard(),
  opponentBoard: null as Board | null,
  isMyTurn: false,
  winnerId: null as string | null,
  mySocketId: null as string | null,
  selectedShipId: null as string | null,
  isHorizontal: true,
  lastShotResult: null as ShotResult | null,
  opponentReady: false,
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  // ── Placement ──

  selectShip: (shipId) => set({ selectedShipId: shipId }),

  toggleOrientation: () => set((s) => ({ isHorizontal: !s.isHorizontal })),

  placeSelectedShip: (x, y) => {
    const { selectedShipId, myBoard, isHorizontal, myShips } = get();
    if (!selectedShipId) return false;

    const shipDef = getShipDef(selectedShipId);
    if (!shipDef) return false;

    // Already placed?
    if (myShips.some(s => s.id === selectedShipId)) return false;

    if (!canPlaceShip(myBoard, shipDef.length, x, y, isHorizontal)) return false;

    const { board, coordinates } = placeShipOnBoard(myBoard, shipDef.length, x, y, isHorizontal);

    set({
      myBoard: board,
      myShips: [...myShips, { id: selectedShipId, coordinates, hitCount: 0 }],
      selectedShipId: null, // deselect after placing
    });
    return true;
  },

  removeShipById: (shipId) => {
    const { myBoard, myShips } = get();
    const ship = myShips.find(s => s.id === shipId);
    if (!ship) return;

    set({
      myBoard: removeShip(myBoard, ship.coordinates),
      myShips: myShips.filter(s => s.id !== shipId),
    });
  },

  rotateShipInPlace: (shipId) => {
    const { myBoard, myShips } = get();
    const ship = myShips.find(s => s.id === shipId);
    if (!ship) return false;

    const shipDef = getShipDef(shipId);
    if (!shipDef) return false;

    // 1. Determine current orientation
    const isHorizontal = ship.coordinates.length > 1 &&
      ship.coordinates[0][1] === ship.coordinates[1][1];

    // 2. Pivot is the first coordinate
    const [pivotX, pivotY] = ship.coordinates[0];

    // 3. Remove the ship temporarily
    const boardWithoutShip = removeShip(myBoard, ship.coordinates);

    // 4. Calculate new orientation and adjust boundaries (slide inward)
    const newHorizontal = !isHorizontal;
    let startX = pivotX;
    let startY = pivotY;

    if (newHorizontal) {
      if (startX + shipDef.length > 10) {
        startX = 10 - shipDef.length;
      }
    } else {
      if (startY + shipDef.length > 10) {
        startY = 10 - shipDef.length;
      }
    }

    // 5. Place ship in new orientation if valid
    if (canPlaceShip(boardWithoutShip, shipDef.length, startX, startY, newHorizontal)) {
      const { board, coordinates } = placeShipOnBoard(boardWithoutShip, shipDef.length, startX, startY, newHorizontal);
      set({
        myBoard: board,
        myShips: myShips.map(s => s.id === shipId ? { ...s, coordinates } : s),
      });
      return true;
    }

    return false;
  },

  autoPlace: () => {
    const { board, placedShips } = autoPlaceAll();
    set({
      myBoard: board,
      myShips: placedShips,
      selectedShipId: null,
    });
  },

  canPlaceAt: (shipId, x, y, isHorizontal) => {
    const shipDef = getShipDef(shipId);
    if (!shipDef) return false;
    return canPlaceShip(get().myBoard, shipDef.length, x, y, isHorizontal);
  },

  getUnplacedShips: () => {
    const placedIds = get().myShips.map(s => s.id);
    return SHIPS.filter(s => !placedIds.includes(s.id)) as unknown as typeof SHIPS[number][];
  },

  isAllShipsPlaced: () => {
    return get().myShips.length === SHIPS.length;
  },

  // ── Game ──

  setPhase: (phase) => set({ phase }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setMyTurn: (isMyTurn) => set({ isMyTurn }),

  // ── Server Event Handlers ──

  onGameStart: (activeTurnId) => {
    const { mySocketId } = get();
    set({
      phase: 'playing',
      isMyTurn: activeTurnId === mySocketId,
    });
  },

  onShotResult: (result) => {
    // This is MY shot result → update tracking board
    const { trackingBoard } = get();
    const newTracking = trackingBoard.map(row => [...row]);
    newTracking[result.y][result.x] = result.isHit ? CellState.Hit : CellState.Miss;

    set({
      trackingBoard: newTracking,
      isMyTurn: result.nextTurnId === get().mySocketId,
      lastShotResult: result,
    });
  },

  onEnemyShot: (x, y, isHit) => {
    // Enemy shot at my board → update my board visually (if not using receiveEnemyShot directly)
    const { myBoard } = get();
    const newBoard = myBoard.map(row => [...row]);
    newBoard[y][x] = isHit ? CellState.Hit : CellState.Miss;

    set({ myBoard: newBoard });
  },

  receiveEnemyShot: (x, y) => {
    const { myBoard, myShips } = get();
    
    // Quick validation
    if (x < 0 || x >= 10 || y < 0 || y >= 10) return null;
    const cell = myBoard[y][x];
    if (cell === CellState.Miss || cell === CellState.Hit) return null; // Already shot
    
    let isHit = false;
    let isSunk = false;
    let sunkShipId: string | null = null;
    let newBoard = myBoard.map(row => [...row]);
    let newShips = [...myShips];

    if (cell === CellState.Ship) {
      isHit = true;
      newBoard[y][x] = CellState.Hit;
      
      newShips = myShips.map(ship => {
        const isThisShip = ship.coordinates.some(([cx, cy]) => cx === x && cy === y);
        if (!isThisShip) return ship;
        
        const newHitCount = ship.hitCount + 1;
        if (newHitCount === ship.coordinates.length) {
          isSunk = true;
          sunkShipId = ship.id;
        }
        return { ...ship, hitCount: newHitCount };
      });
    } else {
      newBoard[y][x] = CellState.Miss;
    }

    const totalHits = newShips.reduce((sum, s) => sum + s.hitCount, 0);
    const isGameOver = totalHits >= 17;

    set({
      myBoard: newBoard,
      myShips: newShips,
    });

    return { isHit, isSunk, sunkShipId, isGameOver };
  },

  onGameOver: (winnerId, opponentBoard) => {
    set({
      phase: 'ended',
      winnerId,
      opponentBoard: opponentBoard ?? null,
    });
  },

  onOpponentReady: () => set({ opponentReady: true }),

  // ── Reset ──
  reset: () => set(createInitialState()),
}));
