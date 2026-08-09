'use client';

import { useEffect, useRef, useState } from 'react';
import './homecoming.css';

export const dynamic = 'force-dynamic';

const MAPS_LINK = 'https://maps.app.goo.gl/qbDHs4aibkrYkdnt7?g_st=aw';
const HOMECOMING_DATE = 'September 19, 2026';
const HOMECOMING_TIME = '6:22 PM Onwards';
const HOMECOMING_TARGET = '2026-09-19T18:22:00+05:30';
const VENUE_NAME = 'Jayawardana Residence';
const VENUE_ADDRESS = 'Paduwasnuwara East';
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

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

function HcReveal({ children, className = '' }) {
  const [ref, inView] = useInView(0.12);
  return (
    <div ref={ref} className={`hc-reveal ${inView ? 'in-view' : ''} ${className}`}>
      {children}
    </div>
  );
}

function HcPetal() {
  return <span className="hc-petal" aria-hidden="true" />;
}

function HcIconTikTok() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.2c-.9-.9-1.4-2.1-1.4-3.4h-3.1v13.6c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.3 0 .6.05.9.14V9.7c-.3-.04-.6-.07-.9-.07-3.2 0-5.8 2.6-5.8 5.8s2.6 5.8 5.8 5.8 5.8-2.6 5.8-5.8V8.9c1.2.9 2.7 1.4 4.3 1.4V7.2c-1 0-1.9-.3-2.6-.9-.15-.13-.28-.27-.4-.4-.4-.4-.7-.9-.9-1.4z" />
    </svg>
  );
}
function HcIconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-8.1h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.28-.04-1.24-.12-2.36-.12-2.34 0-3.94 1.43-3.94 4.04v2.25H7.7v3.1h2.7V21h3.1z" />
    </svg>
  );
}
function HcIconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function HcIconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.25-.25.6-.33.9-.2 1 .35 2.1.55 3.2.55.5 0 .9.4.9.9V19c0 .5-.4.9-.9.9C9.9 19.9 4.1 14.1 4.1 5.2c0-.5.4-.9.9-.9h3.2c.5 0 .9.4.9.9 0 1.1.2 2.2.55 3.2.1.3.05.65-.2.9l-2.85 2.5z" />
    </svg>
  );
}

function HcNavBar({ names }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: '#hc-rsvp', label: 'RSVP' },
    { href: '#hc-find-table', label: 'Find Table' },
    { href: '#hc-venue', label: 'Venue' },
  ];

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const groomInitial = (names.groomName || 'C')[0];
  const brideInitial = (names.brideName || 'L')[0];

  return (
    <nav className={`hc-navbar ${scrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
      <a href="#hc-top" className="hc-navbar-brand">
        {groomInitial}<span className="hc-navbar-amp">&amp;</span>{brideInitial}
      </a>
      <div className={`hc-navbar-links ${menuOpen ? 'open' : ''}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} className="hc-navbar-link" onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
      </div>
      <button type="button" className="hc-navbar-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
        <span /><span /><span />
      </button>
    </nav>
  );
}

