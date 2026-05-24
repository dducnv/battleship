'use client';

import { useLobbyStore } from '../../store/lobby-store';
import { useAudio } from '../../hooks/useAudio';
import { VolumeX, Volume1, Volume2 } from 'lucide-react';

export default function StatusBar() {
  const isConnected = useLobbyStore(s => s.isConnected);
  const roomId = useLobbyStore(s => s.roomId);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);
  const { volume, setVolume } = useAudio();

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={14} />;
    if (volume < 0.5) return <Volume1 size={14} />;
    return <Volume2 size={14} />;
  };

  return (
    <div className="status-bar">
      <div className=" status-bar__left">
        <div className={`status-bar__dot ${isConnected ? 'status-bar__dot--connected' : 'status-bar__dot--disconnected'}`} />
        <span className="status-bar__text">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {roomId && (
          <>
            <span className="status-bar__divider">|</span>
            <span className="status-bar__room">Room: {roomId}</span>
            <span className="status-bar__divider">|</span>
            <span className="status-bar__players">Players: {totalPlayers}/2</span>
          </>
        )}
      </div>

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
        <span className="status-bar__volume-percent">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
