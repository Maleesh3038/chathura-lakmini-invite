'use client';

import { useEffect, useRef, useState } from 'react';
import './homecoming.css';

export const dynamic = 'force-dynamic';

const MAPS_LINK = 'https://maps.app.goo.gl/qbDHs4aibkrYkdnt7?g_st=aw';
const HOMECOMING_DATE = 'September 19, 2026';
const HOMECOMING_TIME = '6:22 PM Onwards';
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

  return (
    <div className="hc-page">
      <div className="hc-petals" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => <HcPetal key={i} />)}
      </div>

      {introOpen && <HcIntroVideo onEnter={handleEnter} leaving={introLeaving} names={names} />}

      {!introOpen && (
        <>
          <section className="hc-hero">
            <HcReveal className="hc-card">
              <div className="hc-badge">● Home Coming</div>
              <h1 className="hc-names">
                {names.groomName}
                <span className="hc-amp">&amp;</span>
                {names.brideName}
              </h1>
              <p className="hc-tagline">
                With hearts full of joy, we warmly welcome you to celebrate our Home Coming.
              </p>
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
              <div className="hc-detail-row">
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

          <HcTableFinder />

          <footer className="hc-footer">
            With love, {names.groomName} &amp; {names.brideName}
          </footer>
        </>
      )}
    </div>
  );
}
