'use client';

import { useEffect, useRef } from 'react';
import { supabase, myUserId } from '../supabase/client';
import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

// Let's implement nanoid locally
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Hook that manages Supabase Realtime channel lifecycle and P2P game logic.
 */
export function useSupabaseRoom(roomId?: string) {
  const hasInitialized = useRef(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const gameStore = useGameStore.getState();
    const lobbyStore = useLobbyStore.getState();

    lobbyStore.setRoomId(roomId);
    lobbyStore.setJoining(true);
    gameStore.setMySocketId(myUserId);

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: myUserId },
      },
    });
    channelRef.current = channel;

    // ── Presence (Player Join/Leave & Ready Sync) ──
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const playersInRoom = Object.keys(state);
      const allPresence = Object.values(state).flat() as any[];

      lobbyStore.setConnected(true);
      lobbyStore.setJoining(false);
      lobbyStore.setTotalPlayers(playersInRoom.length);

      // If 2 players are here and we are in waiting phase, start placement
      if (playersInRoom.length === 2 && useGameStore.getState().phase === 'waiting') {
        useGameStore.getState().setPhase('placing');
      }

      // Check if opponent is ready via presence
      const opponent = allPresence.find(p => p.userId !== myUserId);
      if (opponent && opponent.ready === true) {
        useGameStore.getState().onOpponentReady();
      }

      // Check if BOTH players in room are ready, start the game
      const myPresence = allPresence.find(p => p.userId === myUserId);
      const isIReady = myPresence?.ready === true;
      const isOpponentReady = opponent?.ready === true;

      if (playersInRoom.length === 2 && isIReady && isOpponentReady) {
        const myState = useGameStore.getState();
        if (myState.phase === 'placing') {
          // Sort userIds deterministically to decide who goes first in P2P
          const sortedIds = allPresence.map(p => p.userId).sort();
          const firstTurnId = sortedIds[0];
          myState.onGameStart(firstTurnId);
        }
      }

      // If opponent left during playing
      if (playersInRoom.length < 2 && useGameStore.getState().phase !== 'waiting') {
        lobbyStore.setError('Opponent disconnected');
        useGameStore.getState().reset();
      }
    });

    // ── Broadcast Events (P2P Gameplay) ──

    // 1. Opponent is ready with their board
    channel.on('broadcast', { event: 'player_ready' }, ({ payload }) => {
      useGameStore.getState().onOpponentReady();

      // If I am also ready, we should start the game.
      // To decide who goes first in P2P without server, we can sort userIds
      const myState = useGameStore.getState();
      if (myState.phase === 'placing' && myState.isAllShipsPlaced()) {
        const sortedIds = [myUserId, payload.userId].sort();
        const firstTurnId = sortedIds[0];
        myState.onGameStart(firstTurnId);
      }
    });

    // 2. Opponent fired a shot at my board
    channel.on('broadcast', { event: 'fire_shot' }, ({ payload }) => {
      const { x, y, attackerId } = payload;

      // I process the shot on my board
      const store = useGameStore.getState();
      const result = store.receiveEnemyShot(x, y);

      if (!result) return; // Invalid shot

      // I broadcast the result back
      const nextTurnId = myUserId; // Turn passes to me
      channel.send({
        type: 'broadcast',
        event: 'shot_result',
        payload: {
          ...result,
          attackerId,
          x,
          y,
          nextTurnId,
        }
      });

      // If that shot ended the game (all my ships sunk)
      if (result.isGameOver) {
        channel.send({
          type: 'broadcast',
          event: 'game_over',
          payload: {
            winnerId: attackerId,
            opponentBoard: store.myBoard // Reveal my board
          }
        });
        store.onGameOver(attackerId, undefined); // I lost
      }
    });

    // 3. I receive the result of the shot I fired
    channel.on('broadcast', { event: 'shot_result' }, ({ payload }) => {
      if (payload.attackerId === myUserId) {
        useGameStore.getState().onShotResult(payload);
      }
    });

    // 4. Game Over event received (Opponent lost and revealed board)
    channel.on('broadcast', { event: 'game_over' }, ({ payload }) => {
      useGameStore.getState().onGameOver(payload.winnerId, payload.opponentBoard);
    });

    // 5. Restart requested
    channel.on('broadcast', { event: 'request_restart' }, () => {
      useGameStore.getState().reset();
      useGameStore.getState().setPhase('placing');
      useGameStore.getState().setMySocketId(myUserId);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ ready: false, userId: myUserId });
      } else if (status === 'CLOSED') {
        lobbyStore.setConnected(false);
      } else if (status === 'CHANNEL_ERROR') {
        lobbyStore.setError('Failed to connect to room');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  // Return emit helpers
  return {
    createRoom: () => {
      const id = generateRoomId();
      useLobbyStore.getState().setRoomId(id);
      return id;
    },
    joinRoom: (id: string) => {
      useLobbyStore.getState().setRoomId(id);
      return id;
    },
    playerReady: () => {
      const channel = channelRef.current;
      if (channel) {
        const store = useGameStore.getState();
        store.setMyReady(true);

        // Track ready state in Presence (syncs automatically to opponent)
        channel.track({ ready: true, userId: myUserId });

        // Send a redundant broadcast just in case
        channel.send({
          type: 'broadcast',
          event: 'player_ready',
          payload: { userId: myUserId }
        });

        // Also check if opponent is already ready to start the game
        if (store.opponentReady) {
          const state = channel.presenceState();
          const players = Object.keys(state);
          const opponentId = players.find(id => id !== myUserId) || 'opponent';

          const sortedIds = [myUserId, opponentId].sort();
          const firstTurnId = sortedIds[0];
          store.onGameStart(firstTurnId);
        }
      }
    },
    fireShot: (x: number, y: number) => {
      const channel = channelRef.current;
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'fire_shot',
          payload: { attackerId: myUserId, x, y }
        });
      }
    },
    requestRestart: () => {
      const channel = channelRef.current;
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'request_restart',
          payload: {}
        });
        // Also reset my own
        useGameStore.getState().reset();
        useGameStore.getState().setPhase('placing');
        useGameStore.getState().setMySocketId(myUserId);
      }
    },
    disconnect: () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      useLobbyStore.getState().reset();
      useGameStore.getState().reset();
    },
  };
}
