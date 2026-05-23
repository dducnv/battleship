'use client';

import { useGameStore } from '../../store/game-store';
import { useWinner } from '../../hooks/useGameState';

interface GameOverModalProps {
  onRestart: () => void;
  onLeave: () => void;
}

export default function GameOverModal({ onRestart, onLeave }: GameOverModalProps) {
  const result = useWinner();

  if (!result) return null;

  const isVictory = result === 'victory';

  return (
    <div className="modal-overlay">
      <div className={`modal game-over-modal ${isVictory ? 'game-over-modal--victory' : 'game-over-modal--defeat'}`}>
        <div className="game-over-modal__icon">
          {isVictory ? '🏆' : '💀'}
        </div>
        <h2 className="game-over-modal__title">
          {isVictory ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="game-over-modal__subtitle">
          {isVictory
            ? 'You sank all enemy ships!'
            : 'Your fleet has been destroyed.'}
        </p>

        <div className="game-over-modal__actions">
          <button className="btn btn--primary" onClick={onRestart}>
            🔄 Rematch
          </button>
          <button className="btn btn--secondary" onClick={onLeave}>
            🚪 Leave
          </button>
        </div>
      </div>
    </div>
  );
}
