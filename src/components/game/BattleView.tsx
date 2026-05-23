'use client';

import { useCallback } from 'react';
import Grid from '../board/Grid';
import TurnIndicator from './TurnIndicator';
import { useGameStore } from '../../store/game-store';
import { CellState } from '../../game/constants';

interface BattleViewProps {
  onFireShot: (x: number, y: number) => void;
}

export default function BattleView({ onFireShot }: BattleViewProps) {
  const myBoard = useGameStore(s => s.myBoard);
  const myShips = useGameStore(s => s.myShips);
  const trackingBoard = useGameStore(s => s.trackingBoard);
  const isMyTurn = useGameStore(s => s.isMyTurn);

  const handleTrackingClick = useCallback((x: number, y: number) => {
    if (!isMyTurn) return;
    // Don't fire at already-targeted cells
    const cell = trackingBoard[y][x];
    if (cell === CellState.Hit || cell === CellState.Miss) return;
    onFireShot(x, y);
  }, [isMyTurn, trackingBoard, onFireShot]);

  return (
    <div className="battle-view">
      <TurnIndicator />

      <div className="battle-view__grids">
        <Grid
          board={myBoard}
          isOwn={true}
          ships={myShips}
          disabled={true}
          label="Your Waters"
        />
        <Grid
          board={trackingBoard}
          isOwn={false}
          disabled={!isMyTurn}
          onClick={handleTrackingClick}
          label="Enemy Waters"
        />
      </div>
    </div>
  );
}
