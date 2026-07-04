'use client';

import { useEffect, useState } from 'react';

// Fallback data — shown until /api/schedule and /api/settings load, or if tables are empty.
const DEFAULT_EVENTS = [
  { en: 'Invitation to the Auspicious Ceremony', si: 'නැකතට ආරාධනා කිරීම', date: '2026-07-23T10:52:00', dirEn: 'East', dirSi: 'නැගෙනහිර' },
  { en: 'Traditional Oil Stove Ceremony', si: 'තෙල් වළං ලිප තැබීම', date: '2026-09-11T09:32:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Traditional Dining Table Ritual', si: 'කෑම මේසය ඉදුල් කිරීම', date: '2026-09-13T11:52:00', dirEn: 'South', dirSi: 'දකුණ' },
  { en: 'Groom Leaves the House', si: 'මනාලයා නිවසින් පිටත්වීම', date: '2026-09-15T17:26:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Bride Leaves the House', si: 'මනාලිය නිවසින් පිටත්වීම', date: '2026-09-15T23:47:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Wearing the Forehead Bandage', si: 'තැලූල තැබීම', date: '2026-09-16T04:02:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Bride Arrives at the Reception Hall', si: 'මනාලිය උත්සව ශාලාවට පැමිණීම', date: null },
  { en: 'Groom Arrives at the Reception Hall', si: 'මනාලයා උත්සව ශාලාවට පැමිණීම', date: null },
  { en: 'Marriage Registration', si: 'විවාහ ලියාපදිංචිය', date: '2026-09-16T09:02:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Poruwa Ceremony — Start', si: 'පෝරුවට නැගීම', date: '2026-09-16T09:24:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Poruwa Ceremony — End', si: 'පෝරුවෙන් බැසීම', date: '2026-09-16T09:58:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: "Couple's First Meal Together", si: 'කෑම මේසය ඉදුල් කිරීම', date: '2026-09-16T11:52:00', dirEn: 'North', dirSi: 'උතුර' },
  { en: 'Departure from the Reception Hall', si: 'උත්සව ශාලාවෙන් පිටත්වීම', date: '2026-09-16T15:27:00', dirEn: 'North', dirSi: 'උතුර', note: 'Alt. times: 3:42 PM / 4:07 PM' },
  { en: 'Couple Arrives Home — Second Day', si: 'දෙවන දිනයේ නිවසට පැමිණීම', date: '2026-09-19T18:22:00', dirEn: 'North', dirSi: 'උතුර' },
];

const DEFAULT_SETTINGS = {
  groomName: 'Chathura',
  brideName: 'Lakmini',
  groomNameSi: 'චතුර',
  brideNameSi: 'ලක්මිණි',
  taglineEn: 'Two families, one auspicious hour, a lifetime that begins on the poruwa.',
  taglineSi: 'සියලු නෑ මිතුරන් සමඟ අප දෙදෙනාගේ විවාහ මංගල්‍යයට සහභාගී වන ලෙස කාරුණිකව ආරාධනා කරමු.',
  heroDate1Label: 'Poruwa Ceremony',
  heroDate1Value: 'September 16, 2026 · 9:24 AM',
  heroDate2Label: 'Homecoming',
  heroDate2Value: 'September 19, 2026',
  countdownTarget: '2026-09-16T09:24:00',
};

function two(n) {
  return String(n).padStart(2, '0');
}

function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
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

function CornerFlourish({ flip }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width="34"
      height="34"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <path d="M2 2 C 20 2, 22 20, 40 20 C 22 20, 20 38, 20 58" fill="none" stroke="#b8863f" strokeWidth="1.2" opacity="0.6" />
      <circle cx="40" cy="20" r="2.2" fill="#e7bd6a" />
      <circle cx="20" cy="58" r="1.6" fill="#e7bd6a" opacity="0.7" />
    </svg>
  );
}

function IntroScreen({ onEnter, leaving, settings }) {
  const initials = `${(settings.groomName || 'C')[0]} & ${(settings.brideName || 'L')[0]}`;
  return (
    <div className={`intro-overlay ${leaving ? 'leaving' : ''}`}>
      <div className="intro-card">
        <div className="intro-corner tl"><CornerFlourish /></div>
        <div className="intro-corner tr"><CornerFlourish flip /></div>

        <div className="intro-monogram">{initials}</div>

        <p className="intro-eyebrow-si">ශ්‍රී සුබ මංගලම්</p>
        <span className="intro-badge">● Wedding Invitation</span>

        <h1 className="intro-names">{settings.groomName}<br />&amp; {settings.brideName}</h1>

        <div className="intro-divider" />

        <p className="intro-tagline">{settings.taglineSi}</p>

        <button className="intro-cta" onClick={onEnter}>
          You&apos;re Invited <span aria-hidden="true">→</span>
        </button>

        <p className="intro-hint">🔊 Tap to begin — with music</p>

        <div className="intro-corner bl"><CornerFlourish flip /></div>
        <div className="intro-corner br"><CornerFlourish /></div>
      </div>
    </div>
  );
}

