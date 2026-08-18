'use client';

import { useEffect, useRef, useState } from 'react';
import './wishes-display.css';

export const dynamic = 'force-dynamic';

const SPOTLIGHT_SECONDS = 8;
const REFRESH_SECONDS = 12;

// Generates enough scatter "slots" around the edges of the screen to fit
// ALL of the given count at once — splitting them between a top band and a
// bottom band, and picking however many rows/columns each band needs. The
// middle of the screen is always left clear for the title + spotlight card;
// as the count grows, cards just get packed in denser (more, smaller rows)
// rather than ever needing to page/rotate them out.
function generateSlots(count) {
  if (count <= 0) return { slots: [], colWidth: 12 };
  const perSide = Math.ceil(count / 2);
  const maxCols = 14;
  const maxBandHeight = 20; // % of viewport — hard cap so the center title
  // and spotlight card always keep a big, guaranteed-clear middle area.
  const rowHeightPercent = 7.5;

  // Prefer widening (more columns) over growing taller (more rows), so the
  // top/bottom bands stay shallow even as the wish count grows.
  let cols = Math.min(maxCols, Math.max(6, Math.ceil(perSide / 2)));
  let rows = Math.max(1, Math.ceil(perSide / cols));
  while (rows * rowHeightPercent > maxBandHeight && cols < maxCols) {
    cols += 1;
    rows = Math.max(1, Math.ceil(perSide / cols));
  }

  const bandHeight = Math.min(maxBandHeight, rows * rowHeightPercent);
  const rowGap = rows > 1 ? bandHeight / (rows - 1) : 0;
  const colWidth = 99 / cols;

  const slots = [];
  for (let side = 0; side < 2; side++) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const top = side === 0
          ? `${1 + row * rowGap}%`
          : `${98 - bandHeight + row * rowGap}%`;
        slots.push({
          top,
          left: `${0.5 + col * colWidth}%`,
          rotate: (col % 2 === 0 ? -1 : 1) * (2 + (row % 3)) * (side === 0 ? 1 : -1),
        });
      }
    }
  }
  return { slots, colWidth };
}

function Petals() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let petals = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function makePetal() {
      return {
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        r: 4 + Math.random() * 6,
        speed: 0.3 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 0.5,
        sway: Math.random() * Math.PI * 2,
        opacity: 0.2 + Math.random() * 0.35,
      };
    }
    const count = Math.max(16, Math.floor(window.innerWidth / 100));
    petals = Array.from({ length: count }, makePetal);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.y += p.speed;
        p.sway += 0.01;
        p.x += p.drift + Math.sin(p.sway) * 0.35;
        if (p.y > canvas.height + 20) Object.assign(p, makePetal(), { y: -20 });
        ctx.beginPath();
        ctx.fillStyle = `rgba(230,196,168,${p.opacity})`;
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.65, p.sway, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="wd-petals" aria-hidden="true" />;
}

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export default function WishesDisplayPage() {
  const [wishes, setWishes] = useState([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [status, setStatus] = useState('loading');
  const [fading, setFading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  async function loadWishes() {
    try {
      const res = await fetch('/api/wishes', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setWishes(Array.isArray(data) ? data : []);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
    }
  }

  useEffect(() => {
    loadWishes();
    const refreshTimer = setInterval(loadWishes, REFRESH_SECONDS * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (wishes.length < 2) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSpotlightIndex((i) => (i + 1) % wishes.length);
        setFading(false);
      }, 450);
    }, SPOTLIGHT_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [wishes.length]);

  useEffect(() => {
    if (spotlightIndex >= wishes.length) setSpotlightIndex(0);
  }, [wishes, spotlightIndex]);

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  const spotlight = wishes[spotlightIndex];

  // Every wish except the one currently in the spotlight — all shown on the
  // wall at once, however many there are.
  const wallWishes = wishes.filter((_, i) => i !== spotlightIndex);
  const { slots, colWidth } = generateSlots(wallWishes.length);

  return (
    <div className="wd-page">
      <div className="wd-atmosphere" aria-hidden="true">
        <Petals />
        <div className="wd-vignette" />
      </div>

      <button type="button" className="wd-fs-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
        {isFullscreen ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>

      {status === 'ok' && wallWishes.map((w, i) => {
        const slot = slots[i];
        const thumb = w.media && w.media[0];
        const maxMessageLen = colWidth >= 11 ? 65 : colWidth >= 8 ? 45 : 30;
        return (
          <div
            key={w.id}
            className="wd-note"
            style={{
              top: slot.top,
              left: slot.left,
              width: `${colWidth - 0.6}vw`,
              transform: `rotate(${slot.rotate}deg)`,
            }}
          >
            {thumb && (
              <div className="wd-note-media">
                {thumb.type === 'video' ? (
                  <video src={thumb.url} muted playsInline />
                ) : (
                  <img src={thumb.url} alt="" />
                )}
              </div>
            )}
            <p className="wd-note-message">{truncate(w.message, maxMessageLen)}</p>
            <p className="wd-note-name">{w.name.toUpperCase()}</p>
          </div>
        );
      })}

      <main className="wd-stage">
        <header className="wd-topbar">
          <p className="wd-kicker">Wedding Wishes</p>
          <h1>Chathura <span>&amp;</span> Lakmini</h1>
        </header>

        {status === 'loading' && (
          <section className="wd-loader">
            <div className="wd-ring" />
            <p>Gathering your blessings…</p>
          </section>
        )}

        {status === 'error' && (
          <section className="wd-error">
            <p>Could not load wishes.</p>
            <button type="button" className="wd-ghost-btn" onClick={loadWishes}>Try again</button>
          </section>
        )}

        {status === 'ok' && wishes.length === 0 && (
          <section className="wd-error">
            <p>No wishes yet — they&apos;ll appear here as guests share them 💌</p>
          </section>
        )}

        {status === 'ok' && spotlight && (
          <article className={`wd-spotlight ${fading ? 'fading' : ''}`}>
            <div className="wd-spotlight-divider">
              <span />
              <i>♥</i>
              <span />
            </div>
            {spotlight.media && spotlight.media[0] && (
              <div className="wd-spotlight-media">
                {spotlight.media[0].type === 'video' ? (
                  <video src={spotlight.media[0].url} autoPlay muted loop playsInline />
                ) : (
                  <img src={spotlight.media[0].url} alt="" />
                )}
              </div>
            )}
            <blockquote className="wd-spotlight-message">{spotlight.message}</blockquote>
            <p className="wd-spotlight-name">— {spotlight.name.toUpperCase()}</p>
            <div className="wd-spotlight-divider">
              <span />
              <i className="dot" />
              <span />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
