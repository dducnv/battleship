'use client';

import { SHIPS } from '../../game/constants';
import { useGameStore } from '../../store/game-store';

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
              <img
                src={ship.asset}
                alt={ship.name}
                className="ship-tray__image"
                draggable={false}
              />
              <div className="ship-tray__info">
                <span className="ship-tray__name">{ship.name}</span>
                <span className="ship-tray__length">{ship.length} cells</span>
              </div>
              {isPlaced && <span className="ship-tray__check">✓</span>}
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
          🔄 {isHorizontal ? 'Horizontal' : 'Vertical'}
        </button>
        <button
          className="btn btn--secondary"
          onClick={autoPlace}
        >
          🎲 Auto Place
        </button>
      </div>
    </div>
  );
}
