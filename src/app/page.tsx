'use client';

import { useState, useEffect, useRef } from 'react';
import './style.css';

// ข้อมูลอารมณ์และเพลงประกอบ (ตามโค้ดต้นฉบับ HTML)
const eData: Record<string, { icon: string; song: string; artist: string; ex: string }> = {
  happy: { icon: '☀️', song: 'Good as Hell', artist: 'Lizzo · valence 0.91 · energy 0.82', ex: 'อารมณ์เชิงบวกสูง — เพลง upbeat ช่วยเสริมพลังงานความสุขให้คงอยู่นานขึ้น' },
  excited: { icon: '⚡', song: 'Blinding Lights', artist: 'The Weeknd · valence 0.73 · energy 0.80', ex: 'ตรวจพบ arousal สูง — เพลง synth-pop รักษาโมเมนตัมของอารมณ์ตื่นเต้นไว้' },
  sad: { icon: '🌧', song: 'The Night We Met', artist: 'Lord Huron · valence 0.24 · energy 0.33', ex: 'ตรวจพบ valence ต่ำ — เพลงที่มี melancholic tone ช่วยให้อารมณ์ระบายออกได้ปลอดภัย' },
  calm: { icon: '🍃', song: 'Clair de Lune', artist: 'Debussy · valence 0.48 · energy 0.14', ex: 'สภาวะ relaxed แต่ aware — เพลง classical เบาๆ รักษาความสงบได้ลงตัว' },
  stressed: { icon: '💨', song: 'Weightless', artist: 'Marconi Union · valence 0.31 · energy 0.11', ex: 'ตรวจพบ high negative arousal — เพลง ambient นี้พิสูจน์แล้วว่าช่วยลด cortisol ได้จริง' },
  tired: { icon: '🌙', song: 'Moon River', artist: 'Henry Mancini · valence 0.40 · energy 0.12', ex: 'พลังงานต่ำมาก — เพลงเนิบช้าช่วยให้ร่างกายผ่อนคลายเข้าสู่โหมดพักผ่อน' },
  angry: { icon: '🌊', song: 'Breathe (2 AM)', artist: 'Anna Nalick · valence 0.28 · energy 0.45', ex: 'ตรวจพบ negative arousal — เพลงจังหวะกลางช่วยดึงอารมณ์กลับสู่สมดุลทีละขั้น' },
  confused: { icon: '💭', song: 'On the Nature of Daylight', artist: 'Max Richter · valence 0.19 · energy 0.08', ex: 'สภาวะไม่แน่ใจ — เพลง neo-classical ช่วยให้จิตใจชัดเจนขึ้นโดยไม่บีบบังคับ' },
};

const phrases = [
  'วันนี้เหนื่อยมากเลย งานเยอะจนหัวแตก...',
  'รู้สึกดีขึ้นมากเลย ทุกอย่างดูสดใสกว่าปกติ 😊',
  'อยากนอนฟังเพลงเงียบๆ ไม่อยากทำอะไรเลยวันนี้'
];

