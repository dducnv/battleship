'use client';

import { create } from 'zustand';

interface LobbyStore {
  // State
  roomId: string;
  userName: string;
  isConnected: boolean;
  isJoining: boolean;
  error: string | null;
  totalPlayers: number;

  // Actions
  setRoomId: (roomId: string) => void;
  setUserName: (name: string) => void;
  setConnected: (connected: boolean) => void;
  setJoining: (joining: boolean) => void;
  setError: (error: string | null) => void;
  setTotalPlayers: (count: number) => void;
  reset: () => void;
}

const initialState = {
  roomId: '',
  userName: '',
  isConnected: false,
  isJoining: false,
  error: null,
  totalPlayers: 0,
};

export const useLobbyStore = create<LobbyStore>((set) => ({
  ...initialState,

  setRoomId: (roomId) => set({ roomId, error: null }),
  setUserName: (userName) => set({ userName }),
  setConnected: (isConnected) => set({ isConnected }),
  setJoining: (isJoining) => set({ isJoining }),
  setError: (error) => set({ error, isJoining: false }),
  setTotalPlayers: (totalPlayers) => set({ totalPlayers }),
  reset: () => set(initialState),
}));
