'use client';

import { CellState } from '../../game/constants';
import { X, Circle } from 'lucide-react';

interface CellProps {
  state: number;
  x: number;
  y: number;
  isOwn: boolean; // true = my board, false = tracking/enemy board
  isValidTarget?: boolean;
  showHoverPreview?: boolean;
  previewValid?: boolean;
  onClick?: (x: number, y: number) => void;
  disabled?: boolean;
}

export default function Cell({
  state,
  x,
  y,
  isOwn,
  isValidTarget,
  showHoverPreview,
  previewValid,
  onClick,
  disabled,
}: CellProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(x, y);
    }
  };

  // Determine cell appearance
  let cellClass = 'cell';
  let content: React.ReactNode = null;

  switch (state) {
    case CellState.Empty:
      cellClass += ' cell--empty';
      break;
    case CellState.Ship:
      cellClass += isOwn ? ' cell--ship' : ' cell--empty'; // hide enemy ships
      break;
    case CellState.Miss:
      cellClass += ' cell--miss';
      content = <Circle size={12} fill="currentColor" />;
      break;
    case CellState.Hit:
      cellClass += ' cell--hit';
      content = <X size={24} strokeWidth={3} />;
      break;
  }

  if (showHoverPreview) {
    cellClass += previewValid ? ' cell--preview-valid' : ' cell--preview-invalid';
  }

  if (isValidTarget && !disabled) {
    cellClass += ' cell--targetable';
  }

  if (disabled) {
    cellClass += ' cell--disabled';
  }

  return (
    <div
      className={cellClass}
      onClick={handleClick}
      data-x={x}
      data-y={y}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Cell ${String.fromCharCode(65 + x)}${y + 1}`}
    >
      {content && <span className="cell__marker">{content}</span>}
    </div>
  );
}
