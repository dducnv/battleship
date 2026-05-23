'use client';

import { useLobbyStore } from '../../store/lobby-store';

export default function StatusBar() {
  const isConnected = useLobbyStore(s => s.isConnected);
  const roomId = useLobbyStore(s => s.roomId);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);

  return (
    <div className="status-bar">
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
  );
}
