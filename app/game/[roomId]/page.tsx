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
import { useAudio } from '../../../src/hooks/useAudio';
import { use } from 'react';

export default function GameRoom({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { playerReady, fireShot, requestRestart, disconnect } = useSupabaseRoom(roomId);
  const phase = useGameStore(s => s.phase);
  const error = useLobbyStore(s => s.error);
  const isMyTurn = useGameStore(s => s.isMyTurn);
  const lastShotResult = useGameStore(s => s.lastShotResult);
  const winnerId = useGameStore(s => s.winnerId);
  const mySocketId = useGameStore(s => s.mySocketId);

  const { playSound, startTheme, stopTheme } = useAudio();

  // Handle errors (e.g., room not found, opponent disconnected)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  // Audio Effects Lifecycle
  useEffect(() => {
    if (phase === 'playing') {
      startTheme();
    } else {
      stopTheme();
    }
  }, [phase, startTheme, stopTheme]);

  useEffect(() => {
    if (phase === 'playing' && isMyTurn) {
      playSound('your_turn');
    }
  }, [isMyTurn, phase]);

  useEffect(() => {
    if (lastShotResult) {
      // Play shot sound first
      playSound('shot');
      // If it was a hit, play explosion shortly after
      if (lastShotResult.isHit) {
        setTimeout(() => playSound('explosion'), 300);
        
        // Trigger screen shake
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 400);

        // If the ship was sunk, play the death flash sound
        if (lastShotResult.isSunk) {
          setTimeout(() => playSound('sunk'), 800);
        }
      }
    }
  }, [lastShotResult, playSound]);

  useEffect(() => {
    if (phase === 'ended') {
      if (winnerId === mySocketId) {
        playSound('win');
      } else {
        playSound('lose');
      }
    }
  }, [phase, winnerId, mySocketId]);

  const handleReady = () => {
    playerReady();
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
