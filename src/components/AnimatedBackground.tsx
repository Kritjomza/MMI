'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  type: 'circle' | 'note' | 'star';
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ['#A7D8FF', '#DCC6FF', '#FFD6BA', '#B8F2D6', '#FFC8DD', '#FFE66D', '#FF9F7F'];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const animationFrameRef = useRef<number>(0);

  const createParticle = useCallback((width: number, height: number): Particle => {
    const type = Math.random() > 0.6 ? (Math.random() > 0.5 ? 'note' : 'star') : 'circle';
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      size: Math.random() * 6 + 3,
      opacity: Math.random() * 0.4 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    };
  }, []);

  const drawNote = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.7, size * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.6, y);
    ctx.lineTo(x + size * 0.6, y - size * 2);
    ctx.lineWidth = size * 0.15;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.6, y - size * 2);
    ctx.quadraticCurveTo(x + size * 1.5, y - size * 1.8, x + size * 1.2, y - size * 1.3);
    ctx.lineWidth = size * 0.2;
    ctx.stroke();
  }, []);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    const count = Math.min(40, Math.floor(window.innerWidth / 30));
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(canvas.width, canvas.height)
    );

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Mouse interaction — gentle push
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.3;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around
        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.type === 'note') {
          drawNote(ctx, 0, 0, p.size);
        } else if (p.type === 'star') {
          drawStar(ctx, 0, 0, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [createParticle, drawNote, drawStar]);

  return (
    <>
      <div className="gradient-mesh" />
      <canvas
        ref={canvasRef}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1 
        }}
      />
      <div className="grain-overlay" />
    </>
  );
}
