'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Camera, MessageSquare, Smile, Music, Heart, Headphones, Sun, Zap, CloudRain, Leaf, Wind, Moon, Waves, Lightbulb } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import type { EmotionLabel } from '@/lib/types';
import { useState } from 'react';
import { getRecommendations } from '@/app/actions/deezer';
import { analyzeTextEmotion } from '@/app/actions/gemini';

const moodIcons: { key: string; icon: any; label: string; emotion: EmotionLabel; textHint: string }[] = [
  { key: 'happy', icon: Sun, label: 'มีความสุข', emotion: 'happy', textHint: 'ฉันรู้สึกมีความสุขมากวันนี้' },
  { key: 'excited', icon: Zap, label: 'ตื่นเต้น', emotion: 'excited', textHint: 'ฉันรู้สึกตื่นเต้นและมีพลัง' },
  { key: 'sad', icon: CloudRain, label: 'เศร้า', emotion: 'sad', textHint: 'ฉันรู้สึกเศร้าและหม่นหมอง' },
  { key: 'calm', icon: Leaf, label: 'ผ่อนคลาย', emotion: 'calm', textHint: 'ฉันรู้สึกสงบและผ่อนคลาย' },
  { key: 'stressed', icon: Wind, label: 'เครียด', emotion: 'fearful', textHint: 'ฉันรู้สึกเครียดและกังวลมาก' },
  { key: 'tired', icon: Moon, label: 'เหนื่อยล้า', emotion: 'sad', textHint: 'ฉันเหนื่อยมาก หมดแรง' },
  { key: 'confused', icon: Lightbulb, label: 'ลังเล', emotion: 'surprised', textHint: 'ฉันรู้สึกสับสนและไม่แน่ใจ' },
];

