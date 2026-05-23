'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseRoom } from '../../../src/hooks/useSupabaseRoom';
import { useGameStore } from '../../../src/store/game-store';
import { useLobbyStore } from '../../../src/store/lobby-store';
import StatusBar from '../../../src/components/shared/StatusBar';
import PlacementView from '../../../src/components/game/PlacementView';
import BattleView from '../../../src/components/game/BattleView';
import GameOverModal from '../../../src/components/game/GameOverModal';
import { use } from 'react';

export default function GameRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { playerReady, fireShot, requestRestart, disconnect } = useSupabaseRoom(roomId);
  const phase = useGameStore(s => s.phase);
  const error = useLobbyStore(s => s.error);

  // Handle errors (e.g., room not found, opponent disconnected)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  const handleReady = (board: number[][], shipsPlaced: unknown[]) => {
    playerReady(board, shipsPlaced);
  };

  const handleRestart = () => {
    requestRestart();
  };

  const handleLeave = () => {
    disconnect();
    router.push('/');
  };

  return (
    <div className="game-page">
      <StatusBar />

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <p className="error-banner__sub">Redirecting to lobby...</p>
        </div>
      )}

      {!error && (
        <>
          {phase === 'waiting' && (
            <div className="waiting-screen">
              <div className="waiting-screen__spinner" />
              <h2>Waiting for opponent...</h2>
              <p>Share the room code with a friend</p>
            </div>
          )}

          {phase === 'placing' && (
            <PlacementView onReady={handleReady} />
          )}

          {phase === 'playing' && (
            <BattleView onFireShot={fireShot} />
          )}

          {phase === 'ended' && (
            <GameOverModal onRestart={handleRestart} onLeave={handleLeave} />
          )}
        </>
      )}
    </div>
  );
}
