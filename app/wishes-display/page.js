'use client';

import { useEffect, useRef, useState } from 'react';
import './wishes-display.css';

export const dynamic = 'force-dynamic';

const SPOTLIGHT_SECONDS = 8;
const WALL_PAGE_SECONDS = 14;
const REFRESH_SECONDS = 12;
const MARGIN = 18; // px from the screen edge
const GAP = 12; // px between cards

// The screen is split into 5 non-overlapping zones: a big center zone
// (reserved for the title + spotlight card, never touched by border cards)
// and four bands around it — top, bottom, left, right.
function getZones(vw, vh) {
  const centerTop = vh * 0.2;
  const centerBottom = vh * 0.8;
  const centerLeft = vw * 0.22;
  const centerRight = vw * 0.78;
  return { centerTop, centerBottom, centerLeft, centerRight };
}

function getCardSize(vw, vh) {
  const width = clampNum(vw * 0.105, 128, 215);
  const height = width * 0.8;
  return { width, height };
}

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// Lays out a horizontal band (top or bottom): as many full, non-overlapping
// rows/columns as actually fit in the given rectangle — nothing is ever
// squeezed in beyond what fits.
function layoutHorizontal(bandTop, bandHeight, vw, cardW, cardH) {
  const usableW = vw - MARGIN * 2;
  const cols = Math.max(1, Math.floor((usableW + GAP) / (cardW + GAP)));
  const rows = Math.max(1, Math.floor((bandHeight + GAP) / (cardH + GAP)));
  const rowGap = rows > 1 ? (bandHeight - cardH) / (rows - 1) : 0;
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        top: bandTop + r * rowGap,
        left: MARGIN + c * (cardW + GAP),
        width: cardW,
        rotate: (c % 2 === 0 ? -1 : 1) * (2 + (r % 2)),
      });
    }
  }
  return positions;
}

// Lays out a vertical band (left or right column) the same way, but stacked
// vertically within the middle strip between the top and bottom bands.
function layoutVertical(bandLeft, bandWidth, vTop, vBottom, cardW, cardH) {
  const usableH = vBottom - vTop;
  const cols = Math.max(1, Math.floor((bandWidth + GAP) / (cardW + GAP)));
  const rows = Math.max(1, Math.floor((usableH + GAP) / (cardH + GAP)));
  const rowGap = rows > 1 ? (usableH - cardH) / (rows - 1) : 0;
  const positions = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      positions.push({
        top: vTop + r * rowGap,
        left: bandLeft + c * (cardW + GAP),
        width: cardW,
        rotate: (r % 2 === 0 ? -1 : 1) * 2,
      });
    }
  }
  return positions;
}

function buildLayout(vw, vh) {
  if (vw < 640) return [];
  const zones = getZones(vw, vh);
  const { width: cardW, height: cardH } = getCardSize(vw, vh);

  const topBandHeight = zones.centerTop - MARGIN;
  const bottomBandHeight = vh - MARGIN - zones.centerBottom;
  const leftBandWidth = zones.centerLeft - MARGIN;
  const rightBandWidth = vw - MARGIN - zones.centerRight;

  const top = layoutHorizontal(MARGIN, topBandHeight, vw, cardW, cardH);
  const bottom = layoutHorizontal(zones.centerBottom, bottomBandHeight, vw, cardW, cardH)
    .map((p) => ({ ...p, rotate: -p.rotate }));
  const left = layoutVertical(MARGIN, leftBandWidth, zones.centerTop, zones.centerBottom, cardW, cardH);
  const right = layoutVertical(zones.centerRight, rightBandWidth, zones.centerTop, zones.centerBottom, cardW, cardH)
    .map((p) => ({ ...p, rotate: -p.rotate }));

  return [...top, ...bottom, ...left, ...right];
}

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
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
        opacity: 0.18 + Math.random() * 0.3,
      };
    }
    const count = Math.max(14, Math.floor(window.innerWidth / 110));
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

