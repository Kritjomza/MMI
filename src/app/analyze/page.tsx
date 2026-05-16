'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Camera, CameraOff, Loader2, ScanFace, Eye, Globe, ArrowLeft, Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import EmotionOrb from '@/components/EmotionOrb';
import { useFaceEmotion } from '@/hooks/useFaceEmotion';
import { analyzeTextEmotion, fuseEmotions } from '@/app/actions/gemini';
import { getRecommendations } from '@/app/actions/deezer';

type InputMode = 'both' | 'face' | 'journal';

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as InputMode) || 'both';

  const {
    videoRef, isActive, faceDetected,
    currentEmotion, emotionScores, error: cameraError,
    isModelLoading, startCamera, stopCamera, getResult,
  } = useFaceEmotion();

  const [inputMode, setInputMode] = useState<InputMode>(initialMode);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Thai', 'English']);
  const [journalText, setJournalText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      let faceResult = null;
      let textResult = null;

      if ((inputMode === 'both' || inputMode === 'face') && isActive && faceDetected) {
        setAnalysisStep('กำลังอ่านสีหน้าของคุณ...');
        faceResult = getResult();
      }
      if ((inputMode === 'both' || inputMode === 'journal') && journalText.trim()) {
        setAnalysisStep('กำลังวิเคราะห์ข้อความ...');
        textResult = await analyzeTextEmotion(journalText, selectedLanguages);
      }
      if (!faceResult && !textResult) throw new Error('ไม่มีข้อมูลสำหรับวิเคราะห์');

      setAnalysisStep('กำลังผสานอารมณ์...');
      const fusedResult = await fuseEmotions(faceResult, textResult);

      setAnalysisStep('กำลังหาเพลงที่ใช่ให้คุณ...');
      const tracks = await getRecommendations(fusedResult.dominantEmotion, selectedLanguages, fusedResult.searchKeywords);

      sessionStorage.setItem('moodResult', JSON.stringify({ analysis: fusedResult, tracks, timestamp: Date.now() }));
      router.push('/result');
    } catch (err) {
      console.error(err);
      setAnalysisStep('');
      setIsAnalyzing(false);
      alert('เกิดข้อผิดพลาด กรุณาตรวจสอบข้อมูลแล้วลองใหม่');
    }
  }, [journalText, isActive, faceDetected, getResult, router, inputMode, selectedLanguages]);

  const canAnalyze = (() => {
    if (isAnalyzing) return false;
    if (inputMode === 'both') return journalText.trim().length > 0 || (isActive && faceDetected);
    if (inputMode === 'face') return isActive && faceDetected;
    if (inputMode === 'journal') return journalText.trim().length > 0;
    return false;
  })();

  const s = {
    bg: '#f7f6f3',
    white: '#ffffff',
    black: '#0d0c0b',
    gray: '#9e9b94',
    lightGray: '#e8e6e1',
    darkGray: '#2a2926',
    font: "'DM Sans', sans-serif",
    serif: "'DM Serif Display', serif",
  };

  return (
    <div style={{ background: s.bg, minHeight: '100vh', fontFamily: s.font, color: s.black }}>
      <Navbar />

      <div style={{ position: 'relative', zIndex: 10, paddingTop: '7rem', paddingBottom: '5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button onClick={() => router.push('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: s.gray, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontFamily: s.font, marginBottom: 24 }}>
              <ArrowLeft style={{ width: 16, height: 16 }} /> กลับหน้าหลัก
            </button>
            <h1 style={{ fontFamily: s.serif, fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              บอกความ<em style={{ fontStyle: 'italic', color: s.gray }}>รู้สึก</em>ของคุณ
            </h1>
            <p style={{ fontSize: 15, fontWeight: 300, color: s.gray, marginTop: 12, lineHeight: 1.65 }}>
              เลือกวิธีที่สะดวกที่สุดสำหรับคุณ แล้ว AI จะวิเคราะห์อารมณ์ให้
            </p>
          </motion.div>

          {/* Mode Selector */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', background: s.white, border: `1px solid ${s.lightGray}`, borderRadius: 999, padding: 4, gap: 4 }}>
              {[
                { id: 'face', label: 'สแกนใบหน้า', icon: Camera },
                { id: 'both', label: 'รวม', icon: ScanFace },
                { id: 'journal', label: 'เขียนระบาย', icon: null },
              ].map(mode => (
                <button key={mode.id} onClick={() => setInputMode(mode.id as InputMode)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 999,
                    fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: s.font,
                    background: inputMode === mode.id ? s.black : 'transparent',
                    color: inputMode === mode.id ? '#fff' : s.gray,
                    transition: 'all 0.2s',
                  }}>
                  {mode.icon && <mode.icon style={{ width: 14, height: 14 }} />}
                  {mode.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Language Preferences */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: s.gray, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Globe style={{ width: 14, height: 14 }} /> ภาษาเพลงที่ต้องการ
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['Thai', 'English', 'Korean', 'Japanese', 'Chinese'].map(lang => (
                <button key={lang} onClick={() => toggleLanguage(lang)}
                  style={{
                    padding: '6px 18px', borderRadius: 999, fontSize: 12, fontWeight: 500, border: `1px solid ${s.lightGray}`,
                    cursor: 'pointer', fontFamily: s.font, transition: 'all 0.2s',
                    background: selectedLanguages.includes(lang) ? s.black : s.white,
                    color: selectedLanguages.includes(lang) ? '#fff' : s.gray,
                    borderColor: selectedLanguages.includes(lang) ? s.black : s.lightGray,
                  }}>
                  {lang}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: inputMode === 'both' ? '1fr 1fr' : '1fr', gap: 24, maxWidth: inputMode === 'both' ? 1100 : 700, margin: '0 auto' }}>

            {/* Camera Panel */}
            {(inputMode === 'both' || inputMode === 'face') && (
              <div style={{ background: s.white, border: `1px solid ${s.lightGray}`, borderRadius: 16, padding: 32, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Camera style={{ color: s.gray, width: 20, height: 20 }} />
                  <h2 style={{ fontFamily: s.serif, fontSize: 20 }}>สแกนใบหน้า</h2>
                </div>

                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#f0f0ed', borderRadius: 12, overflow: 'hidden', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: isActive ? 'block' : 'none', transform: 'scaleX(-1)' }} />
                  {!isActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.4 }}>
                      <CameraOff style={{ width: 32, height: 32 }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>กล้องปิดอยู่</span>
                    </div>
                  )}
                  {isActive && faceDetected && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'blink 1.5s ease-in-out infinite' }} />
                      ตรวจจับใบหน้าแล้ว
                    </div>
                  )}
                </div>

                <button onClick={isActive ? stopCamera : startCamera} disabled={isModelLoading && !isActive}
                  style={{
                    width: '100%', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 500,
                    border: `1px solid ${s.lightGray}`, cursor: 'pointer', fontFamily: s.font,
                    background: isActive ? s.white : s.black,
                    color: isActive ? s.black : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}>
                  {isModelLoading && !isActive ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> กำลังโหลดโมเดล...</> :
                    isActive ? <><CameraOff style={{ width: 16, height: 16 }} /> ปิดกล้อง</> :
                    <><Camera style={{ width: 16, height: 16 }} /> เปิดกล้อง</>}
                </button>

                {isActive && faceDetected && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <EmotionOrb emotion={currentEmotion} size={40} interactive={false} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{currentEmotion}</p>
                      <p style={{ fontSize: 10, color: s.gray }}>{(Math.max(...Object.values(emotionScores)) * 100).toFixed(0)}% confidence</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Journal Panel */}
            {(inputMode === 'both' || inputMode === 'journal') && (
              <div style={{ background: s.white, border: `1px solid ${s.lightGray}`, borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <ScanFace style={{ color: s.gray, width: 20, height: 20 }} />
                  <h2 style={{ fontFamily: s.serif, fontSize: 20 }}>เขียนระบาย</h2>
                </div>

                <textarea value={journalText} onChange={e => setJournalText(e.target.value)}
                  placeholder="วันนี้รู้สึกยังไงบ้าง? เขียนระบายได้เลย..."
                  style={{
                    width: '100%', minHeight: 200, padding: 20, border: `1px solid ${s.lightGray}`,
                    borderRadius: 12, fontSize: 14, fontWeight: 300, color: s.black, background: '#fafaf8',
                    resize: 'none', outline: 'none', lineHeight: 1.7, fontFamily: s.font, flex: 1,
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = s.black}
                  onBlur={e => e.currentTarget.style.borderColor = s.lightGray} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                  {['วันนี้เหนื่อยมาก งานเยอะจนหัวแตก...', 'รู้สึกดีมากเลย ทุกอย่างสดใสกว่าปกติ!', 'อยากนอนฟังเพลงเงียบๆ ไม่อยากทำอะไรเลย'].map(p => (
                    <button key={p} onClick={() => setJournalText(p)}
                      style={{ fontSize: 12, background: '#fafaf8', border: `1px solid ${s.lightGray}`, borderRadius: 999, padding: '6px 14px', color: s.gray, cursor: 'pointer', fontFamily: s.font, transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = s.black; e.currentTarget.style.color = s.black; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = s.lightGray; e.currentTarget.style.color = s.gray; }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: s.gray, textAlign: 'right', marginTop: 8 }}>{journalText.length} / 500</div>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', marginTop: 48 }}>
            <button onClick={handleAnalyze} disabled={!canAnalyze || selectedLanguages.length === 0}
              style={{
                background: s.black, color: '#fff', border: 'none', borderRadius: 999,
                padding: '16px 48px', fontSize: 15, fontWeight: 500, cursor: canAnalyze ? 'pointer' : 'not-allowed',
                fontFamily: s.font, display: 'inline-flex', alignItems: 'center', gap: 10,
                opacity: canAnalyze && selectedLanguages.length > 0 ? 1 : 0.4,
                transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
              }}
              onMouseEnter={e => { if(canAnalyze) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(13,12,11,0.18)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              {isAnalyzing ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> {analysisStep}</> :
                <><Sparkles style={{ width: 16, height: 16 }} /> วิเคราะห์อารมณ์</>}
            </button>
            {!canAnalyze && !isAnalyzing && (
              <p style={{ fontSize: 12, color: s.gray, marginTop: 16 }}>
                {inputMode === 'face' ? 'เปิดกล้องเพื่อเริ่มต้น' : inputMode === 'journal' ? 'เขียนอะไรสักหน่อยเพื่อเริ่มต้น' : 'เขียนระบายหรือเปิดกล้องเพื่อเริ่มต้น'}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,246,243,0.92)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} style={{ textAlign: 'center' }}>
              <EmotionOrb emotion="excited" size={160} interactive={false} />
              <motion.div style={{ marginTop: 32 }} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, marginBottom: 8 }}>AI กำลังวิเคราะห์...</p>
                <p style={{ fontSize: 14, color: '#9e9b94' }}>{analysisStep}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f6f3' }}>กำลังโหลด...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
