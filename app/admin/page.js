'use client';

import { useState } from 'react';

// Change this to something only you and Lakmini know.
const PASSCODE = 'poruwa2026';

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  async function unlock() {
    if (pin !== PASSCODE) {
      setErr('Incorrect passcode.');
      return;
    }
    setErr('');
    setUnlocked(true);
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 420, margin: '90px auto', padding: '0 20px' }}>
        <div className="rsvp-card">
          <h2 className="sec-title-en" style={{ textAlign: 'center' }}>Couple&apos;s Dashboard</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: '10px 0 20px' }}>
            Enter the passcode to view RSVPs.
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

  const total = data.length;
  const yes = data.filter((r) => r.attending === 'Yes').length;
  const no = data.filter((r) => r.attending === 'No').length;
  const guests = data
    .filter((r) => r.attending === 'Yes')
    .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);

  return (
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px 60px' }}>
      <h2 className="sec-title-en">RSVP Dashboard</h2>
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