'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const VARIANT_MAP = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-outline',
};

const SIZE_MAP = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: AnimatedButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.05, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`btn ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        boxShadow: disabled ? 'none' : undefined,
      }}
    >
      {children}
    </motion.button>
  );
}
