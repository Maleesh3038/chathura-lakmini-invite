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
            <tr><th>Name</th><th>Attending</th><th>Guests</th><th>Message</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data.slice().reverse().map((r, i) => (
              <tr key={i}>
                <td>{r.name || '—'}</td>
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

function WishesTab({ passcode }) {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="empty-note">Loading...</p>;
  if (wishes.length === 0) return <p className="empty-note">No wishes yet.</p>;

  return (
    <div className="admin-list">
      {wishes.map((w) => (
        <div key={w.id} className="admin-item">
          {w.photo && <img src={w.photo} className="admin-item-photo" alt="" />}
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
    </div>
  );
}

function emptyEventForm() {
  return { en: '', si: '', date: '', dirEn: '', dirSi: '', note: '', sortOrder: 0 };
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
      si: ev.si || '',
      date: ev.date ? ev.date.slice(0, 16) : '',
      dirEn: ev.dirEn || '',
      dirSi: ev.dirSi || '',
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
                <input value={editForm.en} onChange={(e) => setEditForm({ ...editForm, en: e.target.value })} placeholder="Event (English)" />
                <input value={editForm.si} onChange={(e) => setEditForm({ ...editForm, si: e.target.value })} placeholder="Event (Sinhala)" />
                <input type="datetime-local" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                <input value={editForm.dirEn} onChange={(e) => setEditForm({ ...editForm, dirEn: e.target.value })} placeholder="Direction (English)" />
                <input value={editForm.dirSi} onChange={(e) => setEditForm({ ...editForm, dirSi: e.target.value })} placeholder="Direction (Sinhala)" />
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
                  <p className="si">{ev.si}</p>
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
          <input required value={newForm.en} onChange={(e) => setNewForm({ ...newForm, en: e.target.value })} placeholder="Event (English)" />
          <input required value={newForm.si} onChange={(e) => setNewForm({ ...newForm, si: e.target.value })} placeholder="Event (Sinhala)" />
          <input type="datetime-local" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} />
          <input value={newForm.dirEn} onChange={(e) => setNewForm({ ...newForm, dirEn: e.target.value })} placeholder="Direction (English)" />
          <input value={newForm.dirSi} onChange={(e) => setNewForm({ ...newForm, dirSi: e.target.value })} placeholder="Direction (Sinhala)" />
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
        groomNameSi: data.groomNameSi || '',
        brideNameSi: data.brideNameSi || '',
        taglineEn: data.taglineEn || '',
        taglineSi: data.taglineSi || '',
        heroDate1Label: data.heroDate1Label || '',
        heroDate1Value: data.heroDate1Value || '',
        heroDate2Label: data.heroDate2Label || '',
        heroDate2Value: data.heroDate2Value || '',
        countdownTarget: data.countdownTarget ? data.countdownTarget.slice(0, 16) : '',
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
      <label>Groom&apos;s Name (English)</label>
      <input value={form.groomName} onChange={(e) => setForm({ ...form, groomName: e.target.value })} />
      <label>Bride&apos;s Name (English)</label>
      <input value={form.brideName} onChange={(e) => setForm({ ...form, brideName: e.target.value })} />
      <label>Groom&apos;s Name (Sinhala)</label>
      <input value={form.groomNameSi} onChange={(e) => setForm({ ...form, groomNameSi: e.target.value })} />
      <label>Bride&apos;s Name (Sinhala)</label>
      <input value={form.brideNameSi} onChange={(e) => setForm({ ...form, brideNameSi: e.target.value })} />
      <label>Tagline (English)</label>
      <textarea value={form.taglineEn} onChange={(e) => setForm({ ...form, taglineEn: e.target.value })} />
      <label>Tagline (Sinhala)</label>
      <textarea value={form.taglineSi} onChange={(e) => setForm({ ...form, taglineSi: e.target.value })} />
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