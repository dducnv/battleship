'use client';

import { useEffect } from 'react';
import { supabase, myUserId, joinedAt, myUserName } from '../supabase/client';
import { useGameStore } from '../store/game-store';
import { useLobbyStore } from '../store/lobby-store';

interface PresenceState {
  userId: string;
  userName: string;
  ready: boolean;
  joinedAt: number;
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let activeRoomId: string | null = null;

const getSortedPlayers = (presenceState: Record<string, any>) => {
  return Object.values(presenceState)
    .flat()
    .sort((a: any, b: any) => (a.joinedAt || 0) - (b.joinedAt || 0))
    .map((p: any) => p.userId);
};

export function useSupabaseRoom(roomId?: string) {
  const attemptStart = () => {
    const store = useGameStore.getState();
    if (store.phase !== 'placing' || !store.myReady || !store.opponentReady) return;

    const presence = globalChannel?.presenceState();
    if (!presence) return;

    const players = getSortedPlayers(presence);
    if (players.length >= 2) {
      store.onGameStart(players[0]);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    
    // Check if we are already connected to this room
    if (activeRoomId === roomId && globalChannel && globalChannel.state === 'joined') {
      return;
    }

    if (globalChannel) {
      console.log('[Room] Cleaning up old connection');
      globalChannel.unsubscribe();
    }

    activeRoomId = roomId;
    const gameStore = useGameStore.getState();
    const lobbyStore = useLobbyStore.getState();

    lobbyStore.setRoomId(roomId);
    lobbyStore.setJoining(true);
    gameStore.setMySocketId(myUserId);

    console.log(`[Room] Connecting to: ${roomId}`);

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: myUserId },
      },
    });
    globalChannel = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const playersInRoom = getSortedPlayers(state);
      const allPresence = Object.values(state).reduce((acc: PresenceState[], val) => 
        acc.concat(val as unknown as PresenceState[]), []) as PresenceState[];

      const nameMap: Record<string, string> = {};
      allPresence.forEach(p => {
        nameMap[p.userId] = p.userName;
      });
      gameStore.syncState({ playerNames: nameMap });

      lobbyStore.setConnected(true);
      lobbyStore.setJoining(false);
      lobbyStore.setTotalPlayers(playersInRoom.length);

      const myIndex = playersInRoom.indexOf(myUserId);
      const isSpectator = myIndex >= 2;
      gameStore.setSpectator(isSpectator);
      gameStore.setPlayerIds(playersInRoom.slice(0, 2));

      if (isSpectator && gameStore.phase === 'waiting') {
        // New spectator joined, request current state
        channel.send({ type: 'broadcast', event: 'request_sync', payload: {} });
      }

      if (playersInRoom.length >= 2 && gameStore.phase === 'waiting') {
        gameStore.setPhase('placing');
      }

      const opponentId = playersInRoom.find(id => id !== myUserId && playersInRoom.indexOf(id) < 2);
      const opponentPresence = allPresence.find(p => p.userId === (opponentId || ''));
      if (opponentPresence?.ready) {
        gameStore.onOpponentReady(opponentId || undefined);
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

    channel.on('broadcast', { event: 'request_restart' }, () => {
      const currentUserName = useLobbyStore.getState().userName || myUserName;
      channel.track({ ready: false, userId: myUserId, userName: currentUserName, joinedAt });
      gameStore.reset();
      gameStore.setPhase('placing');
      gameStore.setMySocketId(myUserId);
    });

    channel.on('broadcast', { event: 'request_sync' }, () => {
      const state = channel.presenceState();
      const players = getSortedPlayers(state);
      const myIndex = players.indexOf(myUserId);
      
      if (myIndex === 0 || myIndex === 1) {
        const store = useGameStore.getState();
        channel.send({
          type: 'broadcast',
          event: 'sync_state',
          payload: {
            phase: store.phase,
            [myIndex === 0 ? 'player1Board' : 'player2Board']: store.myBoard,
            [myIndex === 0 ? 'player1Ships' : 'player2Ships']: store.myShips,
            activeTurnId: store.activeTurnId,
          }
        });
      }
    });

    channel.on('broadcast', { event: 'sync_state' }, (event) => {
      const store = useGameStore.getState();
      if (store.isSpectator && event.payload) {
        const { phase, player1Board, player2Board, player1Ships, player2Ships, activeTurnId } = event.payload;
        const updates: any = { phase, activeTurnId, isMyTurn: false };
        if (player1Board) updates.myBoard = player1Board;
        if (player2Board) updates.trackingBoard = player2Board;
        if (player1Ships) updates.myShips = player1Ships;
        if (player2Ships) updates.opponentShips = player2Ships; // We might need a new field for P2 ships in store
        store.syncState(updates);
      }
    });

    channel.subscribe((status) => {
      console.log(`[Room] Subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        lobbyStore.setConnected(true);
        const currentUserName = lobbyStore.userName || myUserName;
        channel.track({ ready: false, userId: myUserId, userName: currentUserName, joinedAt });
      } else if (status === 'CLOSED') {
        lobbyStore.setConnected(false);
      } else if (status === 'CHANNEL_ERROR') {
        lobbyStore.setError('Connection error. Please refresh or check your network.');
        console.error('[Room] Subscription error');
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
        const lobbyStore = useLobbyStore.getState();
        const currentUserName = lobbyStore.userName || myUserName;
        store.setMyReady(true);
        channel.track({ ready: true, userId: myUserId, userName: currentUserName, joinedAt });
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
    requestRestart: () => {
      const channel = globalChannel;
      if (channel) {
        const lobbyStore = useLobbyStore.getState();
        const currentUserName = lobbyStore.userName || myUserName;
        channel.track({ ready: false, userId: myUserId, userName: currentUserName, joinedAt });
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
