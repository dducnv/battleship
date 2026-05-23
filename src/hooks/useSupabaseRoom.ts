'use client';

import { useEffect, useRef } from 'react';
import { supabase, myUserId } from '../supabase/client';
import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

// Let's implement nanoid locally
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let activeRoomId: string | null = null;

/**
 * Hook that manages Supabase Realtime channel lifecycle and P2P game logic.
 */
export function useSupabaseRoom(roomId?: string) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    if (activeRoomId === roomId && globalChannel) {
      // Already connected or connecting to this room globally
      return;
    }

    if (globalChannel) {
      globalChannel.unsubscribe();
    }

    activeRoomId = roomId;
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
    globalChannel = channel;

    // ── Presence (Player Join/Leave & Ready Sync) ──
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const playersInRoom = Object.keys(state);
      const allPresence = Object.values(state).flat() as unknown as { userId: string; ready?: boolean }[];

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
        useGameStore.getState().onOpponentReady(opponent.userId);
      }

      // Check if BOTH players in room are ready, start the game
      const isIReady = useGameStore.getState().myReady;
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
      useGameStore.getState().onOpponentReady(payload.userId);

      // If I am also ready, we should start the game.
      // To decide who goes first in P2P without server, we can sort userIds
      const myState = useGameStore.getState();
      if (myState.phase === 'placing' && myState.myReady) {
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

      if (!result) return; // Invalid shot (already shot or out of bounds)

      // If it's a hit, attacker keeps turn. If miss, turn passes to me.
      const nextTurnId = result.isHit ? attackerId : myUserId;

      const shotResult = {
        ...result,
        attackerId,
        x,
        y,
        nextTurnId,
      };

      // I broadcast the result back
      channel.send({
        type: 'broadcast',
        event: 'shot_result',
        payload: shotResult
      });

      // Update my own store locally as the defender
      store.onShotResult(shotResult);

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
      // Reset presence track to not ready
      if (globalChannel) {
        globalChannel.track({ ready: false, userId: myUserId });
      }
      useGameStore.getState().reset();
      useGameStore.getState().setPhase('placing');
      useGameStore.getState().setMySocketId(myUserId);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Use setTimeout to avoid 'falling back to REST API' race condition
        setTimeout(() => {
          if (globalChannel?.state === 'joined') {
            globalChannel.track({ ready: false, userId: myUserId });
          }
        }, 100);
      } else if (status === 'CLOSED') {
        lobbyStore.setConnected(false);
      } else if (status === 'CHANNEL_ERROR') {
        lobbyStore.setError('Failed to connect to room');
      }
    });

    return () => {
      // Intentionally empty: keep channel alive across page navigations
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
      const channel = globalChannel;
      if (channel) {
        const store = useGameStore.getState();
        store.setMyReady(true);

        const sendReady = () => {
          channel.track({ ready: true, userId: myUserId });
          channel.send({
            type: 'broadcast',
            event: 'player_ready',
            payload: { userId: myUserId }
          });
        };

        if (channel.state !== 'joined') {
          // If disconnected due to HMR or network, wait a bit
          setTimeout(sendReady, 500);
        } else {
          sendReady();
        }

        // Also check if opponent is already ready to start the game
        if (store.opponentReady) {
          const state = channel.presenceState();
          const players = Object.keys(state);
          const presenceOpponentId = players.find(id => id !== myUserId);
          const opponentId = store.opponentId || presenceOpponentId || 'opponent';

          const sortedIds = [myUserId, opponentId].sort();
          const firstTurnId = sortedIds[0];
          store.onGameStart(firstTurnId);
        }
      }
    },
    fireShot: (x: number, y: number) => {
      const channel = globalChannel;
      if (channel && channel.state === 'joined') {
        channel.send({
          type: 'broadcast',
          event: 'fire_shot',
          payload: { attackerId: myUserId, x, y }
        });
      }
    },
    requestRestart: () => {
      const channel = globalChannel;
      if (channel) {
        // Reset presence track to not ready
        channel.track({ ready: false, userId: myUserId });

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
      if (globalChannel) {
        globalChannel.unsubscribe();
        globalChannel = null;
        activeRoomId = null;
      }
      useLobbyStore.getState().reset();
      useGameStore.getState().reset();
    },
  };
}