export default function WishesDisplayPage() {
  const [wishes, setWishes] = useState([]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [wallPage, setWallPage] = useState(0);
  const [status, setStatus] = useState('loading');
  const [fading, setFading] = useState(false);
  const [wallFading, setWallFading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewport, setViewport] = useState({ w: 1280, h: 720 });
  const spotlightRef = useRef(null);
  const spotlightMessageRef = useRef(null);

  // ---------- viewport tracking (drives collision-free layout) ----------
  useEffect(() => {
    function measure() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ---------- data ----------
  async function loadWishes() {
    try {
      const res = await fetch('/api/wishes', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setWishes(Array.isArray(data) ? data.filter((w) => w.approved !== false) : []);
      setStatus('ok');
    } catch (e) {
      setStatus('error');
    }
  }

  useEffect(() => {
    loadWishes();
    const t = setInterval(loadWishes, REFRESH_SECONDS * 1000);
    return () => clearInterval(t);
  }, []);

  // ---------- center spotlight rotation ----------
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

  // ---------- wall page rotation (only if more wishes than fit at once) ----------
  const layout = buildLayout(viewport.w, viewport.h);
  const capacity = layout.length;
  const spotlight = wishes[spotlightIndex];
  const nonSpotlight = wishes.filter((_, i) => i !== spotlightIndex);
  const pageCount = capacity > 0 ? Math.max(1, Math.ceil(nonSpotlight.length / capacity)) : 1;

  // The spotlight card must never grow past this height, or it would start
  // covering the border cards above/below it.
  const zones = getZones(viewport.w, viewport.h);
  const spotlightMaxHeight = Math.max(220, zones.centerBottom - zones.centerTop - 24);

  useEffect(() => {
    if (!spotlight) return;
    const card = spotlightRef.current;
    const msg = spotlightMessageRef.current;
    if (!card || !msg) return;

    msg.style.fontSize = '';
    const raf = requestAnimationFrame(() => {
      let fontSize = parseFloat(getComputedStyle(msg).fontSize);
      const minFont = 13;
      let guard = 0;
      while (card.scrollHeight > spotlightMaxHeight && fontSize > minFont && guard < 30) {
        fontSize -= 1;
        msg.style.fontSize = `${fontSize}px`;
        guard += 1;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [spotlight, spotlightMaxHeight]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const timer = setInterval(() => {
      setWallFading(true);
      setTimeout(() => {
        setWallPage((p) => (p + 1) % pageCount);
        setWallFading(false);
      }, 400);
    }, WALL_PAGE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [pageCount]);

  useEffect(() => {
    if (wallPage >= pageCount) setWallPage(0);
  }, [pageCount, wallPage]);

  const safePage = wallPage % pageCount;
  const wallWishes = nonSpotlight.slice(safePage * capacity, safePage * capacity + capacity);

  // ---------- fullscreen ----------
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
        const pos = layout[i];
        if (!pos) return null;
        const thumb = w.media && w.media[0];
        const maxLen = pos.width >= 180 ? 90 : pos.width >= 150 ? 65 : 45;
        return (
          <div
            key={w.id}
            className={`wd-note ${wallFading ? 'fading' : ''}`}
            style={{
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: `${pos.width}px`,
              transform: `rotate(${pos.rotate}deg)`,
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
            <p className="wd-note-message">{truncate(w.message, maxLen)}</p>
            <p className="wd-note-name">{(w.name || '').toUpperCase()}</p>
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
          <article ref={spotlightRef} className={`wd-spotlight ${fading ? 'fading' : ''}`} style={{ maxHeight: `${spotlightMaxHeight}px` }}>
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
            <blockquote ref={spotlightMessageRef} className="wd-spotlight-message">{spotlight.message}</blockquote>
            <p className="wd-spotlight-name">— {(spotlight.name || '').toUpperCase()}</p>
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
