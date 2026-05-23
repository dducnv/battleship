'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';

interface JoinRoomProps {
  onJoin: (roomId: string) => void;
  isJoining: boolean;
  error: string | null;
}

export default function JoinRoom({ onJoin, isJoining, error }: JoinRoomProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onJoin(trimmed);
    }
  };

  return (
    <div className="lobby-card">
      <div className="lobby-card__icon">
        <LogIn size={32} />
      </div>
      <h3 className="lobby-card__title">Join Room</h3>
      <p className="lobby-card__desc">Enter a room code to join an existing match</p>

      <form className="lobby-card__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="Enter room code..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={10}
          autoComplete="off"
        />
        <button
          className="btn btn--primary btn--lg"
          type="submit"
          disabled={!inputValue.trim() || isJoining}
        >
          {isJoining ? 'Joining...' : '🎯 Join Match'}
        </button>
      </form>

      {error && <p className="lobby-card__error">{error}</p>}
    </div>
  );
}