export default function Home() {
  // ── 1. States สำหรับหน้าต่างต้อนรับและป๊อปอัป ──
  const [isStarted, setIsStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // ── 2. States สำหรับลูกเล่นจำลอง (Mocks) ──
  const [camChipText, setCamChipText] = useState('กำลังวิเคราะห์...');
  const [textTyped, setTextTyped] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  // Refs สำหรับการจัดขยับ Custom Cursor ตามไฟล์ HTML เดิม
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRefRef = useRef<HTMLDivElement>(null);

  // ── 3. ฟังก์ชันและ Side Effects (สืบทอดจาก JavaScript เดิม) ──
  useEffect(() => {
    // ระบบ Custom Cursor เคลื่อนตามเมาส์
    const moveCursor = (e: MouseEvent) => {
      if (dotRef.current) dotRef.current.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 4}px)`;
      if (ringRefRef.current) ringRefRef.current.style.transform = `translate(${e.clientX - 18}px,${e.clientY - 18}px)`;
    };

    // ระบบตรวจจับการเลื่อนหน้าจอเปลี่ยนสี Navbar
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    // เปิดคีย์บอร์ดลัดปุ่ม Escape เพื่อกดปิดโมดอล
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ระบบสลับข้อความ Camera chip cycling
  useEffect(() => {
    if (!isStarted) return;
    const chips = ['กำลังวิเคราะห์...', 'ตรวจจับใบหน้าแล้ว ✓', 'อ่านสีหน้า... 😐', 'วิเคราะห์อารมณ์... 🔍', 'พบ: ความเหนื่อยล้าเล็กน้อย'];
    let ci = 0;
    const interval = setInterval(() => {
      ci = (ci + 1) % chips.length;
      setCamChipText(chips[ci]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isStarted]);

  // ระบบพิมพ์ดีดอัตโนมัติในโหมดข้อความ Text mode typewriter
  useEffect(() => {
    if (activeModal !== 'text') return;
    let pi = 0, pos = 0, dir = 1;
    let timer: NodeJS.Timeout;

    const typeLoop = () => {
      const phrase = phrases[pi];
      if (dir === 1) {
        setTextTyped(phrase.slice(0, pos + 1));
        pos++;
        if (pos >= phrase.length) {
          dir = -1;
          timer = setTimeout(typeLoop, 2200);
          return;
        }
      } else {
        setTextTyped(phrase.slice(0, pos - 1));
        pos--;
        if (pos <= 0) {
          dir = 1;
          pi = (pi + 1) % phrases.length;
          timer = setTimeout(typeLoop, 500);
          return;
        }
      }
      timer = setTimeout(typeLoop, dir === 1 ? 44 : 16);
    };

    timer = setTimeout(typeLoop, 900);
    return () => clearTimeout(timer);
  }, [activeModal]);

  // ฟังก์ชันสลับเพื่อควบคุมการเปิดและปิดโมดอล
  const openModal = (type: string) => {
    document.body.style.overflow = 'hidden';
    setActiveModal(type);
  };

  const closeModal = () => {
    document.body.style.overflow = '';
    setActiveModal(null);
  };

  // แตะเลือกข้อความแบบด่วน QuickFill
  const quickFill = (text: string) => {
    setTextTyped(text);
  };

  // ──── หน้าจอ Welcome หน้าขาวตัวหนังสือใหญ่ (เพิ่มเพื่อตอบโจทย์พาร์ทเริ่มแรก) ────
  if (!isStarted) {
    return (
      <main onClick={() => setIsStarted(true)} className="welcome-screen">
        <div className="welcome-content">
          <h1 className="main-title-large">วันนี้คุณรู้สึก<br />ยังไงบ้าง</h1>
          <p className="start-hint">— คลิกที่ใดก็ได้เพื่อเริ่มต้น —</p>
        </div>
      </main>
    );
  }

  // ──── หน้าเว็บเวอร์ชันเต็มดึงจากโครงสร้าง HTML เดิมแบบเป๊ะๆ ────
  return (
    <div className={activeModal ? 'has-open-modal' : ''}>
      {/* วงโคจร Custom Cursor */}
      <div className="cursor-dot" ref={dotRef}></div>
      <div className="cursor-ring" ref={ringRefRef}></div>

      {/* แถบนำทางด้านบน Navbar */}
      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        <a className="nav-logo" href="#"><span className="dot"></span>Music Mood</a>
        <ul className="nav-links">
          <li><a href="#modes">Modes</a></li>
          <li><a href="#mood">Try it</a></li>
        </ul>
        <button className="nav-cta" onClick={() => openModal('camera')}>ลองใช้งาน →</button>
      </nav>

      {/* ส่วนหัวเว็บหลัก Hero Section */}
      <div className="hero">
        <div className="hero-bg-text" aria-hidden="true">MOOD</div>
        <div className="hero-tag"><span className="blink"></span>CPE 494 · Humanities Computing</div>
        <h1 className="hero-title">วันนี้คุณ<em>รู้สึก</em><br />ยังไง<em>บ้าง</em></h1>
        <p className="hero-sub">แพลตฟอร์มแนะนำเพลงที่วิเคราะห์อารมณ์ของคุณ ผ่านสีหน้า ข้อความ หรือแค่อีโมจิ แล้วเลือกเพลงที่ตรงใจที่สุดให้คุณ</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => openModal('camera')}>เริ่มต้นเลย <span className="arrow">→</span></button>
          <button className="btn-ghost" onClick={() => document.getElementById('modes')?.scrollIntoView({ behavior: 'smooth' })}>ดูโหมดทั้งหมด</button>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <div className="scroll-line"></div>scroll
        </div>
      </div>

      {/* แถบอักษรวิ่ง Marquee */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee-inner">
          <b>วันนี้เหนื่อยไหม?</b><span>·</span><b>ตอนนี้รู้สึกยังไงบ้างนะ?</b><span>·</span><b>มีเรื่องอะไรในใจหรือเปล่า?</b><span>·</span><b>ยิ้มออกไหมวันนี้?</b><span>·</span><b>กำลังตามหาความสงบอยู่ใช่ไหม?</b><span>·</span><b>พร้อมแบ่งปันความรู้สึกหรือยัง?</b><span>·</span>
          <b>วันนี้เหนื่อยไหม?</b><span>·</span><b>ตอนนี้รู้สึกยังไงบ้างนะ?</b><span>·</span><b>มีเรื่องอะไรในใจหรือเปล่า?</b><span>·</span><b>ยิ้มออกไหมวันนี้?</b><span>·</span><b>กำลังตามหาความสงบอยู่ใช่ไหม?</b><span>·</span><b>พร้อมแบ่งปันความรู้สึกหรือยัง?</b><span>·</span>
        </div>
      </div>

      {/* ส่วนระบบเลือก 3 โหมดประมวลผล */}
      <section id="modes">
        <p className="section-label">3 โหมด</p>
        <h2 className="section-title">เลือกวิธีบอกอารมณ์<br /><em>ที่สบายใจที่สุด</em></h2>
        <div className="modes-grid">
          <div className="mode-card" onClick={() => openModal('camera')}>
            <div className="mode-num">01</div>
            <div className="mode-icon">📷</div>
            <div className="mode-name">Camera + Text</div>
            <p className="mode-desc">เปิดกล้องให้ AI สแกนสีหน้า พร้อมเขียนบันทึกความรู้สึก เพื่อการวิเคราะห์อารมณ์ที่แม่นยำที่สุด</p>
            <button className="mode-cta">เข้าโหมดนี้ →</button>
          </div>
          <div className="mode-card" onClick={() => openModal('text')}>
            <div className="mode-num">02</div>
            <div className="mode-icon">✍️</div>
            <div className="mode-name">Text Only</div>
            <p className="mode-desc">ระบายความรู้สึกผ่านตัวอักษรเพียงอย่างเดียว สำหรับวันที่ต้องการความเป็นส่วนตัวมากขึ้น</p>
            <button className="mode-cta">เข้าโหมดนี้ →</button>
          </div>
          <div className="mode-card" onClick={() => openModal('emoji')}>
            <div className="mode-num">03</div>
            <div className="mode-icon">😶</div>
            <div className="mode-name">Emoji Mode</div>
            <p className="mode-desc">วันที่เหนื่อยล้าจนไม่อยากพิมพ์ แค่แตะอีโมจิที่ตรงกับตอนนี้ ระบบจะจัดการเองทั้งหมด</p>
            <button className="mode-cta">เข้าโหมดนี้ →</button>
          </div>
        </div>
      </section>

      {/* แถบด่วนเลือกกดกลุ่มอารมณ์ Mood Strip */}
      <div className="mood-strip" id="mood">
        <p className="label">วันนี้คุณเป็นยังไงบ้าง?</p>
        <h2>แค่แตะ ระบบรู้เลย</h2>
        <div className="emoji-row">
          <div className="emoji-item" data-song="☀️ Happy songs for you" onClick={() => { openModal('emoji'); setSelectedEmoji('happy'); }}>
            <div className="em">😄</div>
            <div className="mood-label">มีความสุข</div>
          </div>
          <div className="emoji-item" data-song="🎸 Energetic vibes" onClick={() => { openModal('emoji'); setSelectedEmoji('excited'); }}>
            <div className="em">🔥</div>
            <div className="mood-label">ตื่นเต้น</div>
          </div>
          <div className="emoji-item" data-song="🌧 Soft melancholy" onClick={() => { openModal('emoji'); setSelectedEmoji('sad'); }}>
            <div className="em">😔</div>
            <div className="mood-label">เศร้า</div>
          </div>
          <div className="emoji-item" data-song="🍃 Calm & chill" onClick={() => { openModal('emoji'); setSelectedEmoji('calm'); }}>
            <div className="em">😌</div>
            <div className="mood-label">ผ่อนคลาย</div>
          </div>
          <div className="emoji-item" data-song="⚡ Stress-buster" onClick={() => { openModal('emoji'); setSelectedEmoji('stressed'); }}>
            <div className="em">😤</div>
            <div className="mood-label">เครียด</div>
          </div>
          <div className="emoji-item" data-song="🌙 Late night feels" onClick={() => { openModal('emoji'); setSelectedEmoji('tired'); }}>
            <div className="em">😴</div>
            <div className="mood-label">เหนื่อยล้า</div>
          </div>
          <div className="emoji-item" data-song="💭 Introspective" onClick={() => { openModal('emoji'); setSelectedEmoji('confused'); }}>
            <div className="em">🤔</div>
            <div className="mood-label">ลังเล</div>
          </div>
        </div>
      </div>

      {/* ฟุตเตอร์ปิดท้ายเพจ */}
      <footer>
        <div>
          <strong>Music Mood CPE</strong>
          <div style={{ marginTop: '4px' }}>ไม่ว่าวันนี้จะเจออะไรมา... พักฟังเพลงสบายๆ เติมพลังให้ใจก่อนนะ 🤍</div>
        </div>
        <div>ทุกความรู้สึกของคุณมีค่าเสมอ · ขอบคุณที่แวะมาแบ่งปัน</div>
      </footer>

      {/* ─── MODAL 01: CAMERA + TEXT ─── */}
      <div className={`modal-overlay ${activeModal === 'camera' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal-box">
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-badge">📷 โหมด 01</div>
          <h2 className="modal-title">Camera + <em>Text</em></h2>
          <p className="modal-sub">ให้ AI อ่านสีหน้าและความรู้สึกของคุณพร้อมกัน — แม่นยำที่สุดในทั้ง 3 โหมด</p>

          <div className="modal-steps">
            <div className="modal-step active">
              <div className="modal-step-num">ขั้น 1</div>
              <div className="modal-step-label">เปิดกล้อง</div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">ขั้น 2</div>
              <div className="modal-step-label">เขียนระบาย</div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">ขั้น 3</div>
              <div className="modal-step-label">รับเพลง</div>
            </div>
          </div>

          <div className="modal-ui">
            <div className="modal-ui-label">ตัวอย่างหน้าจอ</div>
            <div className="camera-preview">
              <div className="face-frame"></div>
              <div className="emotion-chip">{camChipText}</div>
            </div>
            <textarea className="mock-textarea" placeholder="วันนี้รู้สึกยังไงบ้าง? เขียนระบายได้เลย..."></textarea>
          </div>

          <div style={{ background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '10px' }}>เพลงที่แนะนำ</div>
            <div className="result-card">
              <div className="result-art">🎵</div>
              <div className="result-info">
                <div className="result-song">Comptine d&apos;un autre été</div>
                <div className="result-artist">Yann Tiersen · valence 0.42 · energy 0.31</div>
                <div className="result-bar">
                  <div className="result-bar-fill"></div>
                </div>
              </div>
            </div>
            <div className="explain-box">ตรวจจับ <strong>ความเครียดเล็กน้อย</strong> จากสีหน้า และ <strong>ความเหนื่อยล้า</strong> จากข้อความ — เพลง ambient เปียโนช่วยให้ระบบประสาทผ่อนคลายโดยไม่บีบบังคับ</div>
          </div>
          <button className="modal-action">เริ่มใช้งานโหมดนี้ →</button>
        </div>
      </div>

      {/* ─── MODAL 02: TEXT ONLY ─── */}
      <div className={`modal-overlay ${activeModal === 'text' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal-box">
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-badge">✍️ โหมด 02</div>
          <h2 className="modal-title">Text <em>Only</em></h2>
          <p className="modal-sub">พิมพ์ระบายได้อย่างเป็นส่วนตัว — AI อ่านน้ำเสียงของข้อความและหาเพลงที่ใช่ให้คุณ</p>

          <div className="modal-steps">
            <div className="modal-step active">
              <div className="modal-step-num">ขั้น 1</div>
              <div className="modal-step-label">เขียนระบาย</div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">ขั้น 2</div>
              <div className="modal-step-label">AI วิเคราะห์</div>
            </div>
            <div className="modal-step">
              <div className="modal-step-num">ขั้น 3</div>
              <div className="modal-step-label">รับเพลง</div>
            </div>
          </div>

          <div className="modal-ui">
            <div className="modal-ui-label">พิมพ์ความรู้สึกได้เลย</div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--light-gray)', borderRadius: '12px', padding: '18px', minHeight: '100px' }}>
              <div style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7, color: 'var(--black)', minHeight: '72px' }}>{textTyped}</div>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: 'var(--radius-pill)', padding: '4px 12px', color: 'var(--mid-gray)', cursor: 'pointer' }} onClick={() => quickFill('วันนี้เหนื่อยมาก งานเยอะจนหัวแตก...')}>😔 เครียดจากงาน</span>
                  <span style={{ fontSize: '12px', background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: 'var(--radius-pill)', padding: '4px 12px', color: 'var(--mid-gray)', cursor: 'pointer' }} onClick={() => quickFill('วันนี้รู้สึกดีมากเลย ทุกอย่างสดใสกว่าปกติ!')}>😄 มีความสุข</span>
                  <span style={{ fontSize: '12px', background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: 'var(--radius-pill)', padding: '4px 12px', color: 'var(--mid-gray)', cursor: 'pointer' }} onClick={() => quickFill('อยากนอนฟังเพลงเงียบๆ ไม่อยากทำอะไรเลยวันนี้')}>😌 อยากผ่อนคลาย</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--mid-gray)', width: '70px', textAlign: 'right' }}>{textTyped.length} / 300</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '10px' }}>การวิเคราะห์ของ AI</div>
            <div style={{ fontSize: '14px', fontWeight: 300, color: 'var(--dark-gray)', lineHeight: 1.7, paddingBottom: '12px', borderBottom: '1px solid var(--light-gray)' }}>ตรวจพบ <strong>ความเครียดสะสม</strong> และ <strong>ความต้องการผ่อนคลาย</strong> — แนะนำเพลง ambient ที่มี energy ต่ำ valence กลาง เพื่อให้จิตใจค่อยๆ สงบลง</div>
            <div className="result-card">
              <div className="result-art">🎶</div>
              <div className="result-info">
                <div className="result-song">Experience</div>
                <div className="result-artist">Ludovico Einaudi · valence 0.38 · energy 0.28</div>
                <div className="result-bar">
                  <div className="result-bar-fill"></div>
                </div>
              </div>
            </div>
          </div>
          <button className="modal-action">เริ่มพิมพ์ระบายเลย →</button>
        </div>
      </div>

      {/* ─── MODAL 03: EMOJI MODE ─── */}
      <div className={`modal-overlay ${activeModal === 'emoji' ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="modal-box">
          <button className="modal-close" onClick={closeModal}>✕</button>
          <div className="modal-badge">😶 โหมด 03</div>
          <h2 className="modal-title">Emoji <em>Mode</em></h2>
          <p className="modal-sub">ไม่ต้องพิมพ์ ไม่ต้องเปิดกล้อง — แค่แตะอีโมจิที่ตรงกับตอนนี้ แล้วรับเพลงทันที</p>

          <div className="modal-ui">
            <div className="modal-ui-label">วันนี้รู้สึกแบบไหน?</div>
            <div className="emoji-grid-mock">
              {Object.keys(eData).map((key) => (
                <div key={key} className={`ebtn ${selectedEmoji === key ? 'selected' : ''}`} onClick={() => setSelectedEmoji(key)}>
                  <div className="ebtn-em">
                    {key === 'happy' && '😄'} {key === 'excited' && '🔥'} {key === 'sad' && '😔'} {key === 'calm' && '😌'}
                    {key === 'stressed' && '😤'} {key === 'tired' && '😴'} {key === 'angry' && '😠'} {key === 'confused' && '🤔'}
                  </div>
                  <div className="ebtn-label">
                    {key === 'happy' && 'มีความสุข'} {key === 'excited' && 'ตื่นเต้น'} {key === 'sad' && 'เศร้า'} {key === 'calm' && 'ผ่อนคลาย'}
                    {key === 'stressed' && 'เครียด'} {key === 'tired' && 'เหนื่อยล้า'} {key === 'angry' && 'หงุดหงิด'} {key === 'confused' && 'ลังเล'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedEmoji && eData[selectedEmoji] && (
            <div id="emojiResult" className="fade-up-anim" style={{ background: 'var(--off-white)', border: '1px solid var(--light-gray)', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-gray)', marginBottom: '10px' }}>เพลงสำหรับอารมณ์นี้</div>
              <div className="result-card">
                <div className="result-art">{eData[selectedEmoji].icon}</div>
                <div className="result-info">
                  <div className="result-song">{eData[selectedEmoji].song}</div>
                  <div className="result-artist">{eData[selectedEmoji].artist}</div>
                  <div className="result-bar">
                    <div className="result-bar-fill"></div>
                  </div>
                </div>
              </div>
              <div className="explain-box" style={{ marginTop: '14px' }}>{eData[selectedEmoji].ex}</div>
            </div>
          )}

          <button className="modal-action" disabled={!selectedEmoji} style={!selectedEmoji ? { opacity: 0.4 } : {}}>
            {selectedEmoji ? 'เปิดเพลงนี้เลย →' : 'เลือกอีโมจิก่อนเลย 👆'}
          </button>
        </div>
      </div>
    </div>
  );
}