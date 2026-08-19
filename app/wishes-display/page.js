'use client';

import { useEffect, useRef, useState } from 'react';
import './wishes-display.css';

export const dynamic = 'force-dynamic';

const POLL_MS = 20000;
const LOOP_DURATION_MS = 8 * 60 * 1000; // 8 minutes per full clockwise loop
const MARGIN = 16; // px, distance of the conveyor path from the screen edge

function normalize(f) {
  let x = f % 1;
  if (x < 0) x += 1;
  return x;
}

function clampNum(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeBorderCapacity(vw, vh) {
  if (vw < 640) return 0;
  const cardW = clampNum(vw * 0.105, 120, 205);
  const cardH = cardW * 0.82;
  const perimeter = 2 * (vw - MARGIN * 2 + vh - MARGIN * 2);
  const minGap = Math.max(cardW, cardH) * 1.3;
  return clampNum(Math.floor(perimeter / minGap), 6, 22);
}

// Maps a 0..1 fraction of the loop to an (x, y) point walking clockwise
// around the screen perimeter, starting at the top-left corner: right along
// the top, down the right side, left along the bottom, up the left side.
function pointOnPerimeter(fraction, vw, vh) {
  const usableW = vw - MARGIN * 2;
  const usableH = vh - MARGIN * 2;
  const perimeter = 2 * (usableW + usableH);
  const dist = normalize(fraction) * perimeter;

  if (dist < usableW) {
    return { x: MARGIN + dist, y: MARGIN };
  }
  if (dist < usableW + usableH) {
    return { x: MARGIN + usableW, y: MARGIN + (dist - usableW) };
  }
  if (dist < usableW * 2 + usableH) {
    return { x: MARGIN + usableW - (dist - usableW - usableH), y: MARGIN + usableH };
  }
  return { x: MARGIN, y: MARGIN + usableH - (dist - usableW * 2 - usableH) };
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
        ctx.fillStyle = `rgba(240,193,92,${p.opacity})`;
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
  const [status, setStatus] = useState('loading');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fading, setFading] = useState(false);
  const [currentWish, setCurrentWish] = useState(null);
  const [borderIds, setBorderIds] = useState([]); // which wish ids currently have a DOM card

  // ---------- refs (mutable, don't need re-render on change) ----------
  const wishesRef = useRef([]);           // full id -> wish map lookup array
  const knownIdsRef = useRef(new Set());
  const playOrderRef = useRef([]);
  const playIndexRef = useRef(0);
  const advanceTimerRef = useRef(null);

  const borderMetaRef = useRef(new Map()); // id -> { baseOffset }
  const borderNodesRef = useRef(new Map()); // id -> DOM element
  const borderCapacityRef = useRef(16);
  const globalOffsetRef = useRef(0);
  const lastFrameRef = useRef(0);
  const rafRef = useRef(null);
  const viewportRef = useRef({ w: 1280, h: 720 });

  const spotlightRef = useRef(null);
  const spotlightMessageRef = useRef(null);

  function getWishById(id) {
    return wishesRef.current.find((w) => w.id === id) || null;
  }

  // ---------- data fetching ----------
  async function loadWishes() {
    try {
      const res = await fetch('/api/wishes', { cache: 'no-store' });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const approved = (Array.isArray(data) ? data : []).filter((w) => w.approved !== false);
      handleNewData(approved);
    } catch (e) {
      if (wishesRef.current.length === 0) setStatus('error');
    }
  }

  function handleNewData(list) {
    const incomingIds = new Set(list.map((w) => w.id));
    const brandNew = [];
    list.forEach((w) => {
      if (!knownIdsRef.current.has(w.id)) {
        knownIdsRef.current.add(w.id);
        brandNew.push(w);
      }
    });

    wishesRef.current = list;
    playOrderRef.current = playOrderRef.current.filter((id) => incomingIds.has(id));
    borderMetaRef.current.forEach((_, id) => {
      if (!incomingIds.has(id)) borderMetaRef.current.delete(id);
    });

    if (list.length === 0) {
      setStatus('empty');
      return;
    }

    if (playOrderRef.current.length === 0) {
      // First load: shuffle the play order and seed the border evenly.
      playOrderRef.current = shuffle(list.map((w) => w.id));
      const seedCount = Math.min(borderCapacityRef.current, list.length);
      const seedIds = list.slice(0, seedCount).map((w) => w.id);
      seedIds.forEach((id, i) => {
        borderMetaRef.current.set(id, {
          baseOffset: normalize(i / seedIds.length - globalOffsetRef.current),
        });
      });
      setBorderIds(seedIds);
      setStatus('ok');
      startSlideshow();
    } else {
      brandNew.forEach((w) => {
        const insertAt = playIndexRef.current + 1 +
          Math.floor(Math.random() * Math.max(1, playOrderRef.current.length - playIndexRef.current));
        playOrderRef.current.splice(Math.min(insertAt, playOrderRef.current.length), 0, w.id);
        addToBorderFront(w.id);
      });
      if (brandNew.length > 0) {
        setBorderIds(Array.from(borderMetaRef.current.keys()));
      }
    }
  }

  function addToBorderFront(id) {
    const ordered = Array.from(borderMetaRef.current.entries());
    const keep = ordered.slice(Math.max(0, ordered.length - (borderCapacityRef.current - 1)));
    borderMetaRef.current = new Map();
    borderMetaRef.current.set(id, { baseOffset: normalize(0 - globalOffsetRef.current) });
    keep.forEach(([oid, meta]) => {
      borderMetaRef.current.set(oid, meta);
    });
  }

  // ---------- center slideshow ----------
  function startSlideshow() {
    if (playOrderRef.current.length === 0) return;
    playIndexRef.current = 0;
    showWish(playOrderRef.current[0]);
  }

  function showWish(id) {
    const wish = getWishById(id);
    if (!wish) return;
    setFading(true);
    setTimeout(() => {
      setCurrentWish(wish);
      setFading(false);
      scheduleAdvance(wish);
    }, 260);
  }

  function scheduleAdvance(wish) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const len = (wish.message || '').length;
    const duration = Math.min(16000, Math.max(6000, 6000 + len * 45));
    advanceTimerRef.current = setTimeout(advanceSlideshow, duration);
  }

  function advanceSlideshow() {
    if (playOrderRef.current.length === 0) return;
    playIndexRef.current = (playIndexRef.current + 1) % playOrderRef.current.length;
    showWish(playOrderRef.current[playIndexRef.current]);
  }

  function featureWishById(id) {
    const idx = playOrderRef.current.indexOf(id);
    if (idx !== -1) playIndexRef.current = idx;
    showWish(id);
  }

  // ---------- text auto-fit (no scrollbar, ever) ----------
  useEffect(() => {
    if (!currentWish) return;
    const clip = spotlightRef.current;
    const msg = spotlightMessageRef.current;
    if (!clip || !msg) return;

    msg.style.fontSize = '';
    msg.style.animation = 'none';
    msg.style.transform = 'translateY(0)';

    const raf = requestAnimationFrame(() => {
      let fontSize = parseFloat(getComputedStyle(msg).fontSize);
      const minFont = 14;
      let guard = 0;
      while (msg.scrollHeight > clip.clientHeight && fontSize > minFont && guard < 30) {
        fontSize -= 1;
        msg.style.fontSize = `${fontSize}px`;
        guard += 1;
      }
      if (msg.scrollHeight > clip.clientHeight) {
        const overflow = msg.scrollHeight - clip.clientHeight;
        const duration = Math.max(6, overflow / 18);
        msg.style.setProperty('--wd-scroll-distance', `-${overflow}px`);
        msg.style.animation = `wd-autoscroll ${duration}s ease-in-out 1.2s infinite alternate`;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [currentWish]);

  // ---------- fetching + polling ----------
  useEffect(() => {
    loadWishes();
    const t = setInterval(loadWishes, POLL_MS);
    return () => {
      clearInterval(t);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // ---------- viewport + capacity ----------
  useEffect(() => {
    function measure() {
      viewportRef.current = { w: window.innerWidth, h: window.innerHeight };
      const newCap = computeBorderCapacity(viewportRef.current.w, viewportRef.current.h);
      borderCapacityRef.current = newCap;
      if (borderMetaRef.current.size > newCap) {
        const trimmed = Array.from(borderMetaRef.current.entries()).slice(0, newCap);
        borderMetaRef.current = new Map(trimmed);
        setBorderIds(trimmed.map(([id]) => id));
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ---------- conveyor animation loop ----------
  useEffect(() => {
    lastFrameRef.current = performance.now();
    function tick(now) {
      const dt = now - lastFrameRef.current;
      lastFrameRef.current = now;
      globalOffsetRef.current = normalize(globalOffsetRef.current + dt / LOOP_DURATION_MS);

      borderMetaRef.current.forEach((meta, id) => {
        const node = borderNodesRef.current.get(id);
        if (!node) return;
        const fraction = normalize(meta.baseOffset + globalOffsetRef.current);
        const pt = pointOnPerimeter(fraction, viewportRef.current.w, viewportRef.current.h);
        node.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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

      <div className="wd-border-layer" aria-hidden="false">
        {borderIds.map((id) => {
          const w = getWishById(id);
          if (!w) return null;
          const thumb = w.media && w.media[0];
          const isFeatured = currentWish && currentWish.id === id;
          return (
            <div
              key={id}
              ref={(node) => {
                if (node) borderNodesRef.current.set(id, node);
                else borderNodesRef.current.delete(id);
              }}
              className={`wd-note ${isFeatured ? 'featured' : ''}`}
              onClick={() => featureWishById(id)}
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
              <p className="wd-note-message">{truncate(w.message, 85)}</p>
              <p className="wd-note-name">{(w.name || '').toUpperCase()}</p>
            </div>
          );
        })}
      </div>

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

        {status === 'empty' && (
          <section className="wd-error">
            <p>No wishes yet — they&apos;ll appear here as guests share them 💌</p>
          </section>
        )}

        {status === 'ok' && currentWish && (
          <article className={`wd-spotlight-outer ${fading ? 'fading' : ''}`}>
            <div className="wd-spotlight-divider">
              <span />
              <i>♥</i>
              <span />
            </div>
            {currentWish.media && currentWish.media[0] && (
              <div className="wd-spotlight-media">
                {currentWish.media[0].type === 'video' ? (
                  <video src={currentWish.media[0].url} autoPlay muted loop playsInline />
                ) : (
                  <img src={currentWish.media[0].url} alt="" />
                )}
              </div>
            )}
            <div ref={spotlightRef} className="wd-spotlight-clip">
              <blockquote ref={spotlightMessageRef} className="wd-spotlight-message">{currentWish.message}</blockquote>
            </div>
            <p className="wd-spotlight-name">— {(currentWish.name || '').toUpperCase()}</p>
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
