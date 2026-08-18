'use client';

import { useEffect, useRef, useState } from 'react';
import './wishes-display.css';

export const dynamic = 'force-dynamic';

const CYCLE_SECONDS = 9;
const REFRESH_SECONDS = 30;

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
        speed: 0.4 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 0.6,
        sway: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.4,
      };
    }
    const count = Math.max(18, Math.floor(window.innerWidth / 90));
    petals = Array.from({ length: count }, makePetal);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.y += p.speed;
        p.sway += 0.01;
        p.x += p.drift + Math.sin(p.sway) * 0.4;
        if (p.y > canvas.height + 20) Object.assign(p, makePetal(), { y: -20 });
        ctx.beginPath();
        ctx.fillStyle = `rgba(231,189,106,${p.opacity})`;
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, p.sway, 0, Math.PI * 2);
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

export default function WishesDisplayPage() {
  const [wishes, setWishes] = useState([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fading, setFading] = useState(false);

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
    const cycleTimer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % wishes.length);
        setFading(false);
      }, 500);
    }, CYCLE_SECONDS * 1000);
    return () => clearInterval(cycleTimer);
  }, [wishes.length]);

  useEffect(() => {
    if (index >= wishes.length) setIndex(0);
  }, [wishes, index]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
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

  const current = wishes[index];
  const media = current?.media?.[0];

  return (
    <div className="wd-page">
      <div className="wd-atmosphere" aria-hidden="true">
        <Petals />
        <div className="wd-glow wd-glow-a" />
        <div className="wd-glow wd-glow-b" />
        <div className="wd-vignette" />
      </div>

      <button type="button" className="wd-fs-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
        {isFullscreen ? (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>

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

        {status === 'ok' && current && (
          <article className={`wd-wish ${fading ? 'fading' : ''}`}>
            <div className="wd-ornament wd-ornament-top">
              <span />
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-4.4-9.3-8.2C.7 9.4 2.4 5 6.2 5c2 0 3.4 1.1 4.3 2.4C11.4 6.1 12.8 5 14.8 5c3.8 0 5.5 4.4 3.5 7.8C19 16.6 12 21 12 21z" /></svg>
              <span />
            </div>

            {media && (
              <div className="wd-media">
                {media.type === 'video' ? (
                  <video src={media.url} autoPlay muted loop playsInline />
                ) : (
                  <img src={media.url} alt="" />
                )}
              </div>
            )}

            <blockquote className="wd-message">{current.message}</blockquote>
            <p className="wd-name">— {current.name}</p>

            <div className="wd-ornament wd-ornament-bottom">
              <span />
              <i />
              <span />
            </div>
          </article>
        )}

        {status === 'ok' && wishes.length > 1 && (
          <div className="wd-dots">
            {wishes.map((_, i) => (
              <span key={i} className={`wd-dot ${i === index ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
