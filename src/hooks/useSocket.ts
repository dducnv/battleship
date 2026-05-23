'use client';

import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../socket/client';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../socket/events';
import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

/**
 * Hook that manages socket lifecycle and binds server events to store actions.
 * Should be called once at the game room level.
 */
export function useSocket(roomId?: string) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const socket = connectSocket();
    const gameStore = useGameStore.getState();
    const lobbyStore = useLobbyStore.getState();

    // Connection status
    socket.on('connect', () => {
      lobbyStore.setConnected(true);
      gameStore.setMySocketId(socket.id!);
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', () => {
      lobbyStore.setConnected(false);
      console.log('[Socket] Disconnected');
    });

    // ── Lobby Events ──

    socket.on(SERVER_EVENTS.ROOM_CREATED, ({ roomId }: { roomId: string }) => {
      lobbyStore.setRoomId(roomId);
      lobbyStore.setTotalPlayers(1);
    });

    socket.on(SERVER_EVENTS.ROOM_JOINED, ({ roomId, totalPlayers }: { roomId: string; totalPlayers: number }) => {
      lobbyStore.setRoomId(roomId);
      lobbyStore.setTotalPlayers(totalPlayers);
      lobbyStore.setJoining(false);
    });

    socket.on(SERVER_EVENTS.ERROR, ({ message }: { message: string }) => {
      lobbyStore.setError(message);
    });

    // ── Game Events ──

    socket.on(SERVER_EVENTS.START_PLACEMENT, () => {
      useGameStore.getState().setPhase('placing');
    });

    socket.on(SERVER_EVENTS.GAME_START, ({ activeTurnId }: { activeTurnId: string }) => {
      useGameStore.getState().onGameStart(activeTurnId);
    });

    socket.on(SERVER_EVENTS.SHOT_RESULT, (data: {
      attackerId: string;
      x: number;
      y: number;
      isHit: boolean;
      isSunk: boolean;
      sunkShipId: string | null;
      nextTurnId: string;
    }) => {
      const store = useGameStore.getState();
      const myId = store.mySocketId;

      if (data.attackerId === myId) {
        // My shot → update tracking board
        store.onShotResult(data);
      } else {
        // Enemy shot at my board
        store.onEnemyShot(data.x, data.y, data.isHit);
        // Also update turn
        store.setMyTurn(data.nextTurnId === myId);
      }
    });

    socket.on(SERVER_EVENTS.GAME_OVER, ({ winnerId, opponentBoard }: { winnerId: string; opponentBoard?: number[][] }) => {
      useGameStore.getState().onGameOver(winnerId, opponentBoard);
    });

    socket.on('opponent_ready', () => {
      useGameStore.getState().onOpponentReady();
    });

    socket.on(SERVER_EVENTS.ROOM_RESET, () => {
      useGameStore.getState().reset();
      useGameStore.getState().setPhase('placing');
      useGameStore.getState().setMySocketId(socket.id!);
    });

    socket.on(SERVER_EVENTS.PLAYER_DISCONNECTED, () => {
      lobbyStore.setError('Opponent disconnected');
      useGameStore.getState().reset();
    });

    // If roomId provided, auto-join
    if (roomId) {
      lobbyStore.setJoining(true);
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
    }

    return () => {
      // Cleanup is handled by disconnectSocket when navigating away
    };
  }, [roomId]);

  // Expose emit helpers
  return {
    createRoom: () => {
      const socket = getSocket();
      socket.emit(CLIENT_EVENTS.CREATE_ROOM, {});
    },
    joinRoom: (roomId: string) => {
      const socket = getSocket();
      useLobbyStore.getState().setJoining(true);
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
    },
    playerReady: (board: number[][], shipsPlaced: unknown[]) => {
      const socket = getSocket();
      const roomId = useLobbyStore.getState().roomId;
      socket.emit(CLIENT_EVENTS.PLAYER_READY, { roomId, board, shipsPlaced });
    },
    fireShot: (x: number, y: number) => {
      const socket = getSocket();
      const roomId = useLobbyStore.getState().roomId;
      socket.emit(CLIENT_EVENTS.FIRE_SHOT, { roomId, x, y });
    },
    requestRestart: () => {
      const socket = getSocket();
      const roomId = useLobbyStore.getState().roomId;
      socket.emit(CLIENT_EVENTS.REQUEST_RESTART, { roomId });
    },
    disconnect: () => {
      disconnectSocket();
    },
  };
}