function EventCard({ ev, idx, now }) {
  const isDone = ev.date ? new Date(ev.date).getTime() - now <= 0 : false;

  let body;
  if (!ev.date) {
    body = <span className="tbd">Time to be announced · වේලාව පසුව දැනුම් දෙනු ලැබේ</span>;
  } else if (isDone) {
    body = <span className="done-tag">Completed · සිදු විය</span>;
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
    <div className={`event-card ${isDone ? 'done' : ''}`}>
      <div className="event-index">{two(idx + 1)}</div>
      <div className="event-body">
        <h3 className="ev-title-en">{ev.en}</h3>
        <p className="ev-title-si">{ev.si}</p>
        <div className="ev-meta">
          {ev.date && <span>🕐 <b>{fmtDate(ev.date)}</b></span>}
          {ev.dirEn && <span>⌖ {ev.dirEn} <span className="si">/ {ev.dirSi}</span></span>}
        </div>
        {body}
        {ev.note && <p className="note-line">{ev.note}</p>}
      </div>
    </div>
  );
}

function resizeImageToBase64(file, maxWidth = 700, quality = 0.72) {
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
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtWishDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function WishCard({ wish }) {
  return (
    <div className="wish-card">
      {wish.photo && (
        <div className="wish-photo-wrap">
          <img className="wish-photo" src={wish.photo} alt={`Photo from ${wish.name}`} />
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
  const [photoData, setPhotoData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [status, setStatus] = useState(null);

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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const dataUrl = await resizeImageToBase64(file);
      setPhotoData(dataUrl);
      setPhotoPreview(dataUrl);
    } catch (e) {
      // ignore bad image
    }
  }

  function removePhoto() {
    setPhotoData(null);
    setPhotoPreview(null);
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
          photo: photoData,
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
      setForm({ name: '', message: '' });
      removePhoto();
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
        <p className="sec-title-si">ඔබේ සුබ පැතුම් අපිත් එක්ක බෙදාගන්න</p>
      </div>

      <div className="rsvp-card" style={{ marginBottom: 44 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="w-name">Your Name <span className="si">ඔබේ නම</span></label>
            <input
              id="w-name"
              type="text"
              required
              placeholder="e.g. Nimal Perera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="w-msg">Your Wish <span className="si">ඔබේ සුබ පැතුම</span></label>
            <textarea
              id="w-msg"
              required
              placeholder="Write your wish for the couple... / ඔබේ සුබ පැතුම මෙහි ලියන්න"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="w-photo">Add a Photo <span className="si">(optional) — කැමති නම් ෆොටෝ එකක් දාන්න</span></label>
            {!photoPreview ? (
              <label className="photo-drop" htmlFor="w-photo">
                <span>📷 Choose a photo</span>
              </label>
            ) : (
              <div className="photo-preview-wrap">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <button type="button" className="photo-remove" onClick={removePhoto}>Remove ✕</button>
              </div>
            )}
            <input
              id="w-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>
          <button type="submit" className="btn">Post Your Wish <span className="si">පළ කරන්න</span></button>
          <p className="wish-privacy-note">Your wish will be reviewed and then shown publicly on this page for all guests to see.</p>
          {status === 'sending' && <div className="form-msg">Posting...</div>}
          {status === 'ok' && <div className="form-msg ok">Thank you! Your wish will appear once reviewed. / ස්තුතියි!</div>}
          {status === 'err' && <div className="form-msg err">Something went wrong. Please try again.</div>}
        </form>
      </div>

      {loading ? (
        <p className="empty-note">Loading wishes...</p>
      ) : wishes.length === 0 ? (
        <p className="empty-note">No wishes yet — be the first to leave one! / පළමු සුබ පැතුම ඔබෙන්ම වේවා</p>
      ) : (
        <div className="wish-grid">
          {wishes.map((w) => (
            <WishCard key={w.id} wish={w} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const [now, setNow] = useState(() => Date.now());
  const [form, setForm] = useState({ name: '', attending: '', guests: 1, message: '' });
  const [status, setStatus] = useState(null);
  const [introOpen, setIntroOpen] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

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

  function handleEnter() {
    setIntroLeaving(true);
    // Optional background music — add your own file at public/song.mp3 to enable.
    try {
      const audio = new Audio('/song.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // no audio file yet — silently ignore
    }
    setTimeout(() => setIntroOpen(false), 550);
  }

  const heroTarget = new Date(settings.countdownTarget).getTime();
  const heroDiff = Math.max(0, heroTarget - now);
  const hd = Math.floor(heroDiff / 86400000);
  const hh = Math.floor((heroDiff / 3600000) % 24);
  const hm = Math.floor((heroDiff / 60000) % 60);
  const hs = Math.floor((heroDiff / 1000) % 60);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
      setForm({ name: '', attending: '', guests: 1, message: '' });
    } catch (err) {
      setStatus('err');
    }
  }

  return (
    <>
      {introOpen && <IntroScreen onEnter={handleEnter} leaving={introLeaving} settings={settings} />}

      <div className="hero">
        <div className="lamp-wrap">
          <LampIcon />
        </div>

        <div className="eyebrow">
          You are lovingly invited
          <span className="si">ඔබ ආදරයෙන් ආරාධනා කරනු ලැබේ</span>
        </div>

        <h1 className="names-en">{settings.groomName}<span className="amp">&amp;</span>{settings.brideName}</h1>
        <p className="names-si">{settings.groomNameSi} <span style={{ color: 'var(--rose)' }}>&amp;</span> {settings.brideNameSi}</p>

        <div className="tagline">
          <span className="en">&quot;{settings.taglineEn}&quot;</span>
          <span className="si">{settings.taglineSi}</span>
        </div>

        <div className="hero-dates">
          <div className="date-chip">{settings.heroDate1Label} · <b>{settings.heroDate1Value}</b></div>
          <div className="date-chip">{settings.heroDate2Label} · <b>{settings.heroDate2Value}</b></div>
        </div>

        <div className="main-cd">
          <div className="main-cd-label">Counting down to the Poruwa <span className="si">පෝරුවට නැගීමට තව</span></div>
          <div className="cd-row">
            <div className="cd-box"><span className="cd-num">{two(hd)}</span><span className="cd-label">Days<span className="si">දවස්</span></span></div>
            <div className="cd-box"><span className="cd-num">{two(hh)}</span><span className="cd-label">Hrs<span className="si">පැය</span></span></div>
            <div className="cd-box"><span className="cd-num">{two(hm)}</span><span className="cd-label">Min<span className="si">මිනි</span></span></div>
            <div className="cd-box"><span className="cd-num">{two(hs)}</span><span className="cd-label">Sec<span className="si">තත්</span></span></div>
          </div>
        </div>

        <div className="scroll-cue">⌄ THE FULL SCHEDULE ⌄</div>
      </div>

      <div className="lattice" />

      <section id="schedule">
        <div className="sec-head">
          <div className="sec-eyebrow">Auspicious Times</div>
          <h2 className="sec-title-en">Wedding Schedule</h2>
          <p className="sec-title-si">මංගල උත්සව කාලසටහන — නැකැත් වේලාවන්</p>
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
          <p className="sec-title-si">ඔබගේ පැමිණීම තහවුරු කරන්න</p>
        </div>

        <div className="rsvp-card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="r-name">Full Name <span className="si">සම්පූර්ණ නම</span></label>
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
              <label htmlFor="r-attend">Will you attend? <span className="si">ඔබ පැමිණේද?</span></label>
              <select
                id="r-attend"
                required
                value={form.attending}
                onChange={(e) => setForm({ ...form, attending: e.target.value })}
              >
                <option value="" disabled>Select / තෝරන්න</option>
                <option value="Yes">Joyfully Yes / ඔව්, සතුටිනි</option>
                <option value="No">Sadly No / කණගාටුයි, නොහැක</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-guests">Number of Guests <span className="si">ඇතුළත් වන අමුත්තන් ගණන</span></label>
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
              <label htmlFor="r-msg">Message for the couple <span className="si">යුවලට සුබ පැතුමක්</span> (optional)</label>
              <textarea
                id="r-msg"
                placeholder="Write your wishes here / ඔබේ සුබ පැතුම මෙහි ලියන්න"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="btn">Send RSVP <span className="si">යවන්න</span></button>
            {status === 'sending' && <div className="form-msg">Sending...</div>}
            {status === 'ok' && <div className="form-msg ok">Thank you! Your RSVP has been received. / ස්තුතියි!</div>}
            {status === 'err' && <div className="form-msg err">Something went wrong. Please try again.</div>}
          </form>
        </div>
      </section>

      <div className="lattice" />

      <WishesWall />

      <footer>
        WITH LOVE, {settings.groomName?.toUpperCase()} &amp; {settings.brideName?.toUpperCase()}
        <span className="si">ආදරයෙන්, {settings.groomNameSi} සහ {settings.brideNameSi}</span>
        <div style={{ marginTop: '14px' }}>
          <a href="/admin">Couple&apos;s Dashboard</a>
        </div>
      </footer>
    </>
  );
}