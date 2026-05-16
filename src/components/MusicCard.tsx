'use client';

import { motion } from 'framer-motion';
import { Play, Pause, ExternalLink } from 'lucide-react';
import { useState, useRef } from 'react';
import type { DeezerTrack } from '@/lib/types';

interface MusicCardProps {
  track: DeezerTrack;
  index?: number;
}

export default function MusicCard({ track, index = 0 }: MusicCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!track.previewUrl) {
      window.open(track.deezerUrl, '_blank');
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.previewUrl);
        audioRef.current.volume = 0.5;
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -8,
        rotateY: 3,
        rotateX: -2,
        scale: 1.03,
        transition: { duration: 0.3 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="surface-card group relative"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        padding: '0',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: 'var(--radius-3xl)', pointerEvents: 'none' }}
        animate={{
          boxShadow: isHovered
            ? '0 20px 50px rgba(167,216,255,0.3), inset 0 0 30px rgba(255,255,255,0.1)'
            : '0 8px 25px rgba(0,0,0,0.05)',
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Album art */}
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={track.albumImage}
          alt={track.albumName}
          className="w-full h-full object-cover transition-transform duration-500"
          style={{
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        />
        {/* Play overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center blur-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="flex items-center justify-center"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? (
              <Pause style={{ color: '#3C3C3C', width: '1.5rem', height: '1.5rem' }} />
            ) : (
              <Play style={{ color: '#3C3C3C', width: '1.5rem', height: '1.5rem', marginLeft: '0.125rem' }} />
            )}
          </motion.button>
        </motion.div>

        {/* Equalizer when playing */}
        {isPlaying && (
          <div className="absolute flex items-end gap-0.5" style={{ bottom: '0.75rem', right: '0.75rem', height: '1.25rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="equalizer-bar"
                style={{
                  height: '100%',
                  background: '#fff',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Song info */}
      <div style={{ padding: '1rem' }}>
        <h3
          className="font-semibold text-sm"
          style={{ color: 'var(--text-dark)', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {track.name}
        </h3>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-soft)', fontFamily: "'Nunito', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {track.artist}
        </p>

        {/* Open in Deezer */}
        <a
          href={track.deezerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 font-medium"
          style={{ fontSize: '0.6875rem', color: 'var(--text-soft)', transition: 'color var(--transition-normal)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
          Open in Deezer
        </a>
      </div>
    </motion.div>
  );
}
