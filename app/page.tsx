'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseRoom } from '../src/hooks/useSupabaseRoom';
import { useLobbyStore } from '../src/store/lobby-store';
import { useGameStore } from '../src/store/game-store';
import CreateRoom from '../src/components/lobby/CreateRoom';
import JoinRoom from '../src/components/lobby/JoinRoom';
import StatusBar from '../src/components/shared/StatusBar';
import { Crosshair, User } from 'lucide-react';
import { useEffect } from 'react';
import { myUserName } from '../src/supabase/client';

export default function LobbyPage() {
  const router = useRouter();
  const roomId = useLobbyStore(s => s.roomId);
  const { createRoom, joinRoom } = useSupabaseRoom(roomId || undefined);
  const isJoining = useLobbyStore(s => s.isJoining);
  const error = useLobbyStore(s => s.error);
  const totalPlayers = useLobbyStore(s => s.totalPlayers);
  const phase = useGameStore(s => s.phase);
  const userName = useLobbyStore(s => s.userName);
  const setUserName = useLobbyStore(s => s.setUserName);

  // Initialize user name from session storage or default
  useEffect(() => {
    if (!userName) {
      setUserName(myUserName);
    }
  }, [userName, setUserName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setUserName(newName);
    sessionStorage.setItem('battleship_name', newName);
  };

  // Navigate to game room when placement starts
  useEffect(() => {
    if (phase === 'placing' && roomId) {
      router.push(`/game/${roomId}`);
    }
  }, [phase, roomId, router]);

  return (
    <div className="lobby-page">
      <StatusBar />

      <div className="lobby-header">
        <div className="lobby-header__icon" aria-hidden="true">
          <Crosshair size={48} strokeWidth={1.5} />
        </div>
        <h1 className="lobby-header__title">Battleship P2P</h1>
        <p className="lobby-header__subtitle">The ultimate real-time naval combat experience. No login, no hassle—just pure strategy.</p>
      </div>

      <div className="lobby-name-input">
        <div className="input-group">
          <label htmlFor="user-name">Your Callsign</label>
          <div className="input-with-icon">
            <User size={20} className="input-icon" />
            <input
              id="user-name"
              type="text"
              value={userName}
              onChange={handleNameChange}
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>
        </div>
      </div>

      <div className="lobby-cards">
        <CreateRoom
          roomId={roomId || null}
          onCreate={createRoom}
        />
        <div className="lobby-divider">
          <span>OR</span>
        </div>
        <JoinRoom
          onJoin={joinRoom}
          isJoining={isJoining}
          error={error}
        />
      </div>

      {totalPlayers === 1 && roomId && (
        <div className="lobby-waiting">
          <div className="lobby-waiting__spinner" />
          <p>Waiting for opponent to join room <strong>{roomId}</strong>...</p>
        </div>
      )}

      <footer className="lobby-footer">
        <p>Created for P2P Naval Combat</p>
        <div className="lobby-footer__credits">
          <a href="https://opengameart.org/content/battle-theme-a" target="_blank" rel="noopener noreferrer">Battle Theme</a>
          <span className="lobby-footer__dot">|</span>
          <a href="https://opengameart.org/content/sci-fi-sound-effects-library" target="_blank" rel="noopener noreferrer">SFX Library</a>
          <span className="lobby-footer__dot">|</span>
          <a href="https://opengameart.org/content/sea-warfare-set-ships-and-more" target="_blank" rel="noopener noreferrer">Ship Assets</a>
        </div>
      </footer>
    </div>
  );
}
