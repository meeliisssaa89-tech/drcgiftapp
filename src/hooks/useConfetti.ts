import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const fireConfetti = useCallback((type: 'win' | 'jackpot' | 'gift' = 'win') => {
    const duration = type === 'jackpot' ? 5000 : 3000;
    const end = Date.now() + duration;

    const colors = type === 'jackpot' 
      ? ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
      : type === 'gift'
      ? ['#FF69B4', '#FFB6C1', '#DDA0DD', '#E6E6FA', '#FFF0F5']
      : ['#2AABEE', '#4FC3F7', '#81D4FA', '#B3E5FC', '#E1F5FE'];

    const frame = () => {
      confetti({
        particleCount: type === 'jackpot' ? 7 : 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: type === 'jackpot' ? 7 : 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        zIndex: 9999,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const fireBurst = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#2AABEE', '#FFD700'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#4FC3F7', '#FFA500'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#81D4FA', '#FF6347'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#B3E5FC', '#9370DB'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#E1F5FE', '#00CED1'],
    });
  }, []);

  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFD700', '#FFA500', '#FF6347'],
      zIndex: 9999,
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'],
      });

      confetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.75,
        shapes: ['circle'],
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  }, []);

  return { fireConfetti, fireBurst, fireStars };
};
