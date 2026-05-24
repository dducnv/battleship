'use client';

import { useLobbyStore } from '../../store/lobby-store';
import { useGameStore } from '../../store/game-store';
import { useAudio } from '../../hooks/useAudio';
import { VolumeX, Volume1, Volume2 } from 'lucide-react';

export default function StatusBar() {
  const isConnected = useLobbyStore(s => s.isConnected);
  const roomId = useLobbyStore(s => s.roomId);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);
  const playerIds = useGameStore(s => s.playerIds);
  const playerNames = useGameStore(s => s.playerNames);
  const { volume, setVolume } = useAudio();

  // Game stats
  const phase = useGameStore(s => s.phase);
  const turnCount = useGameStore(s => s.turnCount);
  const myHitCount = useGameStore(s => s.myHitCount);

  const getPlayerLabel = (index: number) => {
    const id = playerIds[index];
    if (id && playerNames[id]) return playerNames[id];
    return index < totalPlayers ? `Player ${index + 1}` : 'Waiting...';
  };

  const accuracy = turnCount > 0
    ? Math.round((myHitCount / turnCount) * 100)
    : 0;

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={14} />;
    if (volume < 0.5) return <Volume1 size={14} />;
    return <Volume2 size={14} />;
  };

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <div className={`status-bar__dot ${isConnected ? 'status-bar__dot--connected' : 'status-bar__dot--disconnected'}`} />
        <span className="status-bar__text">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {roomId && (
          <>
            <span className="status-bar__divider">|</span>
            <span className="status-bar__room">Room: {roomId}</span>
          </>
        )}
      </div>

      <div className="status-bar__center">
        {roomId && (
          <div className="status-bar__vs">
            <span className="player-name">{getPlayerLabel(0)}</span>
            <span className="vs-tag">VS</span>
            <span className="player-name">{getPlayerLabel(1)}</span>
          </div>
        )}
      </div>

      <div className="status-bar__right">
        {phase === 'playing' && (
          <>
            <span className="status-bar__stats">
              Turns: <span style={{ color: 'var(--color-primary)' }}>{turnCount}</span>
            </span>
            <span className="status-bar__divider">|</span>
            <span className="status-bar__stats">
              Acc: <span style={{ color: 'var(--color-valid)' }}>{accuracy}%</span>
            </span>
            <span className="status-bar__divider">|</span>
          </>
        )}
        <div className="status-bar__audio">
          <span className="status-bar__audio-icon">
            {getVolumeIcon()}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="status-bar__volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
