'use client';

import { useEffect, useRef, useState } from 'react';

type SoundEffect = 'shot' | 'explosion' | 'your_turn' | 'win' | 'lose' | 'theme_battle';

const SOUND_FILES: Record<SoundEffect, string> = {
  shot: '/audio/shot.mp3',
  explosion: '/audio/explosion.mp3',
  your_turn: '/audio/your_turn.mp3',
  win: '/audio/win.mp3',
  lose: '/audio/lose.mp3',
  theme_battle: '/audio/theme_battle.mp3',
};

export function useAudio() {
  const [volume, setVolume] = useState(0.3); // Default 30% volume
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

    // Cleanup
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio?.pause();
        if (audio) audio.src = '';
      });
    };
  }, []);

  // Update volume for all sounds
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        // Theme battle is usually louder/longer, maybe scale it differently if needed
        // but for now, global volume is fine.
        audio.volume = volume;
      }
    });
  }, [volume]);

  const playSound = (effect: SoundEffect) => {
    const audio = audioRefs.current[effect];
    if (audio) {
      // For short SFX like shot/explosion, we want to allow overlapping or restarts
      if (effect !== 'theme_battle') {
        audio.currentTime = 0;
      }
      audio.play().catch(e => console.warn('Audio playback failed:', e));
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
      themeRef.current.volume = volume * 0.5; // Theme background usually quieter
      themeRef.current.play().catch(e => console.warn('Theme playback failed:', e));
    }
  };

  const stopTheme = () => {
    if (themeRef.current) {
      themeRef.current.pause();
      themeRef.current.currentTime = 0;
    }
  };

  return { volume, setVolume, playSound, stopSound, startTheme, stopTheme };
}
