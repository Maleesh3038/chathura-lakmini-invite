'use client';

import { useEffect, useState } from 'react';

// Change this to something only you and your partner know.
// This must match the ADMIN_PASSCODE environment variable on the server
// (falls back to this same value if that env var isn't set).
const PASSCODE = 'poruwa2026';

function RsvpTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rsvp')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const total = data.length;
  const yes = data.filter((r) => r.attending === 'Yes').length;
  const no = data.filter((r) => r.attending === 'No').length;
  const guests = data
    .filter((r) => r.attending === 'Yes')
    .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);

  return (
    <div>
      <div className="stat-row">
        <div className="stat"><span className="stat-num">{total}</span><span className="stat-lab">Responses</span></div>
        <div className="stat"><span className="stat-num">{yes}</span><span className="stat-lab">Attending</span></div>
        <div className="stat"><span className="stat-num">{no}</span><span className="stat-lab">Declined</span></div>
        <div className="stat"><span className="stat-num">{guests}</span><span className="stat-lab">Total Guests</span></div>
      </div>

      {loading ? (
        <p className="empty-note">Loading...</p>
      ) : total === 0 ? (
        <p className="empty-note">No RSVPs yet. Once guests respond, they&apos;ll show up here.</p>
      ) : (
        <table className="rsvp-table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Attending</th><th>Guests</th><th>Message</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data.slice().reverse().map((r, i) => (
              <tr key={i}>
                <td>{r.name || '—'}</td>
                <td>{r.phone || '—'}</td>
                <td>{r.attending || '—'}</td>
                <td>{r.guests ?? '—'}</td>
                <td>{r.message || '—'}</td>
                <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminLightbox({ items, index, onClose, onPrev, onNext }) {
  if (index === null || !items || !items[index]) return null;
  const item = items[index];
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      {items.length > 1 && (
        <button className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>‹</button>
      )}
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay className="lightbox-media" />
        ) : (
          <img src={item.url} alt="" className="lightbox-media" />
        )}
      </div>
      {items.length > 1 && (
        <button className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); onNext(); }}>›</button>
      )}
    </div>
  );
}

function WishesTab({ passcode }) {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ items: null, index: null });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/wishes?all=true', {
        headers: { 'x-admin-passcode': passcode },
      });
      const json = await res.json();
      setWishes(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleApprove(w) {
    await fetch('/api/wishes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id: w.id, approved: !w.approved }),
    });
    load();
  }

  async function removeWish(w) {
    if (!confirm('Delete this wish permanently?')) return;
    await fetch('/api/wishes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id: w.id }),
    });
    load();
  }

  function openLightbox(items, index) { setLightbox({ items, index }); }
  function closeLightbox() { setLightbox({ items: null, index: null }); }
  function prevLightbox() { setLightbox((prev) => ({ ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length })); }
  function nextLightbox() { setLightbox((prev) => ({ ...prev, index: (prev.index + 1) % prev.items.length })); }

  if (loading) return <p className="empty-note">Loading...</p>;
  if (wishes.length === 0) return <p className="empty-note">No wishes yet.</p>;

  return (
    <div className="admin-list">
      {wishes.map((w) => (
        <div key={w.id} className="admin-item">
          {(w.media || []).length > 0 && (
            <div className="admin-media-row">
              {w.media.map((m, i) => (
                <button key={i} type="button" className="admin-media-thumb" onClick={() => openLightbox(w.media, i)}>
                  {m.type === 'video' ? <video src={m.url} muted playsInline /> : <img src={m.url} alt="" />}
                  {m.type === 'video' && <span className="media-play-icon">▶</span>}
                </button>
              ))}
            </div>
          )}
          <div className="admin-item-body">
            <div className="admin-item-head">
              <strong>{w.name}</strong>
              <span className={`badge ${w.approved ? 'badge-approved' : 'badge-pending'}`}>
                {w.approved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <p>{w.message}</p>
            <span className="admin-item-meta">{w.submittedAt ? new Date(w.submittedAt).toLocaleString() : ''}</span>
          </div>
          <div className="admin-item-actions">
            <button className="btn-small btn-approve" onClick={() => toggleApprove(w)}>
              {w.approved ? 'Unapprove' : 'Approve'}
            </button>
            <button className="btn-small btn-delete" onClick={() => removeWish(w)}>Delete</button>
          </div>
        </div>
      ))}

      <AdminLightbox items={lightbox.items} index={lightbox.index} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />
    </div>
  );
}

