'use client';

import { SHIPS } from '../../game/constants';
import { useGameStore } from '../../store/game-store';
import { Check, RefreshCw, Dices } from 'lucide-react';

/**
 * Ship selection tray for placement phase.
 * Shows unplaced ships, allows selecting one to place on the grid.
 */
export default function ShipTray() {
  const myShips = useGameStore(s => s.myShips);
  const selectedShipId = useGameStore(s => s.selectedShipId);
  const isHorizontal = useGameStore(s => s.isHorizontal);
  const selectShip = useGameStore(s => s.selectShip);
  const toggleOrientation = useGameStore(s => s.toggleOrientation);
  const removeShipById = useGameStore(s => s.removeShipById);
  const autoPlace = useGameStore(s => s.autoPlace);

  const placedIds = new Set(myShips.map(s => s.id));

  return (
    <div className="ship-tray">
      <h3 className="ship-tray__title">Fleet</h3>

      <div className="ship-tray__list">
        {SHIPS.map(ship => {
          const isPlaced = placedIds.has(ship.id);
          const isSelected = selectedShipId === ship.id;

          return (
            <div
              key={ship.id}
              className={`ship-tray__item ${isPlaced ? 'ship-tray__item--placed' : ''} ${isSelected ? 'ship-tray__item--selected' : ''}`}
              onClick={() => {
                if (isPlaced) {
                  // Click placed ship to remove it
                  removeShipById(ship.id);
                } else {
                  selectShip(isSelected ? null : ship.id);
                }
              }}
            >
              <div className="ship-tray__image-container" style={{
                width: `calc(12px * ${ship.length})`,
                height: '24px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <img
                  src={ship.asset}
                  alt={ship.name}
                  className="ship-tray__image"
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: `calc(12px * ${ship.length})`,
                    transform: 'rotate(-90deg)',
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              </div>
              <div className="ship-tray__info">
                <span className="ship-tray__name">{ship.name}</span>
                <span className="ship-tray__length">{ship.length} cells</span>
              </div>
              {isPlaced && <span className="ship-tray__check"><Check size={16} /></span>}
            </div>
          );
        })}
      </div>

      <div className="ship-tray__controls">
        <button
          className="btn btn--secondary"
          onClick={toggleOrientation}
          title="Press R to rotate"
        >
          <RefreshCw size={16} /> {isHorizontal ? 'Horizontal' : 'Vertical'}
        </button>
        <button
          className="btn btn--secondary"
          onClick={autoPlace}
        >
          <Dices size={16} /> Auto Place
        </button>
      </div>
    </div>
  );
}
