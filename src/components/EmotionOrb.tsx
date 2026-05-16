'use client';

import { motion } from 'framer-motion';
import { EMOTION_COLORS, type EmotionLabel } from '@/lib/types';

interface EmotionOrbProps {
  emotion: EmotionLabel | string;
  size?: number;
  className?: string;
  interactive?: boolean;
}

const PULSE_SPEED: Record<string, number> = {
  happy: 2.5, sad: 5, calm: 6, excited: 1.8,
  surprised: 2, angry: 2, fearful: 4, disgusted: 4, neutral: 5,
};

export default function EmotionOrb({
  emotion,
  size = 200,
  className = '',
  interactive = false,
}: EmotionOrbProps) {
  const safeEmotion = emotion as EmotionLabel;
  const color = EMOTION_COLORS[safeEmotion] || '#E8E8E8';
  const speed = PULSE_SPEED[safeEmotion] || 4;

  // Slightly lighter variant for gradient
  const lighterColor = `${color}88`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto', // Always centered
      }}
    >
      {/* Soft ambient glow — outermost */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: speed * 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: size * 1.6,
          height: size * 1.6,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Ring pulse — middle layer */}
      <motion.div
        animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: '50%',
          border: `1.5px solid ${lighterColor}`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Core orb — main circle */}
      <motion.div
        animate={{ backgroundColor: color }}
        transition={{ duration: 1 }}
        whileHover={interactive ? { scale: 1.04, boxShadow: `0 0 40px ${color}66` } : {}}
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${color}, ${color}CC)`,
          boxShadow: `
            inset 0 -${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.08),
            0 ${size * 0.04}px ${size * 0.15}px ${color}33
          `,
          zIndex: 2,
          cursor: interactive ? 'pointer' : 'default',
          transition: 'box-shadow 0.3s',
        }}
      >
        {/* Top highlight — glass effect */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '20%',
            width: '45%',
            height: '30%',
            borderRadius: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.45), transparent)',
            filter: 'blur(8px)',
          }}
        />

        {/* Subtle inner shadow at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '25%',
            width: '50%',
            height: '20%',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.06)',
            filter: 'blur(12px)',
          }}
        />
      </motion.div>
    </div>
  );
}
