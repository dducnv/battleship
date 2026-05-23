'use client';

import { useState, useCallback, useEffect } from 'react';
import Grid from '../board/Grid';
import ShipTray from '../board/ShipTray';
import { useGameStore } from '../../store/game-store';
import { getShipDef, canPlaceShip } from '../../game/board';
import type { Coordinate } from '../../game/types';

interface PlacementViewProps {
  onReady: (board: number[][], shipsPlaced: unknown[]) => void;
}

export default function PlacementView({ onReady }: PlacementViewProps) {
  const myBoard = useGameStore(s => s.myBoard);
  const myShips = useGameStore(s => s.myShips);
  const selectedShipId = useGameStore(s => s.selectedShipId);
  const isHorizontal = useGameStore(s => s.isHorizontal);
  const placeSelectedShip = useGameStore(s => s.placeSelectedShip);
  const toggleOrientation = useGameStore(s => s.toggleOrientation);
  const isAllPlaced = useGameStore(s => s.isAllShipsPlaced);
  const opponentReady = useGameStore(s => s.opponentReady);
  const myReady = useGameStore(s => s.myReady);

  const [hoverPreview, setHoverPreview] = useState<{
    cells: Coordinate[];
    valid: boolean;
  } | null>(null);

  // Keyboard shortcut: R to rotate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        toggleOrientation();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleOrientation]);

  const handleCellHover = useCallback((x: number, y: number) => {
    if (!selectedShipId) {
      setHoverPreview(null);
      return;
    }

    const shipDef = getShipDef(selectedShipId);
    if (!shipDef) return;

    const cells: Coordinate[] = [];
    for (let i = 0; i < shipDef.length; i++) {
      const cx = isHorizontal ? x + i : x;
      const cy = isHorizontal ? y : y + i;
      cells.push([cx, cy]);
    }

    const valid = canPlaceShip(myBoard, shipDef.length, x, y, isHorizontal);
    setHoverPreview({ cells, valid });
  }, [selectedShipId, isHorizontal, myBoard]);

  const handleCellLeave = useCallback(() => {
    setHoverPreview(null);
  }, []);

  const handleCellClick = useCallback((x: number, y: number) => {
    placeSelectedShip(x, y);
    setHoverPreview(null);
  }, [placeSelectedShip]);

  const handleReady = () => {
    if (isAllPlaced()) {
      onReady(myBoard, myShips);
    }
  };

  return (
    <div className="placement-view">
      <div className="placement-view__header">
        <h2>Deploy Your Fleet</h2>
        <p className="placement-view__subtitle">
          {selectedShipId
            ? `Click on the grid to place • Press R to rotate`
            : 'Select a ship from the tray'}
        </p>
      </div>

      <div className="placement-view__content">
        <Grid
          board={myBoard}
          isOwn={true}
          ships={myShips}
          onClick={handleCellClick}
          hoverPreview={hoverPreview}
          onCellHover={handleCellHover}
          onCellLeave={handleCellLeave}
          label="Your Waters"
          interactive={true}
        />
        <ShipTray />
      </div>

      <div className="placement-view__footer">
        {opponentReady && (
          <p className="placement-view__opponent-status">✓ Opponent is ready!</p>
        )}
        <button
          className="btn btn--primary btn--lg"
          onClick={handleReady}
          disabled={!isAllPlaced()}
        >
          {isAllPlaced() ? '⚓ Ready for Battle!' : `Place all ships (${myShips.length}/5)`}
        </button>
      </div>
    </div>
  );
}
