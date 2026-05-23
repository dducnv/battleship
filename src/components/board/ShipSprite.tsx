'use client';

import { useState } from 'react';
import { SHIPS } from '../../game/constants';
import type { PlacedShip } from '../../game/types';
import { useGameStore } from '../../store/game-store';

interface ShipSpriteProps {
  ship: PlacedShip;
  interactive?: boolean;
}

/**
 * Renders a ship image on the grid using precise CSS grid cell spanning.
 * Includes interactive hover actions (Rotate, Remove buttons), double-click to rotate, and click to pick up.
 */
export default function ShipSprite({ ship, interactive = false }: ShipSpriteProps) {
  const shipDef = SHIPS.find(s => s.id === ship.id);
  const rotateShipInPlace = useGameStore(s => s.rotateShipInPlace);
  const removeShipById = useGameStore(s => s.removeShipById);
  const selectShip = useGameStore(s => s.selectShip);
  
  const [isHovered, setIsHovered] = useState(false);

  if (!shipDef) return null;

  // Determine orientation from coordinates
  const isHorizontal = ship.coordinates.length > 1 &&
    ship.coordinates[0][1] === ship.coordinates[1][1]; // same y = horizontal

  // Get top-left cell
  const minX = Math.min(...ship.coordinates.map(([x]) => x));
  const minY = Math.min(...ship.coordinates.map(([, y]) => y));

  // Style container to occupy EXACTLY the coordinates it spans
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    gridColumn: isHorizontal
      ? `${minX + 1} / span ${shipDef.length}`
      : `${minX + 1} / span 1`,
    gridRow: isHorizontal
      ? `${minY + 1} / span 1`
      : `${minY + 1} / span ${shipDef.length}`,
    width: '100%',
    height: '100%',
    zIndex: interactive ? 10 : 2, // overlay above cells
    pointerEvents: interactive ? 'auto' : 'none',
    cursor: interactive ? 'pointer' : 'default',
  };

  const imgStyle: React.CSSProperties = isHorizontal
    ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 'var(--cell-size)',
        height: `calc(var(--cell-size) * ${shipDef.length} + var(--grid-gap) * ${shipDef.length - 1})`,
        transform: 'translate(-50%, -50%) rotate(-90deg)',
        objectFit: 'fill',
        transition: 'filter 0.2s ease',
      }
    : {
        width: '100%',
        height: '100%',
        objectFit: 'fill',
        transition: 'filter 0.2s ease',
      };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    rotateShipInPlace(ship.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    // Clicking the ship picks it up (selects it and removes it from the board)
    selectShip(ship.id);
    removeShipById(ship.id);
  };

  return (
    <div
      className={`ship-sprite ${interactive ? 'ship-sprite--interactive' : ''} ${isHovered ? 'ship-sprite--hovered' : ''}`}
      style={containerStyle}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      <img
        src={shipDef.asset}
        alt={shipDef.name}
        style={imgStyle}
        draggable={false}
      />
      
      {interactive && isHovered && (
        <div className="ship-sprite__actions" onClick={e => e.stopPropagation()}>
          <button
            className="ship-sprite__btn ship-sprite__btn--rotate"
            onClick={(e) => {
              e.stopPropagation();
              rotateShipInPlace(ship.id);
            }}
            title="Rotate Ship (Double-click)"
          >
            🔄
          </button>
          <button
            className="ship-sprite__btn ship-sprite__btn--remove"
            onClick={(e) => {
              e.stopPropagation();
              removeShipById(ship.id);
            }}
            title="Remove Ship"
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
}
