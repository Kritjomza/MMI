'use client';

import { motion } from 'framer-motion';

import { Music, Sparkles, Heart, Cloud, Headphones, Star, Zap, Circle } from 'lucide-react';

const FLOATING_ITEMS = [
  { icon: Music, x: '10%', y: '20%', size: 28, delay: 0, duration: 8, color: '#A7D8FF' },
  { icon: Sparkles, x: '85%', y: '30%', size: 24, delay: 1, duration: 6, color: '#FFE66D' },
  { icon: Heart, x: '20%', y: '75%', size: 22, delay: 1.5, duration: 7.5, color: '#FFC8DD' },
  { icon: Cloud, x: '75%', y: '65%', size: 36, delay: 0.5, duration: 9, color: '#ffffff' },
  { icon: Headphones, x: '60%', y: '15%', size: 26, delay: 2, duration: 8, color: '#B8F2D6' },
  { icon: Star, x: '45%', y: '85%', size: 20, delay: 1.8, duration: 7, color: '#DCC6FF' },
];

export default function FloatingElements() {
  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        pointerEvents: 'none', 
        overflow: 'hidden',
        zIndex: 2 
      }}
    >
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            userSelect: 'none',
            left: item.x,
            top: item.y,
            fontSize: item.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0.2, 0.4],
            y: [0, -8, 3, -4, 0],
            x: [0, 3, -2, 2, 0],
            rotate: [0, 3, -1, 1, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <item.icon size={item.size} color={item.color} />
        </motion.div>
      ))}
    </div>
  );
}