function HcCornerFlourish({ flip }) {
  return (
    <svg viewBox="0 0 60 60" width="30" height="30" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path
        d="M2 30 Q2 2 30 2"
        fill="none"
        stroke="#b23a2e"
        strokeWidth="1"
        opacity="0.45"
      />
      <path
        d="M10 30 Q10 10 30 10"
        fill="none"
        stroke="#b23a2e"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

function HcIntroVideo({ onEnter, leaving, names }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function paintFirstFrame() {
      try {
        video.currentTime = 0.01;
      } catch (e) {
        // ignore
      }
    }
    video.addEventListener('loadedmetadata', paintFirstFrame);
    video.load();
    return () => video.removeEventListener('loadedmetadata', paintFirstFrame);
  }, []);

  function handleClick() {
    if (playing) return;
    const video = videoRef.current;
    if (video) {
      setPlaying(true);
      video.currentTime = 0;
      video.play().catch(() => {});
      setTimeout(() => {
        video.pause();
        onEnter();
      }, 5000);
    } else {
      onEnter();
    }
  }

  const groomInitial = (names.groomName || 'C')[0];
  const brideInitial = (names.brideName || 'L')[0];

  return (
    <div className={`hc-intro-overlay ${leaving ? 'leaving' : ''}`}>
      <div className="hc-intro-card">
        <div className="hc-intro-bg" aria-hidden="true">
          <video
            ref={videoRef}
            src="/videos/homecoming-intro-video.mp4"
            muted
            playsInline
            preload="auto"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
        <div className="hc-intro-content">
          <div className="hc-intro-corner tl"><HcCornerFlourish /></div>
          <div className="hc-intro-corner tr"><HcCornerFlourish flip /></div>

          <div className="hc-monogram">
            {groomInitial}<span className="hc-monogram-amp">&amp;</span>{brideInitial}
          </div>

          <span className="hc-badge">● Home Coming</span>

          <h1 className="hc-names">
            {names.groomName}
            <span className="hc-amp">&amp;</span>
            {names.brideName}
          </h1>

          <div className="hc-divider" />

          <p className="hc-tagline">You are warmly invited to our Home Coming celebration.</p>

          <button className="hc-cta" onClick={handleClick} disabled={playing}>
            {playing ? 'Opening your invitation...' : (
              <>You&apos;re Invited <span aria-hidden="true">→</span></>
            )}
          </button>

          <p className="hc-intro-hint">{playing ? '✨ Opening...' : 'Tap to begin'}</p>

          <div className="hc-intro-corner bl"><HcCornerFlourish flip /></div>
          <div className="hc-intro-corner br"><HcCornerFlourish /></div>
        </div>
      </div>
    </div>
  );
}

