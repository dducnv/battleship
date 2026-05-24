'use client';

import { useCallback, useState, useEffect } from 'react';
import Grid from '../board/Grid';
import TurnIndicator from './TurnIndicator';
import { useGameStore } from '../../store/game-store';
import { CellState } from '../../game/constants';
import { Wind } from 'lucide-react';

interface BattleViewProps {
  onFireShot: (x: number, y: number) => void;
}

export default function BattleView({ onFireShot }: BattleViewProps) {
  const myBoard = useGameStore(s => s.myBoard);
  const myShips = useGameStore(s => s.myShips);
  const trackingBoard = useGameStore(s => s.trackingBoard);
  const isMyTurn = useGameStore(s => s.isMyTurn);
  const isSpectator = useGameStore(s => s.isSpectator);
  const lastEnemyShot = useGameStore(s => s.lastEnemyShot);
  const consecutiveHits = useGameStore(s => s.consecutiveHits);
  const airStrikeUsed = useGameStore(s => s.airStrikeUsed);
  const setAirStrikeUsed = useGameStore(s => s.setAirStrikeUsed);

  const [showCombo, setShowCombo] = useState(false);
  const [displayCombo, setDisplayCombo] = useState(0);

  useEffect(() => {
    if (consecutiveHits >= 3) {
      setDisplayCombo(consecutiveHits);
      setShowCombo(true);
      const timer = setTimeout(() => setShowCombo(false), 2000);
      return () => clearTimeout(timer);
    } else if (consecutiveHits === 0) {
      setShowCombo(false);
    }
  }, [consecutiveHits]);

  const handleTrackingClick = useCallback((x: number, y: number) => {
    if (!isMyTurn || isSpectator) return;

    // Don't fire at already-targeted cells
    const cell = trackingBoard[y][x];
    if (cell === CellState.Hit || cell === CellState.Miss) return;
    
    onFireShot(x, y);
  }, [isMyTurn, isSpectator, trackingBoard, onFireShot]);

  const handleAirStrike = () => {
    if (!isMyTurn || isSpectator || airStrikeUsed) return;
    
    setAirStrikeUsed(true);
    // Pick 3 random untargeted cells
    const untargeted: [number, number][] = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        if (trackingBoard[y][x] === CellState.Empty) {
          untargeted.push([x, y]);
        }
      }
    }

    // Shuffle and pick 3
    const picks = untargeted.sort(() => Math.random() - 0.5).slice(0, 3);
    picks.forEach(([x, y], i) => {
      setTimeout(() => onFireShot(x, y), i * 600);
    });
  };

  return (
    <div className="battle-view">
      <TurnIndicator />

      {showCombo && (
        <div className="combo-indicator">
          <div className="combo-text">COMBO x{displayCombo}</div>
          <div className="combo-subtext">ON FIRE!</div>
        </div>
      )}

      <div className="battle-view__main">
        <div className="battle-view__grids" style={{ pointerEvents: isSpectator ? 'none' : 'auto' }}>
          <Grid
            board={myBoard}
            isOwn={true}
            ships={myShips}
            disabled={true}
            label={isSpectator ? "Player 1" : "Your Waters"}
            lastMove={lastEnemyShot}
          />

          <div className="battle-view__actions">
            <button 
              className="btn btn--secondary"
              disabled={airStrikeUsed || !isMyTurn || isSpectator}
              onClick={handleAirStrike}
              title="Air Strike (3 Random Shots)"
              style={{ flexDirection: 'column', padding: '8px', minWidth: '60px' }}
            >
              <Wind size={20} />
              <span className="btn-label">{airStrikeUsed ? 'USED' : 'STRIKE'}</span>
            </button>
          </div>

          <Grid
            board={trackingBoard}
            isOwn={false}
            disabled={!isMyTurn || isSpectator}
            onClick={handleTrackingClick}
            label={isSpectator ? "Player 2" : "Enemy Waters"}
          />
        </div>
      </div>
    </div>
  );
}
