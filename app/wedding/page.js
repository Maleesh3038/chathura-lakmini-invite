'use client';

import { useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

// Fallback data — shown until /api/schedule and /api/settings load, or if tables are empty.
const DEFAULT_EVENTS = [
  { en: 'Invitation to the Auspicious Ceremony', date: '2026-07-23T10:52:00', direction: 'East' },
  { en: 'Traditional Oil Stove Ceremony', date: '2026-09-11T09:32:00', direction: 'North' },
  { en: 'Traditional Dining Table Ritual', date: '2026-09-13T11:52:00', direction: 'South' },
  { en: 'Groom Leaves the House', date: '2026-09-15T17:26:00', direction: 'North' },
  { en: 'Bride Leaves the House', date: '2026-09-15T23:47:00', direction: 'North' },
  { en: 'Wearing the Forehead Bandage', date: '2026-09-16T04:02:00', direction: 'North' },
  { en: 'Bride Arrives at the Reception Hall', date: null },
  { en: 'Groom Arrives at the Reception Hall', date: null },
  { en: 'Marriage Registration', date: '2026-09-16T09:02:00', direction: 'North' },
  { en: 'Poruwa Ceremony — Start', date: '2026-09-16T09:24:00', direction: 'North' },
  { en: 'Poruwa Ceremony — End', date: '2026-09-16T09:58:00', direction: 'North' },
  { en: "Couple's First Meal Together", date: '2026-09-16T11:52:00', direction: 'North' },
  { en: 'Departure from the Reception Hall', date: '2026-09-16T15:27:00', direction: 'North', note: 'Alt. times: 3:42 PM / 4:07 PM' },
  { en: 'Couple Arrives Home — Second Day', date: '2026-09-19T18:22:00', direction: 'North' },
];

const DEFAULT_SETTINGS = {
  groomName: 'Chathura',
  brideName: 'Lakmini',
  taglineEn: 'Two families, one auspicious hour, a lifetime that begins on the poruwa.',
  heroDate1Label: 'Poruwa Ceremony',
  heroDate1Value: 'September 16, 2026 · 9:24 AM',
  heroDate2Label: 'Homecoming',
  heroDate2Value: 'September 19, 2026',
  countdownTarget: '2026-09-16',
  ceremonyTime: '9:24 AM Onwards',
  thankYouTitle: 'To Our Wonderful Guests',
  thankYouMessage: 'From the bottom of our hearts, thank you for being part of our story. Your love, laughter, and support mean the world to us as we begin this new chapter together.',
  venueName: 'Asliya Golden Cassandra',
  venueHallName: 'Lotus Ballroom',
  venueAddress: 'Atupitiya Road, Dambokka',
  venueMapUrl: 'https://www.google.com/maps/place/Asliya+Golden+Cassandra/@7.4339716,80.3397686,1127m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3ae33ba4acb686e9:0x4133679c8fdf897c!8m2!3d7.4339663!4d80.3423435!16s%2Fg%2F11tp4l0xrq?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D',
  venueLat: '7.4339663',
  venueLng: '80.3423435',
  songUrl: null,
  themeGold: '#b8863f',
  themeGoldBright: '#a2701f',
  themeGoldGlow: '#e7bd6a',
  themeRose: '#b9695f',
  themeBgDeep: '#faf4e9',
  themeInk: '#3d2f22',
  themeHeadingFont: 'Cormorant Garamond',
  themeBodyFont: 'Poppins',
};

const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30MB

function two(n) {
  return String(n).padStart(2, '0');
}

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtWishDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ---------- Scroll-reveal + count-up hooks ----------

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) {
      setValue(0);
      return;
    }
    let start = null;
    let raf;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView(0.12);
  return (
    <div ref={ref} className={`reveal ${inView ? 'in-view' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function LampIcon() {
  return (
    <svg viewBox="0 0 150 190" width="150" height="190">
      <ellipse cx="75" cy="182" rx="46" ry="6" fill="#000" opacity="0.12" />
      <rect x="70" y="150" width="10" height="26" fill="#b8863f" />
      <path d="M40 150 Q75 172 110 150 Q108 158 75 168 Q42 158 40 150 Z" fill="#c9a24b" />
      <path d="M30 120 Q75 148 120 120 Q120 132 75 156 Q30 132 30 120 Z" fill="#b8863f" />
      <path d="M46 96 Q75 112 104 96 L104 122 Q75 138 46 122 Z" fill="#c9a24b" />
      <ellipse cx="75" cy="96" rx="29" ry="9" fill="#e7bd6a" />
      <ellipse cx="75" cy="96" rx="29" ry="9" fill="none" stroke="#a2701f" strokeWidth="1.5" />
      <path d="M62 92 Q75 100 88 92" stroke="#a2701f" strokeWidth="1.2" fill="none" />
      <g className="flame">
        <path d="M75 46 C 66 62, 62 74, 75 86 C 88 74, 84 62, 75 46 Z" fill="#e7bd6a" />
        <path d="M75 58 C 70 68, 69 76, 75 84 C 81 76, 80 68, 75 58 Z" fill="#fff2c8" />
      </g>
      <rect x="73" y="86" width="4" height="8" fill="#a2701f" />
    </svg>
  );
}

function AppleLogoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M12.7 5.3c-.5.6-1.3 1-2.1.9-.1-.8.3-1.7.8-2.3.5-.6 1.4-1 2.1-1 .1.9-.2 1.7-.8 2.4z" />
      <path d="M16.7 8.9c-1.2-1.4-3-1.5-3.6-1.5-.7 0-2 .5-2.9.5-.9 0-1.9-.5-3.1-.5-1.6 0-4.1 1.3-4.1 5 0 3.3 2.4 7.5 4.2 7.5.9 0 1.3-.6 2.5-.6 1.2 0 1.5.6 2.5.6 1.8 0 3.3-2.9 4-4.5-2.2-1-2.5-3.9 0-5.5z" />
    </svg>
  );
}

function NavIconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5M16 3v3.5" />
      <circle cx="8.2" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function NavIconEnvelope() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M4 7l8 6.2L20 7" />
    </svg>
  );
}

function NavIconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M20 20l-4.6-4.6" />
    </svg>
  );
}

function NavIconPin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.5s7-7.1 7-12.3A7 7 0 0 0 5 9.2c0 5.2 7 12.3 7 12.3z" />
      <circle cx="12" cy="9.2" r="2.4" />
    </svg>
  );
}

function NavIconFlower() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <path d="M12 9.4c-1.8 0-3.2-1.5-3.2-3.2S10.2 3 12 3s3.2 1.5 3.2 3.2S13.8 9.4 12 9.4z" />
      <path d="M12 14.6c1.8 0 3.2 1.5 3.2 3.2S13.8 21 12 21s-3.2-1.5-3.2-3.2 1.4-3.2 3.2-3.2z" />
      <path d="M9.4 12c0 1.8-1.5 3.2-3.2 3.2S3 13.8 3 12s1.5-3.2 3.2-3.2S9.4 10.2 9.4 12z" />
      <path d="M14.6 12c0-1.8 1.5-3.2 3.2-3.2S21 10.2 21 12s-1.5 3.2-3.2 3.2-3.2-1.4-3.2-3.2z" />
    </svg>
  );
}

function CornerFlourish({ flip }) {
  return (
    <svg viewBox="0 0 60 60" width="34" height="34" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M2 2 C 20 2, 22 20, 40 20 C 22 20, 20 38, 20 58" fill="none" stroke="#b8863f" strokeWidth="1.2" opacity="0.6" />
      <circle cx="40" cy="20" r="2.2" fill="#e7bd6a" />
      <circle cx="20" cy="58" r="1.6" fill="#e7bd6a" opacity="0.7" />
    </svg>
  );
}

function FallingPetals() {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const count = 16;
    const arr = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 9,
      duration: 11 + Math.random() * 9,
      delay: Math.random() * 16,
      drift: Math.round((Math.random() - 0.5) * 90),
      rotate: Math.round(Math.random() * 360),
    }));
    setPetals(arr);
  }, []);

  return (
    <div className="petals-overlay" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.82,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
            '--rot': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

function GuestGreeting({ name, leaving }) {
  return (
    <div className={`guest-greeting ${leaving ? 'leaving' : ''}`}>
      <div className="gg-circle gg-circle-top">
        <span className="gg-flower">🌸</span>
      </div>
      <div className="gg-text">
        Dear <span className="gg-name">{name}</span>,
      </div>
      <div className="gg-divider" />
      <div className="gg-sub">You&apos;re Invited</div>
      <div className="gg-circle gg-circle-bottom" />
    </div>
  );
}

function IntroScreen({ onEnter, leaving, settings }) {
  const groomInitial = (settings.groomName || 'C')[0];
  const brideInitial = (settings.brideName || 'L')[0];
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function handleCtaClick() {
    if (playing) return;
    const video = videoRef.current;
    if (video) {
      setPlaying(true);
      const finish = () => onEnter();
      video.addEventListener('ended', finish, { once: true });
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay/play blocked or video unavailable — just proceed.
        video.removeEventListener('ended', finish);
        onEnter();
      });
    } else {
      onEnter();
    }
  }

  return (
    <div className={`intro-overlay ${leaving ? 'leaving' : ''}`}>
      <div className="intro-card">
        <div className="intro-bg-illustration" aria-hidden="true">
          <video
            ref={videoRef}
            src="/videos/eternal-bloom-cover.mp4"
            muted
            playsInline
            preload="auto"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
        <div className="intro-content">
          <div className="intro-corner tl"><CornerFlourish /></div>
          <div className="intro-corner tr"><CornerFlourish flip /></div>

          <div className="intro-monogram">
            {groomInitial}<span className="monogram-amp">&amp;</span>{brideInitial}
          </div>

          <span className="intro-badge">● Wedding Invitation</span>

          <h1 className="intro-names">
            {settings.groomName}
            <span className="intro-amp">&amp;</span>
            {settings.brideName}
          </h1>

          <div className="intro-divider" />

          <p className="intro-tagline">{settings.taglineEn}</p>

          <button className="intro-cta" onClick={handleCtaClick} disabled={playing}>
            You&apos;re Invited <span aria-hidden="true">→</span>
          </button>

          <p className="intro-hint">
            {playing ? '✨ Opening your invitation...' : settings.songUrl ? '🔊 Tap to begin — with music' : 'Tap to begin'}
          </p>

          <div className="intro-corner bl"><CornerFlourish flip /></div>
          <div className="intro-corner br"><CornerFlourish /></div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev, idx, now }) {
  const isDone = ev.date ? new Date(ev.date).getTime() - now <= 0 : false;

  let body;
  if (!ev.date) {
    body = <span className="tbd">Time to be announced</span>;
  } else if (isDone) {
    body = <span className="done-tag">Completed</span>;
  } else {
    const diff = new Date(ev.date).getTime() - now;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    body = (
      <div className="mini-cd">
        <div className="mini-box"><span className="mini-num">{two(d)}</span><span className="mini-lab">Days</span></div>
        <div className="mini-box"><span className="mini-num">{two(h)}</span><span className="mini-lab">Hrs</span></div>
        <div className="mini-box"><span className="mini-num">{two(m)}</span><span className="mini-lab">Min</span></div>
        <div className="mini-box"><span className="mini-num">{two(s)}</span><span className="mini-lab">Sec</span></div>
      </div>
    );
  }

  return (
    <Reveal delay={Math.min(idx, 8) * 50} className={`event-card ${isDone ? 'done' : ''}`}>
      <div className="event-index">{two(idx + 1)}</div>
      <div className="event-body">
        <div className="event-corner"><CornerFlourish flip /></div>
        <h3 className="ev-title-en">{ev.en}</h3>
        <div className="ev-row">
          <div className="ev-meta">
            {ev.date && <span>🕐 {fmtDate(ev.date)}</span>}
            {ev.direction && <span>⌖ {ev.direction}</span>}
          </div>
          {body}
        </div>
        {ev.note && <p className="note-line">{ev.note}</p>}
      </div>
    </Reveal>
  );
}

// ---------- Media upload helpers ----------

function resizeImageToBlob(file, maxWidth = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not process image'));
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadMediaFile(file) {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  if (!isVideo && !isImage) throw new Error('Unsupported file type');

  let toUpload = file;
  let ext = 'jpg';
  let contentType = 'image/jpeg';

  if (isImage) {
    toUpload = await resizeImageToBlob(file);
  } else {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error('Video is too large (max 30MB).');
    }
    ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    contentType = file.type;
  }

  const fileName = `wish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage.from('wish-photos').upload(fileName, toUpload, { contentType });
  if (error) throw error;

  const { data } = supabaseClient.storage.from('wish-photos').getPublicUrl(fileName);
  return { url: data.publicUrl, type: isVideo ? 'video' : 'image' };
}

// ---------- Lightbox ----------

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const touchStartX = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  if (index === null || !items || !items[index]) return null;
  const item = items[index];

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) onPrev();
      else onNext();
    }
    touchStartX.current = null;
  }

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
      {items.length > 1 && (
        <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">‹</button>
      )}
      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay className="lightbox-media" />
        ) : (
          <img src={item.url} alt="" className="lightbox-media" />
        )}
        {items.length > 1 && (
          <div className="lightbox-counter">{index + 1} / {items.length}</div>
        )}
      </div>
      {items.length > 1 && (
        <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next">›</button>
      )}
    </div>
  );
}

