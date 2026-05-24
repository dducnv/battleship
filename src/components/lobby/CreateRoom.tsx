'use client';

import { useState } from 'react';
import { Copy, Check, Anchor } from 'lucide-react';

interface CreateRoomProps {
  roomId: string | null;
  onCreate: () => void;
}

export default function CreateRoom({ roomId, onCreate }: CreateRoomProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lobby-card">
      <div className="lobby-card__icon">
        <Anchor size={32} />
      </div>
      <h3 className="lobby-card__title">Create New Room</h3>
      <p className="lobby-card__desc">Generate a room and share the code with a friend</p>

      {!roomId ? (
        <button className="btn btn--primary btn--lg" onClick={onCreate}>
          <Anchor size={20} /> Generate Room
        </button>
      ) : (
        <div className="lobby-card__room-id">
          <span className="lobby-card__label">Room Code</span>
          <div className="lobby-card__code-row">
            <code className="lobby-card__code">{roomId}</code>
            <button className="btn btn--icon" onClick={handleCopy} title="Copy room code">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="lobby-card__waiting">Waiting for opponent to join...</p>
        </div>
      )}
    </div>
  );
}