function HcAddToCalendar({ names }) {
  const [open, setOpen] = useState(true);

  function buildICS() {
    const start = new Date(HOMECOMING_TARGET);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `SUMMARY:${names.groomName} & ${names.brideName}'s Home Coming`,
      `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
      `LOCATION:${VENUE_NAME}, ${VENUE_ADDRESS}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }

  function downloadICS() {
    const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.location.href = url;
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'homecoming-invite.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function googleCalendarUrl() {
    const start = new Date(HOMECOMING_TARGET);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const text = encodeURIComponent(`${names.groomName} & ${names.brideName}'s Home Coming`);
    const loc = encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&location=${loc}`;
  }

  return (
    <HcReveal className="hc-panel hc-calendar-panel">
      <button type="button" className="hc-calendar-header" onClick={() => setOpen(!open)}>
        <span className="hc-calendar-icon">📅</span>
        <span className="hc-calendar-header-text">
          <span className="hc-calendar-title">Add to Calendar</span>
          <span className="hc-calendar-subtitle">Save the date to your calendar</span>
        </span>
        <span className="hc-calendar-chevron">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div className="hc-calendar-options">
          <a className="hc-calendar-option" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">
            <span className="hc-calendar-option-icon">🗓️</span>
            <span className="hc-calendar-option-label">Google Calendar</span>
            <span className="hc-calendar-option-arrow">›</span>
          </a>
          <button type="button" className="hc-calendar-option" onClick={downloadICS}>
            <span className="hc-calendar-option-icon">🍎</span>
            <span className="hc-calendar-option-label">Apple Calendar / Outlook</span>
            <span className="hc-calendar-option-arrow">›</span>
          </button>
        </div>
      )}
    </HcReveal>
  );
}

function HcThankYou({ names }) {
  return (
    <section className="hc-section">
      <HcReveal className="hc-panel hc-thankyou-panel">
        <div className="hc-thankyou-icon">🌿</div>
        <h2 className="hc-thankyou-title">To Our Wonderful Guests</h2>
        <p className="hc-thankyou-msg">
          From the bottom of our hearts, thank you for being part of our Home Coming. Your presence
          means the world to us as we begin this new chapter together.
        </p>
        <p className="hc-thankyou-sign">— {names.groomName} &amp; {names.brideName}</p>
      </HcReveal>
    </section>
  );
}

function HcTableFinder() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  async function fetchMatches(q, suggest) {
    try {
      const res = await fetch('/api/rsvp/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, suggest, event: 'homecoming' }),
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
    <section id="hc-find-table" className="hc-section">
      <div className="hc-section-head">
        <div className="hc-eyebrow">Seating</div>
        <h2 className="hc-section-title">Find Your Table</h2>
      </div>
      <HcReveal className="hc-panel">
        <form onSubmit={handleSearch} autoComplete="off">
          <div className="hc-field" style={{ position: 'relative' }}>
            <label htmlFor="hc-t-query">Name or Phone Number</label>
            <input
              id="hc-t-query"
              type="text"
              required
              placeholder="e.g. Nimal Perera or 0771234567"
              value={query}
              onChange={handleChange}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && (
              <div className="hc-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className="hc-suggestion-item" onMouseDown={() => pickSuggestion(s)}>
                    <span>
                      <span className="hc-suggestion-name">{s.name}</span>
                      {s.phone && <span className="hc-suggestion-phone">{s.phone}</span>}
                    </span>
                    {s.tableNumber && <span className="hc-suggestion-num">Table {s.tableNumber}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="hc-cta hc-cta-block" disabled={status === 'loading'}>
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>
          {status === 'done' && results.length === 0 && (
            <div className="hc-msg hc-msg-err">No matching guest found. Please check the spelling or try your phone number.</div>
          )}
          {status === 'done' && results.length > 0 && (
            <div className="hc-results">
              {results.map((r, i) => (
                <div key={i} className="hc-result-item">
                  <span>
                    <span className="hc-result-name">{r.name}</span>
                    {r.phone && <span className="hc-result-phone">{r.phone}</span>}
                  </span>
                  <span className="hc-result-num">{r.tableNumber ? `Table ${r.tableNumber}` : 'Table not assigned yet'}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </HcReveal>
    </section>
  );
}

export default function HomecomingPage() {
  const [names, setNames] = useState({ groomName: 'Chathura', brideName: 'Lakmini' });
  const [introOpen, setIntroOpen] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', side: '', attending: '', guests: 1, drinks: '' });
  const [rsvpStep, setRsvpStep] = useState(0);
  const [status, setStatus] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setNames({
          groomName: data.groomName || 'Chathura',
          brideName: data.brideName || 'Lakmini',
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = introOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [introOpen]);

  function handleEnter() {
    setIntroLeaving(true);
    setTimeout(() => setIntroOpen(false), 550);
  }

  async function submitRsvp(overrides = {}) {
    const payload = { ...form, ...overrides, event: 'homecoming' };
    const cleanedPhone = (payload.phone || '').replace(/[\s\-()]/g, '');
    setStatus('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, phone: cleanedPhone, submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
      setForm({ name: '', phone: '', side: '', attending: '', guests: 1, drinks: '' });
      setRsvpStep(0);
    } catch (err) {
      setStatus('err');
    }
  }

  function validateNameAndPhone() {
    setValidationError('');
    if (!form.name.trim()) {
      setValidationError('Please enter your name.');
      return false;
    }
    const cleanedPhone = (form.phone || '').replace(/[\s\-()]/g, '');
    if (!PHONE_REGEX.test(cleanedPhone)) {
      setValidationError('Please enter a valid phone number (e.g. 0771234567).');
      return false;
    }
    return true;
  }

  function handleAccept() {
    if (!validateNameAndPhone()) return;
    setForm((f) => ({ ...f, attending: 'Yes' }));
    setRsvpStep(2);
  }

  function handleDecline() {
    if (!validateNameAndPhone()) return;
    setForm((f) => ({ ...f, attending: 'No' }));
    submitRsvp({ attending: 'No' });
  }

  function handleStep2Continue() {
    if (!form.side) {
      setValidationError('Please let us know if you\u2019re joining from the bride\u2019s or groom\u2019s side.');
      return;
    }
    setValidationError('');
    setRsvpStep(3);
  }

  function handleStep3Continue() {
    setValidationError('');
    setRsvpStep(4);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    if (!form.drinks) {
      setValidationError('Please let us know if you\u2019ll be having drinks.');
      return;
    }
    setValidationError('');
    await submitRsvp({});
  }

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(`${VENUE_NAME}, ${VENUE_ADDRESS}`)}&z=15&output=embed`;

  const hcTarget = new Date(HOMECOMING_TARGET).getTime();
  const hcDiff = Math.max(0, hcTarget - now);
  const two = (n) => String(n).padStart(2, '0');
  const hd = Math.floor(hcDiff / 86400000);
  const hh = Math.floor((hcDiff / 3600000) % 24);
  const hm = Math.floor((hcDiff / 60000) % 60);
  const hs = Math.floor((hcDiff / 1000) % 60);

  return (
    <div className="hc-page">
      <div className="hc-petals" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <HcPetal key={i} />)}
      </div>

      {introOpen && <HcIntroVideo onEnter={handleEnter} leaving={introLeaving} names={names} />}

      {!introOpen && (
        <>
          <HcNavBar names={names} />

          <section className="hc-hero" id="hc-top">
            <HcReveal className="hc-card">
              <div className="hc-hero-bg" aria-hidden="true">
                <video
                  src="/videos/homecoming-intro-video.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                />
              </div>
              <div className="hc-hero-content">
              <div className="hc-badge">● Home Coming</div>
              <h1 className="hc-names">
                {names.groomName}
                <span className="hc-amp">&amp;</span>
                {names.brideName}
              </h1>
              <p className="hc-tagline">
                With hearts full of joy, we warmly welcome you to celebrate our Home Coming.
              </p>

              <div className="hc-countdown">
                <div className="hc-cd-box"><span className="hc-cd-num">{two(hd)}</span><span className="hc-cd-label">Days</span></div>
                <div className="hc-cd-box"><span className="hc-cd-num">{two(hh)}</span><span className="hc-cd-label">Hrs</span></div>
                <div className="hc-cd-box"><span className="hc-cd-num">{two(hm)}</span><span className="hc-cd-label">Min</span></div>
                <div className="hc-cd-box"><span className="hc-cd-num">{two(hs)}</span><span className="hc-cd-label">Sec</span></div>
              </div>

              <div className="hc-divider" />

              <div className="hc-detail-row">
                <span className="hc-detail-icon">📅</span>
                <div>
                  <div className="hc-detail-label">Date</div>
                  <div className="hc-detail-value">{HOMECOMING_DATE}</div>
                </div>
              </div>
              <div className="hc-detail-row">
                <span className="hc-detail-icon">🕕</span>
                <div>
                  <div className="hc-detail-label">Time</div>
                  <div className="hc-detail-value">{HOMECOMING_TIME}</div>
                </div>
              </div>
              </div>
            </HcReveal>
          </section>

          <section id="hc-venue" className="hc-section">
            <div className="hc-section-head">
              <div className="hc-eyebrow">Find Us Here</div>
              <h2 className="hc-section-title">Venue</h2>
            </div>
            <HcReveal className="hc-panel">
              <div className="hc-detail-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                <span className="hc-detail-icon">📍</span>
                <div>
                  <div className="hc-detail-label">Venue</div>
                  <div className="hc-detail-value">{VENUE_NAME}</div>
                  <div className="hc-detail-sub">{VENUE_ADDRESS}</div>
                </div>
              </div>

              <div className="hc-map-wrap">
                <iframe
                  src={embedSrc}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Home Coming venue location"
                />
              </div>

              <a className="hc-cta hc-cta-block" href={MAPS_LINK} target="_blank" rel="noopener noreferrer">
                Open in Google Maps
              </a>
            </HcReveal>
          </section>

          <section id="hc-rsvp" className="hc-section">
            <div className="hc-section-head">
              <div className="hc-eyebrow">Kindly Respond</div>
              <h2 className="hc-section-title">RSVP</h2>
            </div>

            <HcReveal className="hc-panel">
              {rsvpStep === 0 && (
                <div className="hc-step">
                  <div className="hc-field">
                    <label htmlFor="hc-name">Full Name</label>
                    <input
                      id="hc-name"
                      type="text"
                      required
                      placeholder="e.g. Nimal Perera"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="hc-field">
                    <label htmlFor="hc-phone">Phone Number</label>
                    <input
                      id="hc-phone"
                      type="tel"
                      required
                      placeholder="e.g. 0771234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <p className="hc-question">Will You Join Us, {(form.name || '').split(' ')[0] || 'there'}?</p>
                  <div className="hc-accept-decline">
                    <button type="button" className="hc-accept-btn" onClick={handleAccept}>✓ Accept</button>
                    <button type="button" className="hc-decline-btn" onClick={handleDecline}>✗ Decline</button>
                  </div>
                </div>
              )}

              {rsvpStep === 2 && (
                <div className="hc-step">
                  <div className="hc-field">
                    <label htmlFor="hc-side">You&apos;re joining as</label>
                    <select
                      id="hc-side"
                      required
                      value={form.side}
                      onChange={(e) => setForm({ ...form, side: e.target.value })}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Bride">Bride&apos;s Side</option>
                      <option value="Groom">Groom&apos;s Side</option>
                    </select>
                  </div>
                  <div className="hc-step-actions">
                    <button type="button" className="hc-back" onClick={() => setRsvpStep(0)}>← Back</button>
                    <button type="button" className="hc-cta" onClick={handleStep2Continue}>Continue →</button>
                  </div>
                </div>
              )}

              {rsvpStep === 3 && (
                <div className="hc-step">
                  <div className="hc-field">
                    <label htmlFor="hc-guests">Number of Guests</label>
                    <input
                      id="hc-guests"
                      type="number"
                      min="1"
                      max="10"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: e.target.value })}
                    />
                  </div>
                  <div className="hc-step-actions">
                    <button type="button" className="hc-back" onClick={() => setRsvpStep(2)}>← Back</button>
                    <button type="button" className="hc-cta" onClick={handleStep3Continue}>Continue →</button>
                  </div>
                </div>
              )}

              {rsvpStep === 4 && (
                <form className="hc-step" onSubmit={handleFinalSubmit}>
                  <div className="hc-field">
                    <label htmlFor="hc-drinks">Will you be having drinks?</label>
                    <select
                      id="hc-drinks"
                      required
                      value={form.drinks}
                      onChange={(e) => setForm({ ...form, drinks: e.target.value })}
                    >
                      <option value="" disabled>Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="hc-step-actions">
                    <button type="button" className="hc-back" onClick={() => setRsvpStep(3)}>← Back</button>
                    <button type="submit" className="hc-cta">Send RSVP</button>
                  </div>
                </form>
              )}

              {validationError && <div className="hc-msg hc-msg-err">{validationError}</div>}
              {status === 'sending' && <div className="hc-msg">Sending...</div>}
              {status === 'ok' && <div className="hc-msg hc-msg-ok">Thank you! Your RSVP has been received.</div>}
              {status === 'err' && <div className="hc-msg hc-msg-err">Something went wrong. Please try again.</div>}
            </HcReveal>
          </section>

          <section className="hc-section" style={{ paddingTop: 0 }}>
            <HcAddToCalendar names={names} />
          </section>

          <HcTableFinder />

          <HcThankYou names={names} />

          <footer className="hc-footer">
            With love, {names.groomName} &amp; {names.brideName}
          </footer>

          <div className="hc-credit">
            <a href="https://inviteglow.com" target="_blank" rel="noopener noreferrer" className="hc-credit-brand">
              Website by <strong>Invite Glow</strong>
            </a>
            <div className="hc-credit-links">
              <a href="https://www.tiktok.com/@invitvei1w8?_r=1&_t=ZS-9858lr1qCkn" target="_blank" rel="noopener noreferrer" aria-label="Invite Glow on TikTok">
                <HcIconTikTok />
              </a>
              <a href="https://www.facebook.com/share/1AtpWeKASA/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Invite Glow on Facebook">
                <HcIconFacebook />
              </a>
              <a href="https://www.instagram.com/invite__glow?igsh=M3Fsc2E0NTBwYw==" target="_blank" rel="noopener noreferrer" aria-label="Invite Glow on Instagram">
                <HcIconInstagram />
              </a>
              <a href="tel:+94770024484" aria-label="Call Invite Glow">
                <HcIconPhone />
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