function MediaThumb({ item, onClick }) {
  return (
    <button type="button" className="media-thumb" onClick={onClick}>
      {item.type === 'video' ? (
        <>
          <video src={item.url} muted playsInline />
          <span className="media-play-icon">▶</span>
        </>
      ) : (
        <img src={item.url} alt="" />
      )}
    </button>
  );
}

function WishCard({ wish, index, onOpenMedia, allMedia, mediaOffset }) {
  const [ref, inView] = useInView(0.08);
  const media = wish.media || [];
  return (
    <div
      ref={ref}
      className={`wish-card reveal ${inView ? 'in-view' : ''}`}
      style={{ transitionDelay: `${Math.min(index, 10) * 60}ms` }}
    >
      {media.length > 0 && (
        <div className={`wish-media-grid ${media.length === 1 ? 'single' : ''}`}>
          {media.slice(0, 4).map((m, i) => (
            <div key={i} className={`wish-media-cell ${media.length === 1 ? 'single-cell' : ''}`}>
              <MediaThumb item={m} onClick={() => onOpenMedia(allMedia, mediaOffset + i)} />
              {i === 3 && media.length > 4 && (
                <button type="button" className="media-more" onClick={() => onOpenMedia(allMedia, mediaOffset + 3)}>
                  +{media.length - 4}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="wish-quote-mark">&ldquo;</div>
      <p className="wish-message">{wish.message}</p>
      <div className="wish-foot">
        <span className="wish-name">{wish.name}</span>
        <span className="wish-date">{fmtWishDate(wish.submittedAt)}</span>
      </div>
    </div>
  );
}

function WishesWall() {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', message: '' });
  const [mediaItems, setMediaItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [status, setStatus] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [lightbox, setLightbox] = useState({ items: null, index: null });

  const wishCount = useCountUp(wishes.length);

  async function loadWishes() {
    try {
      const res = await fetch('/api/wishes');
      const json = await res.json();
      setWishes(json);
    } catch (e) {
      // ignore — wall just stays empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishes();
  }, []);

  async function processFiles(files) {
    if (!files.length) return;
    setUploadError('');
    setUploading(true);
    for (const file of files) {
      try {
        const result = await uploadMediaFile(file);
        setMediaItems((prev) => [...prev, result]);
      } catch (err) {
        setUploadError(err.message || 'Upload failed.');
      }
    }
    setUploading(false);
  }

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    processFiles(files);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  }
  function handleDragOver(e) {
    e.preventDefault();
    setDragActive(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    setDragActive(false);
  }

  function removeMediaItem(idx) {
    setMediaItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function openLightbox(items, index) {
    setLightbox({ items, index });
  }
  function closeLightbox() {
    setLightbox({ items: null, index: null });
  }
  function prevLightbox() {
    setLightbox((prev) => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }));
  }
  function nextLightbox() {
    setLightbox((prev) => ({ ...prev, index: (prev.index + 1) % prev.items.length }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          message: form.message,
          media: mediaItems,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
      setForm({ name: '', message: '' });
      setMediaItems([]);
      loadWishes();
    } catch (err) {
      setStatus('err');
    }
  }

  return (
    <section id="wishes">
      <div className="sec-head">
        <div className="sec-eyebrow">From Our Loved Ones</div>
        <h2 className="sec-title-en">Guest Wishes</h2>
        <p className="sec-sub">Share a note, a photo, or a short video for the couple.</p>
        {!loading && wishes.length > 0 && (
          <div className="wish-count-badge">
            <span className="wish-count-dot" />
            {wishCount} {wishCount === 1 ? 'wish' : 'wishes'} and counting
          </div>
        )}
      </div>

      <Reveal className="wish-card-form" delay={0}>
        <form onSubmit={handleSubmit}>
          <div className="wish-field">
            <label className="wish-field-label" htmlFor="w-name">👤 Your Name</label>
            <input
              id="w-name"
              type="text"
              required
              placeholder="e.g. Nimal Perera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="wish-field">
            <label className="wish-field-label" htmlFor="w-msg">💬 Your Wish</label>
            <textarea
              id="w-msg"
              required
              placeholder="Write your wish for the couple..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="wish-field">
            <label className="wish-field-label" htmlFor="w-media">🎁 Photos / Videos <span>(optional)</span></label>

            {mediaItems.length > 0 && (
              <div className="media-preview-grid">
                {mediaItems.map((m, i) => (
                  <div key={i} className="media-preview-item">
                    {m.type === 'video' ? <video src={m.url} muted playsInline /> : <img src={m.url} alt="" />}
                    <button type="button" className="media-preview-remove" onClick={() => removeMediaItem(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <label
              className={`photo-drop-modern ${dragActive ? 'drag-active' : ''}`}
              htmlFor="w-media"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <span className="photo-drop-icon">{uploading ? '⏳' : '📷'}</span>
              <span className="photo-drop-text">{uploading ? 'Uploading...' : dragActive ? 'Drop to upload' : 'Choose or drop files'}</span>
              <span className="photo-drop-subtext">Photos &amp; short videos welcome</span>
            </label>
            <input
              id="w-media"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFilesSelected}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            {uploadError && <p className="form-msg err">{uploadError}</p>}
          </div>
          <button type="submit" className="btn-pill btn-glow" disabled={uploading}>Post Your Wish ✨</button>
          <p className="wish-privacy-note">Your wish will be reviewed and then shown publicly on this page for all guests to see.</p>
          {status === 'sending' && <div className="form-msg">Posting...</div>}
          {status === 'ok' && <div className="form-msg ok">Thank you! Your wish will appear once reviewed.</div>}
          {status === 'err' && <div className="form-msg err">Something went wrong. Please try again.</div>}
        </form>
      </Reveal>

      {loading ? (
        <p className="empty-note">Loading wishes...</p>
      ) : wishes.length === 0 ? (
        <p className="empty-note">No wishes yet — be the first to leave one!</p>
      ) : (
        <div className="wish-grid">
          {(() => {
            const allMedia = wishes.flatMap((w) => w.media || []);
            let runningOffset = 0;
            return wishes.map((w, i) => {
              const mediaOffset = runningOffset;
              runningOffset += (w.media || []).length;
              return (
                <WishCard
                  key={w.id}
                  wish={w}
                  index={i}
                  onOpenMedia={openLightbox}
                  allMedia={allMedia}
                  mediaOffset={mediaOffset}
                />
              );
            });
          })()}
        </div>
      )}

      <Lightbox items={lightbox.items} index={lightbox.index} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
    </section>
  );
}

function LocationSection({ settings }) {
  const embedSrc = settings.venueLat && settings.venueLng
    ? `https://www.google.com/maps?q=${settings.venueLat},${settings.venueLng}&z=15&output=embed`
    : null;

  return (
    <section id="location">
      <div className="sec-head">
        <div className="sec-eyebrow">Find Us Here</div>
        <h2 className="sec-title-en">Venue</h2>
      </div>

      <Reveal className="venue-card">
        <div className="venue-info">
          <div className="venue-pin"><NavIconPin /></div>
          <div>
            {settings.venueHallName && <p className="venue-hall">{settings.venueHallName}</p>}
            <h3 className="venue-name">{settings.venueName}</h3>
            <p className="venue-address">{settings.venueAddress}</p>
          </div>
        </div>

        {embedSrc && (
          <div className="venue-map-wrap">
            <iframe
              src={embedSrc}
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Venue location"
            />
          </div>
        )}

        {settings.venueMapUrl && (
          <a className="btn-pill venue-cta" href={settings.venueMapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        )}
      </Reveal>
    </section>
  );
}

function toICSDate(dateObj) {
  return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getEventTimes(settings) {
  const raw = settings.countdownTarget || '';
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T09:00:00` : raw;
  const start = new Date(`${withTime}+05:30`);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  return { start, end };
}

function buildGoogleCalendarUrl(settings) {
  const { start, end } = getEventTimes(settings);
  const dates = `${toICSDate(start)}/${toICSDate(end)}`;
  const text = encodeURIComponent(`${settings.groomName} & ${settings.brideName}'s Wedding`);
  const details = encodeURIComponent(settings.taglineEn || '');
  const location = encodeURIComponent(`${settings.venueName}, ${settings.venueAddress}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

function buildICS(settings) {
  const { start, end } = getEventTimes(settings);
  const uid = `wedding-${Date.now()}@inviteglow`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${settings.groomName} & ${settings.brideName}'s Wedding`,
    `DESCRIPTION:${(settings.taglineEn || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${settings.venueName}, ${settings.venueAddress}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function downloadICS(settings) {
  const ics = buildICS(settings);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // iOS Safari doesn't reliably honor the `download` attribute for .ics files —
  // it needs a direct navigation so it can offer the "Add to Calendar" sheet.
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    window.location.href = url;
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-invite.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function TableLookupSection() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  async function fetchMatches(q, suggest) {
    try {
      const res = await fetch('/api/rsvp/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, suggest }),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.results || [];
    } catch (err) {
      return [];
    }
  }

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setStatus('idle');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = val.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const matches = await fetchMatches(trimmed, true);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 220);
  }

  function pickSuggestion(match) {
    setQuery(match.name);
    setShowSuggestions(false);
    setResults([match]);
    setStatus('done');
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    setStatus('loading');
    const matches = await fetchMatches(query.trim(), false);
    setResults(matches);
    setStatus('done');
  }

  return (
    <section id="find-table">
      <div className="sec-head">
        <div className="sec-eyebrow">Seating</div>
        <h2 className="sec-title-en">Find Your Table</h2>
        <p className="sec-sub">Start typing your name or phone number — matching guests will appear as suggestions.</p>
      </div>

      <Reveal className="rsvp-card">
        <form onSubmit={handleSearch} autoComplete="off">
          <div className="field" style={{ position: 'relative' }}>
            <label htmlFor="t-query">Name or Phone Number</label>
            <input
              id="t-query"
              type="text"
              required
              placeholder="e.g. Nimal Perera or 0771234567"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && (
              <div className="table-suggestions">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="table-suggestion-item"
                    onMouseDown={() => pickSuggestion(s)}
                  >
                    <span className="table-suggestion-info">
                      <span className="table-suggestion-name">{s.name}</span>
                      {s.phone && <span className="table-suggestion-phone">{s.phone}</span>}
                    </span>
                    {s.tableNumber && <span className="table-suggestion-num">Table {s.tableNumber}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-glow" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>

          {status === 'done' && results.length === 0 && (
            <div className="form-msg err">No matching guest found. Please check the spelling or try your phone number.</div>
          )}
          {status === 'done' && results.length > 0 && (
            <div className="table-results">
              {results.map((r, i) => (
                <div key={i} className="table-result-item">
                  <span className="table-result-info">
                    <span className="table-result-name">{r.name}</span>
                    {r.phone && <span className="table-result-phone">{r.phone}</span>}
                  </span>
                  <span className="table-result-num">
                    {r.tableNumber ? `Table ${r.tableNumber}` : 'Table not assigned yet'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {status === 'error' && <div className="form-msg err">Something went wrong. Please try again.</div>}
        </form>
      </Reveal>
    </section>
  );
}

function AddToCalendarSection({ settings }) {
  const [open, setOpen] = useState(true);

  return (
    <Reveal className="calendar-card">
      <button type="button" className="calendar-header" onClick={() => setOpen(!open)}>
        <span className="calendar-icon"><NavIconCalendar /></span>
        <span className="calendar-header-text">
          <span className="calendar-title">Add to Calendar</span>
          <span className="calendar-subtitle">Save the date to your calendar</span>
        </span>
        <span className="calendar-chevron">{open ? '⌃' : '⌄'}</span>
      </button>

      {open && (
        <div className="calendar-options">
          <a className="calendar-option" href={buildGoogleCalendarUrl(settings)} target="_blank" rel="noopener noreferrer">
            <span className="calendar-option-icon">📆</span>
            <span className="calendar-option-label">Google Calendar</span>
            <span className="calendar-option-arrow">›</span>
          </a>
          <button type="button" className="calendar-option" onClick={() => downloadICS(settings)}>
            <span className="calendar-option-icon"><AppleLogoIcon /></span>
            <span className="calendar-option-label">Apple Calendar / Outlook</span>
            <span className="calendar-option-arrow">›</span>
          </button>
        </div>
      )}
    </Reveal>
  );
}

function ThankYouSection({ settings }) {
  return (
    <section id="thank-you">
      <Reveal className="thank-you-card">
        <div className="thank-you-mark">❦</div>
        <h2 className="sec-title-en">{settings.thankYouTitle}</h2>
        <p className="thank-you-message">{settings.thankYouMessage}</p>
        <div className="thank-you-sign">— {settings.groomName} <span className="amp-inline">&amp;</span> {settings.brideName}</div>
      </Reveal>
    </section>
  );
}

function TopNavBar({ settings }) {
  const [activeHref, setActiveHref] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '#schedule', label: 'Schedule' },
    { href: '#rsvp', label: 'RSVP' },
    { href: '#find-table', label: 'Find Table' },
    { href: '#location', label: 'Venue' },
    { href: '#wishes', label: 'Wishes' },
  ];

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
      const offset = 130;
      let current = '';
      for (const l of links) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = l.href;
        }
      }
      setActiveHref(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groomInitial = (settings.groomName || 'C')[0];
  const brideInitial = (settings.brideName || 'L')[0];

  return (
    <nav className={`top-navbar ${scrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
      <a href="#top" className="top-navbar-brand" onClick={() => setMenuOpen(false)}>
        {groomInitial}<span className="top-navbar-amp">&amp;</span>{brideInitial}
      </a>

      <div className={`top-navbar-links ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`top-navbar-link ${activeHref === l.href ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        className="top-navbar-toggle"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
    </nav>
  );
}

function MobileQuickNav() {
  const [activeHref, setActiveHref] = useState('');
  const links = [
    { href: '#schedule', label: 'Schedule', icon: <NavIconCalendar /> },
    { href: '#rsvp', label: 'RSVP', icon: <NavIconEnvelope /> },
    { href: '#find-table', label: 'Table', icon: <NavIconSearch /> },
    { href: '#location', label: 'Venue', icon: <NavIconPin /> },
    { href: '#wishes', label: 'Wishes', icon: <NavIconFlower /> },
  ];

  useEffect(() => {
    function onScroll() {
      const offset = 140;
      let current = '';
      for (const l of links) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = l.href;
        }
      }
      setActiveHref(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="mobile-quicknav" aria-label="Quick navigation">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className={`mobile-quicknav-item ${activeHref === l.href ? 'active' : ''}`}
        >
          <span className="mobile-quicknav-icon">{l.icon}</span>
          <span className="mobile-quicknav-label">{l.label}</span>
        </a>
      ))}
    </nav>
  );
}

export default function Home({ searchParams }) {
  const guestNameParam = (searchParams?.to || '').toString().trim() || null;

  const [now, setNow] = useState(() => Date.now());
  const [form, setForm] = useState({ name: guestNameParam || '', phone: '', side: '', attending: '', guests: 1, drinks: '', message: '' });
  const [status, setStatus] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [introOpen, setIntroOpen] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [guestName] = useState(guestNameParam);
  const [showGreeting, setShowGreeting] = useState(!!guestNameParam);
  const [greetingLeaving, setGreetingLeaving] = useState(false);

  useEffect(() => {
    if (guestNameParam) {
      const t1 = setTimeout(() => setGreetingLeaving(true), 5000);
      const t2 = setTimeout(() => setShowGreeting(false), 5550);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [guestNameParam]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) setEvents(data);
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && Object.keys(data).length) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = introOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [introOpen]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--gold', settings.themeGold);
    root.style.setProperty('--gold-bright', settings.themeGoldBright);
    root.style.setProperty('--gold-glow', settings.themeGoldGlow);
    root.style.setProperty('--rose', settings.themeRose);
    root.style.setProperty('--bg-deep', settings.themeBgDeep);
    root.style.setProperty('--ink', settings.themeInk);
  }, [settings.themeGold, settings.themeGoldBright, settings.themeGoldGlow, settings.themeRose, settings.themeBgDeep, settings.themeInk]);

  useEffect(() => {
    const heading = settings.themeHeadingFont || 'Cormorant Garamond';
    const body = settings.themeBodyFont || 'Poppins';
    const linkId = 'dynamic-theme-fonts';
    let link = document.getElementById(linkId);
    const href = `https://fonts.googleapis.com/css2?family=${heading.replace(/ /g, '+')}:wght@400;500;600;700&family=${body.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
    document.documentElement.style.setProperty('--font-heading', `'${heading}', serif`);
    document.documentElement.style.setProperty('--font-body', `'${body}', sans-serif`);
  }, [settings.themeHeadingFont, settings.themeBodyFont]);

  function handleEnter() {
    setIntroLeaving(true);
    if (settings.songUrl) {
      try {
        const audio = new Audio(settings.songUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // ignore
      }
    }
    setTimeout(() => setIntroOpen(false), 550);
  }

  // countdownTarget may be stored as a plain date ('YYYY-MM-DD') or a full
  // date-time. If it's date-only, treat it as midnight in Sri Lanka (+05:30).
  const rawTarget = settings.countdownTarget || '';
  const heroTargetStr = /^\d{4}-\d{2}-\d{2}$/.test(rawTarget) ? `${rawTarget}T00:00:00+05:30` : rawTarget;
  const heroTarget = new Date(heroTargetStr).getTime();
  const heroDiff = Math.max(0, heroTarget - now);
  const hd = Math.floor(heroDiff / 86400000);
  const hh = Math.floor((heroDiff / 3600000) % 24);
  const hm = Math.floor((heroDiff / 60000) % 60);
  const hs = Math.floor((heroDiff / 1000) % 60);
  const heroDateObj = rawTarget ? new Date(heroTargetStr) : null;
  const heroDateStr =
    heroDateObj && !isNaN(heroDateObj.getTime())
      ? heroDateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '';

  const PHONE_REGEX = /^(0|\+94)7\d{8}$/;

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    const cleanedPhone = (form.phone || '').replace(/[\s-]/g, '');
    if (!PHONE_REGEX.test(cleanedPhone)) {
      setValidationError('Please enter a valid phone number (e.g. 0771234567).');
      return;
    }
    if (!form.side) {
      setValidationError('Please let us know if you\u2019re joining from the bride\u2019s or groom\u2019s side.');
      return;
    }
    if (!form.drinks) {
      setValidationError('Please let us know if you\u2019ll be having drinks.');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: cleanedPhone, submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
      setForm({ name: '', phone: '', side: '', attending: '', guests: 1, drinks: '', message: '' });
    } catch (err) {
      setStatus('err');
    }
  }

  return (
    <>
      <FallingPetals />

      <TopNavBar settings={settings} />

      <MobileQuickNav />

      {showGreeting && <GuestGreeting name={guestName} leaving={greetingLeaving} />}

      {introOpen && (!guestNameParam || greetingLeaving) && (
        <IntroScreen onEnter={handleEnter} leaving={introLeaving} settings={settings} />
      )}

      <div className="hero" id="top">
        <div className="hero-bg-illustration" aria-hidden="true">
          <img
            src="/images/couple-illustration.png"
            alt=""
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>

        <div className="hero-content">
          <div className="lamp-wrap">
            <LampIcon />
          </div>

          <a href="#wishes" className="hero-wishes-jump"><NavIconEnvelope /> Guest Wishes</a>

          <div className="eyebrow">You are lovingly invited</div>

          <h1 className="names-en">{settings.groomName}<span className="amp">&amp;</span>{settings.brideName}</h1>

          <div className="tagline">
            <span className="en">&quot;{settings.taglineEn}&quot;</span>
          </div>

          <div className="hero-date-display">{heroDateStr}</div>

          <div className="main-cd">
            <div className="cd-row">
              <div className="cd-box"><span className="cd-num">{two(hd)}</span><span className="cd-label">Days</span></div>
              <div className="cd-box"><span className="cd-num">{two(hh)}</span><span className="cd-label">Hrs</span></div>
              <div className="cd-box"><span className="cd-num">{two(hm)}</span><span className="cd-label">Min</span></div>
              <div className="cd-box"><span className="cd-num">{two(hs)}</span><span className="cd-label">Sec</span></div>
            </div>
          </div>

          <div className="scroll-cue">⌄ SCROLL TO EXPLORE ⌄</div>
        </div>
      </div>

      <div className="lattice" />

      <section id="schedule">
        <div className="sec-head">
          <div className="sec-eyebrow">Auspicious Times</div>
          <h2 className="sec-title-en">Wedding Schedule</h2>
        </div>
        <div className="timeline">
          {events.map((ev, i) => (
            <EventCard key={ev.id || i} ev={ev} idx={i} now={now} />
          ))}
        </div>
      </section>

      <div className="lattice" />

      <section id="rsvp">
        <div className="sec-head">
          <div className="sec-eyebrow">Kindly Respond</div>
          <h2 className="sec-title-en">RSVP</h2>
        </div>

        <Reveal className="rsvp-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="r-name">Full Name</label>
              <input
                id="r-name"
                type="text"
                required
                placeholder="e.g. Nimal Perera"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="r-phone">Phone Number</label>
              <input
                id="r-phone"
                type="tel"
                required
                placeholder="e.g. 0771234567"
                pattern="^(0|\+94)7[0-9]{8}$"
                title="Enter a valid phone number, e.g. 0771234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="r-side">You&apos;re joining as</label>
              <select
                id="r-side"
                required
                value={form.side}
                onChange={(e) => setForm({ ...form, side: e.target.value })}
              >
                <option value="" disabled>Select</option>
                <option value="Bride">Bride&apos;s Side</option>
                <option value="Groom">Groom&apos;s Side</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-attend">Will you attend?</label>
              <select
                id="r-attend"
                required
                value={form.attending}
                onChange={(e) => setForm({ ...form, attending: e.target.value })}
              >
                <option value="" disabled>Select</option>
                <option value="Yes">Joyfully Yes</option>
                <option value="No">Sadly No</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-guests">Number of Guests</label>
              <input
                id="r-guests"
                type="number"
                min="1"
                max="10"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="r-drinks">Will you be having drinks?</label>
              <select
                id="r-drinks"
                required
                value={form.drinks}
                onChange={(e) => setForm({ ...form, drinks: e.target.value })}
              >
                <option value="" disabled>Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-msg">Message for the couple (optional)</label>
              <textarea
                id="r-msg"
                placeholder="Write your wishes here"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-glow">Send RSVP</button>
            {validationError && <div className="form-msg err">{validationError}</div>}
            {status === 'sending' && <div className="form-msg">Sending...</div>}
            {status === 'ok' && <div className="form-msg ok">Thank you! Your RSVP has been received.</div>}
            {status === 'err' && <div className="form-msg err">Something went wrong. Please try again.</div>}
          </form>
        </Reveal>
      </section>

      <AddToCalendarSection settings={settings} />

      <div className="lattice" />

      <TableLookupSection />

      <LocationSection settings={settings} />

      <div className="lattice" />

      <WishesWall />

      <div className="lattice" />

      <ThankYouSection settings={settings} />

      <footer>
        WITH LOVE, {settings.groomName?.toUpperCase()} <span className="amp-inline">&amp;</span> {settings.brideName?.toUpperCase()}
      </footer>
    </>
  );
}
