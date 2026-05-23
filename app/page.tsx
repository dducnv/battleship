'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseRoom } from '../src/hooks/useSupabaseRoom';
import { useLobbyStore } from '../src/store/lobby-store';
import { useGameStore } from '../src/store/game-store';
import CreateRoom from '../src/components/lobby/CreateRoom';
import JoinRoom from '../src/components/lobby/JoinRoom';
import StatusBar from '../src/components/shared/StatusBar';
import { Crosshair } from 'lucide-react';
import { useEffect } from 'react';

export default function LobbyPage() {
  const router = useRouter();
  const { createRoom, joinRoom } = useSupabaseRoom();
  const roomId = useLobbyStore(s => s.roomId);
  const isJoining = useLobbyStore(s => s.isJoining);
  const error = useLobbyStore(s => s.error);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);
  const phase = useGameStore(s => s.phase);

  // Navigate to game room when placement starts
  useEffect(() => {
    if (phase === 'placing' && roomId) {
      router.push(`/game/${roomId}`);
    }
  }, [phase, roomId, router]);

  return (
    <div className="lobby-page">
      <StatusBar />

      <div className="lobby-header">
        <div className="lobby-header__icon">
          <Crosshair size={48} strokeWidth={1.5} />
        </div>
        <h1 className="lobby-header__title">Battleship</h1>
        <p className="lobby-header__subtitle">Sink the enemy fleet. Dominate the seas.</p>
      </div>

      <div className="lobby-cards">
        <CreateRoom
          roomId={roomId || null}
          onCreate={createRoom}
        />
        <div className="lobby-divider">
          <span>OR</span>
        </div>
        <JoinRoom
          onJoin={joinRoom}
          isJoining={isJoining}
          error={error}
        />
      </div>

      {totalPlayers === 1 && roomId && (
        <div className="lobby-waiting">
          <div className="lobby-waiting__spinner" />
          <p>Waiting for opponent to join room <strong>{roomId}</strong>...</p>
        </div>
      )}
    </div>
  );
}
