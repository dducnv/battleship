'use client';

import { useLobbyStore } from '../../store/lobby-store';
import { useAudio } from '../../hooks/useAudio';

export default function StatusBar() {
  const isConnected = useLobbyStore(s => s.isConnected);
  const roomId = useLobbyStore(s => s.roomId);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);
  const { volume, setVolume } = useAudio();

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <div className={`status-bar__dot ${isConnected ? 'status-bar__dot--connected' : 'status-bar__dot--disconnected'}`} />
        <span className="status-bar__text">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {roomId && (
          <>
            <span className="status-bar__divider">•</span>
            <span className="status-bar__room">Room: {roomId}</span>
            <span className="status-bar__divider">•</span>
            <span className="status-bar__players">Players: {totalPlayers}/2</span>
          </>
        )}
      </div>

      <div className="status-bar__audio">
        <span className="status-bar__audio-icon">
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
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
