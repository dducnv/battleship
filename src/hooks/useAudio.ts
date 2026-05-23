'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type SoundEffect = 'shot' | 'explosion' | 'your_turn' | 'win' | 'lose' | 'theme_battle';

const SOUND_FILES: Record<SoundEffect, string> = {
  shot: '/audio/shot.mp3',
  explosion: '/audio/explosion.mp3',
  your_turn: '/audio/your_turn.mp3',
  win: '/audio/win.mp3',
  lose: '/audio/lose.mp3',
  theme_battle: '/audio/theme_battle.mp3',
};

interface AudioContextType {
  volume: number;
  setVolume: (v: number) => void;
  playSound: (effect: SoundEffect) => void;
  stopSound: (effect: SoundEffect) => void;
  startTheme: () => void;
  stopTheme: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolume] = useState(0.2); // Default 20% volume
  const audioRefs = useRef<Partial<Record<SoundEffect, HTMLAudioElement>>>({});
  const themeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload sounds
    Object.entries(SOUND_FILES).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioRefs.current[key as SoundEffect] = audio;
      
      if (key === 'theme_battle') {
        audio.loop = true;
        themeRef.current = audio;
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio?.pause();
        if (audio) audio.src = '';
      });
    };
  }, []);

  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (audio) {
        // Background theme is usually quieter
        audio.volume = key === 'theme_battle' ? volume * 0.5 : volume;
      }
    });
  }, [volume]);

  const playSound = (effect: SoundEffect) => {
    const audio = audioRefs.current[effect];
    if (audio) {
      if (effect !== 'theme_battle') audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const stopSound = (effect: SoundEffect) => {
    const audio = audioRefs.current[effect];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const startTheme = () => {
    if (themeRef.current) {
      themeRef.current.play().catch(() => {});
    }
  };

  const stopTheme = () => {
    if (themeRef.current) {
      themeRef.current.pause();
      themeRef.current.currentTime = 0;
    }
  };

  return (
    <AudioContext.Provider value={{ volume, setVolume, playSound, stopSound, startTheme, stopTheme }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}
