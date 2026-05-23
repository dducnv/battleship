'use client';

import { SHIPS } from '../../game/constants';
import type { PlacedShip } from '../../game/types';

interface ShipSpriteProps {
  ship: PlacedShip;
}

/**
 * Renders a ship image on the grid using absolute positioning.
 * The ship image spans across the cells defined by the ship's coordinates.
 * Original sprites are vertical; rotated 90° for horizontal placement.
 */
export default function ShipSprite({ ship }: ShipSpriteProps) {
  const shipDef = SHIPS.find(s => s.id === ship.id);
  if (!shipDef) return null;

  // Determine orientation from coordinates
  const isHorizontal = ship.coordinates.length > 1 &&
    ship.coordinates[0][1] === ship.coordinates[1][1]; // same y = horizontal

  // Get top-left cell
  const minX = Math.min(...ship.coordinates.map(([x]) => x));
  const minY = Math.min(...ship.coordinates.map(([, y]) => y));

  // Each cell is var(--cell-size) wide
  // Position is based on grid cell indices
  const style: React.CSSProperties = {
    position: 'absolute',
    // Position at the top-left corner of the first cell
    gridColumn: `${minX + 1} / span ${isHorizontal ? shipDef.length : 1}`,
    gridRow: `${minY + 1} / span ${isHorizontal ? 1 : shipDef.length}`,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'fill',
    ...(isHorizontal ? { transform: 'rotate(-90deg)' } : {}),
  };

  return (
    <div className="ship-sprite" style={style}>
      <img
        src={shipDef.asset}
        alt={shipDef.name}
        style={imgStyle}
        draggable={false}
      />
    </div>
  );
}
