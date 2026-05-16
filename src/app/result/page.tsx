'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Share2, Music, Sparkles, ExternalLink, Play, Pause, Volume2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import EmotionOrb from '@/components/EmotionOrb';
import type { MoodResult, EmotionLabel } from '@/lib/types';
import { EMOTION_COLORS } from '@/lib/types';

const EMOTION_LABEL_TH: Record<string, string> = {
  happy: 'มีความสุข', sad: 'เศร้า', angry: 'โกรธ', surprised: 'ประหลาดใจ',
  fearful: 'กังวล', disgusted: 'รังเกียจ', neutral: 'ปกติ', calm: 'สงบ', excited: 'ตื่นเต้น',
};

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<MoodResult | null>(null);
  const [showReveal, setShowReveal] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const s = {
    bg: '#f7f6f3', white: '#ffffff', black: '#0d0c0b', gray: '#9e9b94',
    lightGray: '#e8e6e1', font: "'DM Sans', sans-serif", serif: "'DM Serif Display', serif",
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('moodResult');
    if (stored) {
      setResult(JSON.parse(stored));
      setTimeout(() => setShowReveal(false), 2200);
    } else {
      router.push('/');
    }
  }, [router]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const togglePlay = useCallback((trackId: string, previewUrl: string | null) => {
    if (!previewUrl) return;

    if (playingId === trackId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) { audioRef.current.pause(); }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(trackId);
  }, [playingId]);

  const emotionPercentages = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.analysis.emotionScores)
      .map(([emotion, score]) => ({ emotion: emotion as EmotionLabel, score, pct: Math.round(score * 100) }))
      .sort((a, b) => b.score - a.score);
  }, [result]);

  if (!result) return null;

  const { analysis, tracks } = result;
  const domColor = EMOTION_COLORS[analysis.dominantEmotion] || '#0d0c0b';
  const domTH = EMOTION_LABEL_TH[analysis.dominantEmotion] || analysis.dominantEmotion;

  return (
    <div style={{ background: s.bg, minHeight: '100vh', fontFamily: s.font, color: s.black }}>
      <Navbar />

      {/* Reveal */}
      <AnimatePresence>
        {showReveal && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,246,243,0.95)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <EmotionOrb emotion={analysis.dominantEmotion} size={180} interactive={false} />
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ fontFamily: s.serif, fontSize: 28, marginTop: 24 }}>
                คุณกำลังรู้สึก <span style={{ color: domColor }}>{domTH}</span>
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                style={{ fontSize: 14, color: s.gray, marginTop: 8 }}>
                กำลังเลือกเพลงที่ใช่ให้คุณ...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: 'clamp(5rem, 10vw, 7rem) clamp(16px, 5vw, 48px) clamp(3rem, 6vw, 5rem)' }}>

        {/* Back */}
        <motion.button onClick={() => { if (audioRef.current) audioRef.current.pause(); router.push('/analyze'); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: showReveal ? 2.2 : 0 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: s.gray, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: s.font, marginBottom: 40 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> วิเคราะห์อีกครั้ง
        </motion.button>

        {/* Top Grid: Emotion + AI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(16px, 3vw, 24px)', marginBottom: 'clamp(32px, 6vw, 64px)' }}>
          {/* Left: Dominant Emotion */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showReveal ? 2.3 : 0.1 }}
            style={{ background: s.white, border: `1px solid ${s.lightGray}`, borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 8 }}>
              <EmotionOrb emotion={analysis.dominantEmotion} size={120} interactive />
            </div>
            <h2 style={{ fontFamily: s.serif, fontSize: 32, marginTop: 12, color: domColor, textTransform: 'capitalize', textAlign: 'center' }}>
              {domTH}
            </h2>
            <p style={{ fontSize: 12, color: s.gray, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
              อารมณ์หลัก · {analysis.source === 'both' ? 'ใบหน้า + ข้อความ' : analysis.source === 'face' ? 'ใบหน้า' : 'ข้อความ'}
            </p>

            {/* Valence & Arousal */}
            <div style={{ marginTop: 28, width: '100%' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: s.gray }}>
                  <span>ความรู้สึกดี-ไม่ดี</span><span style={{ color: s.black, fontWeight: 500 }}>{((analysis.valence + 1) / 2 * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: s.lightGray, borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div initial={{ width: '50%' }} animate={{ width: `${(analysis.valence + 1) / 2 * 100}%` }}
                    transition={{ duration: 1, delay: showReveal ? 2.5 : 0.3 }}
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${s.lightGray}, ${domColor})` }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: s.gray }}>
                  <span>ระดับพลังงาน</span><span style={{ color: s.black, fontWeight: 500 }}>{(analysis.arousal * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: s.lightGray, borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div initial={{ width: '0%' }} animate={{ width: `${analysis.arousal * 100}%` }}
                    transition={{ duration: 1, delay: showReveal ? 2.7 : 0.5 }}
                    style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${s.lightGray}, #0d0c0b)` }} />
                </div>
              </div>
            </div>

            {/* Full Emotion Breakdown — ALL 7 */}
            <div style={{ marginTop: 28, borderTop: `1px solid ${s.lightGray}`, paddingTop: 20, width: '100%' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: s.gray, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>สัดส่วนอารมณ์</p>
              {emotionPercentages.map((item, i) => (
                <motion.div key={item.emotion} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (showReveal ? 2.8 : 0.4) + i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, width: 68, color: item.emotion === analysis.dominantEmotion ? s.black : s.gray, fontWeight: item.emotion === analysis.dominantEmotion ? 600 : 400 }}>
                    {EMOTION_LABEL_TH[item.emotion] || item.emotion}
                  </span>
                  <div style={{ flex: 1, height: 4, background: s.lightGray, borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div initial={{ width: '0%' }} animate={{ width: `${Math.max(item.pct, 1)}%` }}
                      transition={{ duration: 0.6, delay: (showReveal ? 3 : 0.5) + i * 0.05 }}
                      style={{ height: '100%', borderRadius: 2, background: EMOTION_COLORS[item.emotion] || s.black }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, width: 28, textAlign: 'right', color: item.pct > 0 ? s.black : s.gray }}>{item.pct}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: AI Analysis + Tags */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showReveal ? 2.5 : 0.2 }}
            style={{ background: s.white, border: `1px solid ${s.lightGray}`, borderRadius: 16, padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column' }}>
            
            {/* AI Interpretation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Sparkles style={{ width: 20, height: 20, color: '#D4A853' }} />
              <h3 style={{ fontFamily: s.serif, fontSize: 20 }}>AI วิเคราะห์</h3>
            </div>
            <div style={{ background: '#fafaf8', border: `1px solid ${s.lightGray}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontSize: 15, lineHeight: 1.8, fontWeight: 300, color: '#3a3835' }}>
                {analysis.aiInterpretation}
              </p>
            </div>

            {/* Reasoning — AI's thought process */}
            {analysis.reasoning && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: s.gray, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>กระบวนการวิเคราะห์</p>
                <div style={{ background: '#fafaf8', border: `1px dashed ${s.lightGray}`, borderRadius: 10, padding: 16 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, fontWeight: 300, color: '#6b6860', fontStyle: 'italic' }}>
                    {analysis.reasoning}
                  </p>
                </div>
              </div>
            )}

            {/* Search Tags */}
            {analysis.searchKeywords && analysis.searchKeywords.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: s.gray, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>คำค้นหาเพลง</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {analysis.searchKeywords.map((kw: string, i: number) => (
                    <span key={i} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 999, background: s.black, color: '#fff' }}>#{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Music Section */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: showReveal ? 3 : 0.5 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: s.gray, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Music style={{ width: 14, height: 14 }} /> เพลงที่เลือกให้คุณ
            </p>
            <h2 style={{ fontFamily: s.serif, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1 }}>
              เพลย์ลิสต์สำหรับอารมณ์ <em style={{ fontStyle: 'italic', color: domColor }}>{domTH}</em>
            </h2>
          </div>

          {/* Track Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            {tracks.map((track, i) => {
              const isPlaying = playingId === track.id;
              return (
                <motion.div key={track.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (showReveal ? 3.2 : 0.6) + i * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                    background: isPlaying ? '#fefcf6' : s.white,
                    border: `1px solid ${isPlaying ? domColor + '66' : s.lightGray}`,
                    borderRadius: 12, transition: 'all 0.2s', position: 'relative',
                  }}>
                  {/* Album art + play button */}
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    <img src={track.albumImage || ''} alt={track.name}
                      style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', background: s.lightGray }} />
                    {track.previewUrl && (
                      <button onClick={() => togglePlay(track.id, track.previewUrl)}
                        style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isPlaying ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                          borderRadius: 8, border: 'none', cursor: 'pointer', opacity: isPlaying ? 1 : 0,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => { if (!isPlaying) e.currentTarget.style.opacity = '0'; }}>
                        {isPlaying
                          ? <Pause style={{ width: 20, height: 20, color: '#fff' }} fill="#fff" />
                          : <Play style={{ width: 20, height: 20, color: '#fff' }} fill="#fff" />}
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</p>
                    <p style={{ fontSize: 12, color: s.gray, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{track.artist}</p>
                    {isPlaying && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Volume2 style={{ width: 10, height: 10, color: domColor }} />
                        <span style={{ fontSize: 10, color: domColor, fontWeight: 500 }}>กำลังเล่น...</span>
                      </motion.div>
                    )}
                  </div>
                  <a href={track.deezerUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ flexShrink: 0, padding: 6, borderRadius: 6, display: 'flex', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = s.lightGray}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <ExternalLink style={{ width: 14, height: 14, color: s.gray }} />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: showReveal ? 3.5 : 0.8 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 16px)', marginTop: 'clamp(32px, 6vw, 64px)', flexWrap: 'wrap' }}>
          <button onClick={() => { if (audioRef.current) audioRef.current.pause(); router.push('/analyze'); }}
            style={{ background: s.black, color: '#fff', border: 'none', borderRadius: 999, padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 32px)', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 500, cursor: 'pointer', fontFamily: s.font, display: 'flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(13,12,11,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <RefreshCw style={{ width: 16, height: 16 }} /> วิเคราะห์อีกครั้ง
          </button>
          <button onClick={() => { if (navigator.share) navigator.share({ title: 'Music Mood', text: `ฉันกำลังรู้สึก${domTH}! ลองมาวิเคราะห์อารมณ์กัน`, url: window.location.origin }); }}
            style={{ background: 'transparent', color: s.black, border: `1px solid ${s.lightGray}`, borderRadius: 999, padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 32px)', fontSize: 'clamp(12px, 2vw, 14px)', cursor: 'pointer', fontFamily: s.font, display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.black}
            onMouseLeave={e => e.currentTarget.style.borderColor = s.lightGray}>
            <Share2 style={{ width: 16, height: 16 }} /> แชร์ผลลัพธ์
          </button>
        </motion.div>
      </div>
    </div>
  );
}
