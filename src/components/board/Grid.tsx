'use client';

import { BOARD_SIZE } from '../../game/constants';
import type { Board, PlacedShip } from '../../game/types';
import Cell from './Cell';
import ShipSprite from './ShipSprite';

interface GridProps {
  board: Board;
  isOwn: boolean;
  ships?: PlacedShip[];         // render ship sprites on own board
  disabled?: boolean;
  onClick?: (x: number, y: number) => void;
  hoverPreview?: {              // for placement preview
    cells: [number, number][];
    valid: boolean;
  } | null;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
  label?: string;
  interactive?: boolean;        // allow interactive ship movements/rotations
}

const COL_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) => String.fromCharCode(65 + i));
const ROW_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) => i + 1);

export default function Grid({
  board,
  isOwn,
  ships,
  disabled,
  onClick,
  hoverPreview,
  onCellHover,
  onCellLeave,
  label,
  interactive,
}: GridProps) {
  const previewSet = new Set(
    hoverPreview?.cells.map(([x, y]) => `${x},${y}`) ?? []
  );

  return (
    <div className="grid-container">
      {label && <h3 className="grid-label">{label}</h3>}

      <div className="grid-wrapper">
        {/* Column headers */}
        <div className="grid-headers grid-headers--col">
          <div className="grid-corner" />
          {COL_LABELS.map(letter => (
            <div key={letter} className="grid-header">{letter}</div>
          ))}
        </div>

        <div className="grid-body">
          {/* Row headers + cells */}
          <div className="grid-headers grid-headers--row">
            {ROW_LABELS.map(num => (
              <div key={num} className="grid-header">{num}</div>
            ))}
          </div>

          <div
            className="grid-cells"
            onMouseLeave={onCellLeave}
          >
            {board.map((row, y) =>
              row.map((cellState, x) => (
                <div
                  key={`${x}-${y}`}
                  onMouseEnter={() => onCellHover?.(x, y)}
                >
                  <Cell
                    state={cellState}
                    x={x}
                    y={y}
                    isOwn={isOwn}
                    onClick={onClick}
                    disabled={disabled}
                    showHoverPreview={previewSet.has(`${x},${y}`)}
                    previewValid={hoverPreview?.valid}
                  />
                </div>
              ))
            )}

            {/* Ship sprites overlay (own board only) */}
            {isOwn && ships?.map(ship => (
              <ShipSprite key={ship.id} ship={ship} interactive={interactive} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