function emptyEventForm() {
  return { en: '', date: '', direction: '', note: '', sortOrder: 0 };
}

function ScheduleTab({ passcode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyEventForm());
  const [newForm, setNewForm] = useState(emptyEventForm());
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/schedule');
      const json = await res.json();
      setEvents(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(ev) {
    setEditingId(ev.id);
    setEditForm({
      en: ev.en || '',
      date: ev.date ? ev.date.slice(0, 16) : '',
      direction: ev.direction || '',
      note: ev.note || '',
      sortOrder: ev.sortOrder ?? 0,
    });
  }

  async function saveEdit(id) {
    await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id, ...editForm, date: editForm.date || null }),
    });
    setEditingId(null);
    load();
  }

  async function removeEvent(id) {
    if (!confirm('Delete this schedule item?')) return;
    await fetch('/api/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function addEvent(e) {
    e.preventDefault();
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ ...newForm, date: newForm.date || null, sortOrder: events.length }),
    });
    setNewForm(emptyEventForm());
    setShowAdd(false);
    load();
  }

  if (loading) return <p className="empty-note">Loading...</p>;

  return (
    <div>
      <div className="admin-list">
        {events.map((ev) => (
          <div key={ev.id} className="admin-item">
            {editingId === ev.id ? (
              <div className="admin-edit-form">
                <input value={editForm.en} onChange={(e) => setEditForm({ ...editForm, en: e.target.value })} placeholder="Event Name" />
                <input type="datetime-local" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                <input value={editForm.direction} onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })} placeholder="Direction (e.g. North)" />
                <input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="Note (optional)" />
                <div className="admin-item-actions">
                  <button className="btn-small btn-approve" onClick={() => saveEdit(ev.id)}>Save</button>
                  <button className="btn-small" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="admin-item-body">
                  <strong>{ev.en}</strong>
                  <span className="admin-item-meta">{ev.date ? new Date(ev.date).toLocaleString() : 'No date set'}</span>
                </div>
                <div className="admin-item-actions">
                  <button className="btn-small" onClick={() => startEdit(ev)}>Edit</button>
                  <button className="btn-small btn-delete" onClick={() => removeEvent(ev.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <form className="admin-edit-form" onSubmit={addEvent} style={{ marginTop: 20 }}>
          <input required value={newForm.en} onChange={(e) => setNewForm({ ...newForm, en: e.target.value })} placeholder="Event Name" />
          <input type="datetime-local" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />
          <input value={newForm.direction} onChange={(e) => setNewForm({ ...newForm, direction: e.target.value })} placeholder="Direction (e.g. North)" />
          <input value={newForm.note} onChange={(e) => setNewForm({ ...newForm, note: e.target.value })} placeholder="Note (optional)" />
          <div className="admin-item-actions">
            <button type="submit" className="btn-small btn-approve">Add Event</button>
            <button type="button" className="btn-small" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn" style={{ marginTop: 20 }} onClick={() => setShowAdd(true)}>+ Add Schedule Item</button>
      )}
    </div>
  );
}

function SettingsTab({ passcode }) {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setForm({
        groomName: data.groomName || '',
        brideName: data.brideName || '',
        taglineEn: data.taglineEn || '',
        heroDate1Label: data.heroDate1Label || '',
        heroDate1Value: data.heroDate1Value || '',
        heroDate2Label: data.heroDate2Label || '',
        heroDate2Value: data.heroDate2Value || '',
        countdownTarget: data.countdownTarget ? data.countdownTarget.slice(0, 16) : '',
        thankYouTitle: data.thankYouTitle || '',
        thankYouMessage: data.thankYouMessage || '',
        venueName: data.venueName || '',
        venueAddress: data.venueAddress || '',
        venueMapUrl: data.venueMapUrl || '',
        venueLat: data.venueLat || '',
        venueLng: data.venueLng || '',
      }));
  }, []);

  async function save(e) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('ok');
    } catch (e) {
      setStatus('err');
    }
  }

  if (!form) return <p className="empty-note">Loading...</p>;

  return (
    <form className="admin-edit-form" onSubmit={save} style={{ maxWidth: 460 }}>
      <label>Groom&apos;s Name</label>
      <input value={form.groomName} onChange={(e) => setForm({ ...form, groomName: e.target.value })} />
      <label>Bride&apos;s Name</label>
      <input value={form.brideName} onChange={(e) => setForm({ ...form, brideName: e.target.value })} />
      <label>Tagline</label>
      <textarea value={form.taglineEn} onChange={(e) => setForm({ ...form, taglineEn: e.target.value })} />
      <label>Hero Date Chip 1 — Label</label>
      <input value={form.heroDate1Label} onChange={(e) => setForm({ ...form, heroDate1Label: e.target.value })} />
      <label>Hero Date Chip 1 — Value</label>
      <input value={form.heroDate1Value} onChange={(e) => setForm({ ...form, heroDate1Value: e.target.value })} />
      <label>Hero Date Chip 2 — Label</label>
      <input value={form.heroDate2Label} onChange={(e) => setForm({ ...form, heroDate2Label: e.target.value })} />
      <label>Hero Date Chip 2 — Value</label>
      <input value={form.heroDate2Value} onChange={(e) => setForm({ ...form, heroDate2Value: e.target.value })} />
      <label>Main Countdown Target (date &amp; time)</label>
      <input type="datetime-local" value={form.countdownTarget} onChange={(e) => setForm({ ...form, countdownTarget: e.target.value })} />
      <label>Thank You Note — Title</label>
      <input value={form.thankYouTitle} onChange={(e) => setForm({ ...form, thankYouTitle: e.target.value })} />
      <label>Thank You Note — Message</label>
      <textarea value={form.thankYouMessage} onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })} />
      <label>Venue Name</label>
      <input value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
      <label>Venue Address</label>
      <input value={form.venueAddress} onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} />
      <label>Google Maps Link (for the &quot;Open in Google Maps&quot; button)</label>
      <input value={form.venueMapUrl} onChange={(e) => setForm({ ...form, venueMapUrl: e.target.value })} />
      <label>Venue Latitude (for map preview — copy from the Google Maps URL)</label>
      <input value={form.venueLat} onChange={(e) => setForm({ ...form, venueLat: e.target.value })} />
      <label>Venue Longitude (for map preview — copy from the Google Maps URL)</label>
      <input value={form.venueLng} onChange={(e) => setForm({ ...form, venueLng: e.target.value })} />
      <button type="submit" className="btn" style={{ marginTop: 16 }}>Save Changes</button>
      {status === 'saving' && <p className="form-msg">Saving...</p>}
      {status === 'ok' && <p className="form-msg ok">Saved!</p>}
      {status === 'err' && <p className="form-msg err">Something went wrong.</p>}
    </form>
  );
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('rsvps');

  function unlock() {
    if (pin !== PASSCODE) {
      setErr('Incorrect passcode.');
      return;
    }
    setErr('');
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 420, margin: '90px auto', padding: '0 20px' }}>
        <div className="rsvp-card">
          <h2 className="sec-title-en" style={{ textAlign: 'center' }}>Couple&apos;s Dashboard</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: '10px 0 20px' }}>
            Enter the passcode to manage your wedding site.
          </p>
          <div className="pin-row">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && unlock()}
              placeholder="Passcode"
            />
            <button className="btn" style={{ width: 'auto' }} onClick={unlock}>Unlock</button>
          </div>
          {err && <p className="form-msg err">{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px 60px' }}>
      <h2 className="sec-title-en">Couple&apos;s Dashboard</h2>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'rsvps' ? 'active' : ''}`} onClick={() => setTab('rsvps')}>RSVPs</button>
        <button className={`admin-tab ${tab === 'wishes' ? 'active' : ''}`} onClick={() => setTab('wishes')}>Guest Wishes</button>
        <button className={`admin-tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>Wedding Schedule</button>
        <button className={`admin-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Site Content</button>
      </div>

      <div style={{ marginTop: 24 }}>
        {tab === 'rsvps' && <RsvpTab />}
        {tab === 'wishes' && <WishesTab passcode={pin} />}
        {tab === 'schedule' && <ScheduleTab passcode={pin} />}
        {tab === 'settings' && <SettingsTab passcode={pin} />}
      </div>
    </div>
  );
}