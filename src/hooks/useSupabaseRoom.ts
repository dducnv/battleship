'use client';

import { useEffect } from 'react';
import { supabase, myUserId } from '../supabase/client';
import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

interface PresenceState {
  userId: string;
  ready: boolean;
  [key: string]: unknown;
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let activeRoomId: string | null = null;

export function useSupabaseRoom(roomId?: string) {
  const attemptStart = () => {
    const store = useGameStore.getState();
    if (store.phase !== 'placing' || !store.myReady || !store.opponentReady) return;

    const players = Object.keys(globalChannel?.presenceState() || {}).sort();
    if (players.length >= 2) {
      store.onGameStart(players[0]);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    if (activeRoomId === roomId && globalChannel) return;

    if (globalChannel) {
      globalChannel.unsubscribe();
    }

    activeRoomId = roomId;
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

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const playersInRoom = Object.keys(state).sort();
      // Use reduce instead of flat() for better browser compatibility
      const allPresence = Object.values(state).reduce((acc: PresenceState[], val) => 
        acc.concat(val as unknown as PresenceState[]), []) as PresenceState[];

      lobbyStore.setConnected(true);
      lobbyStore.setJoining(false);
      lobbyStore.setTotalPlayers(playersInRoom.length);

      const myIndex = playersInRoom.indexOf(myUserId);
      gameStore.setSpectator(myIndex >= 2);

      if (playersInRoom.length >= 2 && gameStore.phase === 'waiting') {
        gameStore.setPhase('placing');
      }

      const opponentId = playersInRoom.find(id => id !== myUserId && playersInRoom.indexOf(id) < 2);
      const opponentPresence = allPresence.find(p => p.userId === opponentId);
      if (opponentPresence?.ready) {
        gameStore.onOpponentReady(opponentId);
      }

      attemptStart();

      if (playersInRoom.length < 2 && gameStore.phase === 'playing') {
        lobbyStore.setError('Opponent disconnected');
        gameStore.reset();
      }
    });

    channel.on('broadcast', { event: 'player_ready' }, (event) => {
      const payload = event.payload;
      if (!payload || payload.userId === myUserId) return;
      
      gameStore.onOpponentReady(payload.userId);
      attemptStart();
    });

    channel.on('broadcast', { event: 'fire_shot' }, (event) => {
      const payload = event.payload;
      if (!payload) return;
      
      const { x, y, attackerId } = payload;
      const store = useGameStore.getState();
      if (store.isSpectator) return;

      const result = store.receiveEnemyShot(x, y);
      if (!result) return;

      const nextTurnId = result.isHit ? attackerId : myUserId;
      const shotResult = { ...result, attackerId, x, y, nextTurnId };

      channel.send({ type: 'broadcast', event: 'shot_result', payload: shotResult });
      store.onShotResult(shotResult);

      if (result.isGameOver) {
        channel.send({
          type: 'broadcast',
          event: 'game_over',
          payload: { winnerId: attackerId, opponentBoard: store.myBoard }
        });
        store.onGameOver(attackerId, undefined);
      }
    });

    channel.on('broadcast', { event: 'shot_result' }, (event) => {
      if (event.payload) {
        useGameStore.getState().onShotResult(event.payload);
      }
    });

    channel.on('broadcast', { event: 'game_over' }, (event) => {
      if (event.payload) {
        useGameStore.getState().onGameOver(event.payload.winnerId, event.payload.opponentBoard);
      }
    });

    channel.on('broadcast', { event: 'request_radar' }, (event) => {
      const payload = event.payload;
      if (!payload || payload.requesterId === myUserId) return;
      
      const { x, y, requesterId } = payload;
      const store = useGameStore.getState();
      const results = store.receiveRadarRequest(x, y);
      channel.send({ type: 'broadcast', event: 'radar_response', payload: { results, targetId: requesterId } });
    });

    channel.on('broadcast', { event: 'radar_response' }, (event) => {
      const payload = event.payload;
      if (!payload || payload.targetId !== myUserId) return;
      
      useGameStore.getState().onRadarResult(payload.results);
    });

    channel.on('broadcast', { event: 'request_restart' }, () => {
      channel.track({ ready: false, userId: myUserId });
      gameStore.reset();
      gameStore.setPhase('placing');
      gameStore.setMySocketId(myUserId);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Wait a small bit to ensure connection is stable before tracking
        setTimeout(() => {
          channel.track({ ready: false, userId: myUserId });
        }, 100);
      } else if (status === 'CLOSED') {
        lobbyStore.setConnected(false);
      } else if (status === 'CHANNEL_ERROR') {
        lobbyStore.setError('Failed to connect. Make sure Supabase Realtime is enabled in your project settings.');
      }
    });

    return () => {};
  }, [roomId]);

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
        channel.track({ ready: true, userId: myUserId });
        channel.send({ type: 'broadcast', event: 'player_ready', payload: { userId: myUserId } });
        attemptStart();
      }
    },
    fireShot: (x: number, y: number) => {
      const channel = globalChannel;
      if (channel) {
        channel.send({ type: 'broadcast', event: 'fire_shot', payload: { attackerId: myUserId, x, y } });
      }
    },
    requestRadar: (x: number, y: number) => {
      const channel = globalChannel;
      if (channel) {
        channel.send({ type: 'broadcast', event: 'request_radar', payload: { requesterId: myUserId, x, y } });
      }
    },
    requestRestart: () => {
      const channel = globalChannel;
      if (channel) {
        channel.track({ ready: false, userId: myUserId });
        channel.send({ type: 'broadcast', event: 'request_restart', payload: {} });
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