export default function HomePage() {
  const router = useRouter();
  const [loadingMood, setLoadingMood] = useState<string | null>(null);

  const handleMoodClick = async (mood: typeof moodIcons[number]) => {
    setLoadingMood(mood.key);
    try {
      // Use real AI analysis
      const analysis = await analyzeTextEmotion(mood.textHint, ['Thai', 'English']);
      const tracks = await getRecommendations(analysis.dominantEmotion, ['Thai', 'English'], analysis.searchKeywords);
      sessionStorage.setItem('moodResult', JSON.stringify({ analysis, tracks, timestamp: Date.now() }));
      router.push('/result');
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setLoadingMood(null);
    }
  };


  return (
    <div style={{ background: '#f7f6f3', color: '#0d0c0b', fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden' }}>
      <Navbar />

      {/* ============ HERO ============ */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 48px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(140px, 22vw, 320px)', color: '#e8e6e1', opacity: 0.5,
          whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          letterSpacing: '-0.04em', zIndex: 0,
        }}>MOOD</div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#fff', border: '1px solid #e8e6e1', borderRadius: '999px',
            padding: '6px 16px 6px 10px', fontSize: '12px', color: '#9e9b94',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '32px',
            position: 'relative', zIndex: 1,
          }}>
          <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', animation: 'blink 1.5s ease-in-out infinite' }} />
          CPE 494 · Humanities Computing
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(52px, 8vw, 96px)',
            lineHeight: 1.35, letterSpacing: '-0.01em', position: 'relative', zIndex: 1, fontWeight: 400,
          }}>
          วันนี้คุณ<em style={{ fontStyle: 'italic', color: '#9e9b94' }}>รู้สึก</em><br />
          ยังไง<em style={{ fontStyle: 'italic', color: '#9e9b94' }}>บ้าง</em>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ maxWidth: 500, fontSize: 17, fontWeight: 300, color: '#9e9b94', lineHeight: 1.65, margin: '24px auto 0', position: 'relative', zIndex: 1 }}>
          แพลตฟอร์มแนะนำเพลงที่วิเคราะห์อารมณ์ของคุณ ผ่านสีหน้า ข้อความ หรือแค่อีโมจิ แล้วเลือกเพลงที่ตรงใจที่สุดให้คุณ
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 48, position: 'relative', zIndex: 1 }}>
          <button onClick={() => router.push('/analyze')}
            style={{ background: '#0d0c0b', color: '#fff', border: 'none', borderRadius: 999, padding: '14px 32px', fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif", transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(13,12,11,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            เริ่มต้นเลย <span>→</span>
          </button>
          <button onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'transparent', color: '#0d0c0b', border: '1px solid #e8e6e1', borderRadius: 999, padding: '14px 32px', fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d0c0b'; e.currentTarget.style.background = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8e6e1'; e.currentTarget.style.background = 'transparent'; }}>
            ดูโหมดทั้งหมด
          </button>
        </motion.div>

        <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontSize: 11, color: '#9e9b94', letterSpacing: '0.1em', textTransform: 'uppercase', zIndex: 1 }}>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #9e9b94, transparent)', animation: 'scrollDown 2s ease-in-out infinite' }} />
          scroll
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div aria-hidden="true" style={{ overflow: 'hidden', borderTop: '1px solid #e8e6e1', borderBottom: '1px solid #e8e6e1', padding: '18px 0', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'marquee 28s linear infinite', fontFamily: "'DM Serif Display', serif", fontSize: 16 }}>
          <b>วันนี้เหนื่อยไหม?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>ตอนนี้รู้สึกยังไงบ้างนะ?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>มีเรื่องอะไรในใจหรือเปล่า?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>ยิ้มออกไหมวันนี้?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>กำลังตามหาความสงบอยู่ใช่ไหม?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>พร้อมแบ่งปันความรู้สึกหรือยัง?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>วันนี้เหนื่อยไหม?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>ตอนนี้รู้สึกยังไงบ้างนะ?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>มีเรื่องอะไรในใจหรือเปล่า?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>ยิ้มออกไหมวันนี้?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>กำลังตามหาความสงบอยู่ใช่ไหม?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
          <b>พร้อมแบ่งปันความรู้สึกหรือยัง?</b><span style={{ color: '#9e9b94', margin: '0 32px' }}>·</span>
        </div>
      </div>

      {/* ============ 3 MODES ============ */}
      <section id="modes" style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9e9b94', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'block', width: 32, height: 1, background: '#9e9b94' }} />3 โหมด
        </p>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 640, marginBottom: 64 }}>
          เลือกวิธีบอกอารมณ์<br /><em style={{ fontStyle: 'italic', color: '#9e9b94' }}>ที่สบายใจที่สุด</em>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: '#e8e6e1', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { num: '01', icon: Camera, name: 'Camera + Text', desc: 'เปิดกล้องให้ AI สแกนสีหน้า พร้อมเขียนบันทึกความรู้สึก เพื่อการวิเคราะห์ที่แม่นยำที่สุด', mode: 'both' },
            { num: '02', icon: MessageSquare, name: 'Text Only', desc: 'ระบายความรู้สึกผ่านตัวอักษรเพียงอย่างเดียว สำหรับวันที่ต้องการความเป็นส่วนตัว', mode: 'journal' },
            { num: '03', icon: Smile, name: 'Emoji Mode', desc: 'วันที่เหนื่อยล้าจนไม่อยากพิมพ์ แค่แตะไอคอนที่ตรงกับตอนนี้ ระบบจะจัดการเอง', mode: 'emoji' },
          ].map(card => (
            <motion.div key={card.num}
              onClick={() => router.push(`/analyze?mode=${card.mode}`)}
              whileHover={{ backgroundColor: '#0d0c0b' }}
              style={{ background: '#fff', padding: '40px 32px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              className="mode-card-hover"
            >
              <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#9e9b94', marginBottom: 28 }}>{card.num}</div>
              <div style={{ width: 48, height: 48, background: '#f7f6f3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <card.icon style={{ width: 24, height: 24 }} strokeWidth={1.5} />
              </div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, marginBottom: 12 }}>{card.name}</div>
              <p style={{ fontSize: 14, fontWeight: 300, color: '#9e9b94', lineHeight: 1.6, marginBottom: 28 }}>{card.desc}</p>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, border: '1px solid #e8e6e1', borderRadius: 999, padding: '7px 18px', background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                เข้าโหมดนี้ →
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ MOOD STRIP ============ */}
      <div id="mood" style={{ background: '#0d0c0b', color: '#fff', padding: '80px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>วันนี้คุณเป็นยังไงบ้าง?</p>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.02em', marginBottom: 48, lineHeight: 1.1 }}>แค่แตะ ระบบรู้เลย</h2>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {moodIcons.map(mood => (
            <button key={mood.key} onClick={() => handleMoodClick(mood)} disabled={loadingMood !== null}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 24px', borderRadius: 12, cursor: loadingMood ? 'wait' : 'pointer', transition: 'background 0.2s, transform 0.2s', border: 'none', background: loadingMood === mood.key ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}
              onMouseEnter={e => { if (!loadingMood) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}}
              onMouseLeave={e => { if (loadingMood !== mood.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = ''; }}}
            >
              <mood.icon style={{ width: 36, height: 36 }} strokeWidth={1.2} />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: '1px solid #e8e6e1', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#9e9b94' }}>
        <div>
          <strong style={{ fontFamily: "'DM Serif Display', serif", color: '#0d0c0b', fontSize: 16, fontWeight: 400 }}>Music Mood CPE</strong>
          <div style={{ marginTop: 4 }}>ไม่ว่าวันนี้จะเจออะไรมา... พักฟังเพลงสบายๆ เติมพลังให้ใจก่อนนะ</div>
        </div>
        <div>ทุกความรู้สึกของคุณมีค่าเสมอ · ขอบคุณที่แวะมาแบ่งปัน</div>
      </footer>
    </div>
  );
}
