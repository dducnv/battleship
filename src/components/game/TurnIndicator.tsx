'use client';

import { useGameStore } from '../../store/game-store';
import { Target, Circle } from 'lucide-react';

export default function TurnIndicator() {
  const isMyTurn = useGameStore(s => s.isMyTurn);
  const isSpectator = useGameStore(s => s.isSpectator);
  const activeTurnId = useGameStore(s => s.activeTurnId);
  const playerIds = useGameStore(s => s.playerIds);
  const lastShotResult = useGameStore(s => s.lastShotResult);

  const getTurnText = () => {
    if (isSpectator) {
      const playerIndex = playerIds.indexOf(activeTurnId || '');
      return playerIndex !== -1 ? `Player ${playerIndex + 1}'s Turn` : 'Waiting for turn...';
    }
    return isMyTurn ? 'Your Turn — Fire!' : 'Enemy is aiming...';
  };

  const isActive = isSpectator ? !!activeTurnId : isMyTurn;

  return (
    <div className={`turn-indicator ${isActive ? 'turn-indicator--my-turn' : 'turn-indicator--enemy-turn'}`}>
      <div className="turn-indicator__status">
        <div className={`turn-indicator__dot ${isActive ? 'turn-indicator__dot--active' : ''}`} />
        <span className="turn-indicator__text">
          {getTurnText()}
        </span>
      </div>

      {lastShotResult && (
        <div className={`turn-indicator__last-shot ${lastShotResult.isHit ? 'turn-indicator__last-shot--hit' : 'turn-indicator__last-shot--miss'}`}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastShotResult.isHit ? <Target size={16} /> : <Circle size={16} />}
            {lastShotResult.isHit ? 'HIT!' : 'Miss'}
            {lastShotResult.isSunk && ` — ${lastShotResult.sunkShipId} sunk!`}
          </span>
        </div>
      )}
    </div>
  );
}
