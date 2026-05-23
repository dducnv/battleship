'use client';

import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

/**
 * Derived selectors for common game state queries.
 * Keeps components clean by centralizing derived state logic.
 */
export function useGamePhase() {
  return useGameStore(s => s.phase);
}

export function useIsMyTurn() {
  return useGameStore(s => s.isMyTurn);
}

export function useMyBoard() {
  return useGameStore(s => s.myBoard);
}

export function useTrackingBoard() {
  return useGameStore(s => s.trackingBoard);
}

export function useWinner() {
  const winnerId = useGameStore(s => s.winnerId);
  const mySocketId = useGameStore(s => s.mySocketId);
  if (!winnerId) return null;
  return winnerId === mySocketId ? 'victory' : 'defeat';
}

export function useConnectionStatus() {
  return useLobbyStore(s => ({
    isConnected: s.isConnected,
    roomId: s.roomId,
    error: s.error,
    totalPlayers: s.totalPlayers,
  }));
}
