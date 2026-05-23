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
  autoPlace: () => void;
  canPlaceAt: (shipId: string, x: number, y: number, isHorizontal: boolean) => boolean;
  getUnplacedShips: () => typeof SHIPS[number][];
  isAllShipsPlaced: () => boolean;

  // ── Game Actions ──
  setPhase: (phase: GamePhase) => void;
  setMySocketId: (id: string) => void;
  setMyTurn: (isMyTurn: boolean) => void;

  // ── Server Event Handlers ──
  onGameStart: (activeTurnId: string) => void;
  onShotResult: (result: ShotResult) => void;
  onEnemyShot: (x: number, y: number, isHit: boolean) => void;
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
    // Enemy shot at my board → update my board visually
    const { myBoard } = get();
    const newBoard = myBoard.map(row => [...row]);
    newBoard[y][x] = isHit ? CellState.Hit : CellState.Miss;

    set({ myBoard: newBoard });
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
