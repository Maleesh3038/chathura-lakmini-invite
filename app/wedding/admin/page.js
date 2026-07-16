'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Change this to something only you and your partner know.
// This must match the ADMIN_PASSCODE environment variable on the server
// (falls back to this same value if that env var isn't set).
const PASSCODE = 'poruwa2026';

function emptyGuestForm() {
  return { name: '', phone: '', attending: 'Yes', guests: 1, drinks: '', message: '' };
}

function RsvpTab({ passcode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [addStatus, setAddStatus] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [editRowError, setEditRowError] = useState('');
  const [filterAttending, setFilterAttending] = useState('all');
  const [filterDrinks, setFilterDrinks] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addGuest(e) {
    e.preventDefault();
    setAddStatus('saving');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify({ ...guestForm, source: 'manual' }),
      });
      if (!res.ok) throw new Error('failed');
      setAddStatus('ok');
      setGuestForm(emptyGuestForm());
      load();
      setTimeout(() => {
        setShowAdd(false);
        setAddStatus(null);
      }, 800);
    } catch (err) {
      setAddStatus('err');
    }
  }

  async function removeGuest(id) {
    if (!confirm('Delete this guest entry permanently?')) return;
    await fetch('/api/rsvp', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEditRow(r) {
    setEditingRowId(r.id);
    setEditRow({
      name: r.name || '',
      phone: r.phone || '',
      attending: r.attending || 'Yes',
      guests: r.guests ?? 1,
      drinks: r.drinks || '',
      tableNumber: r.tableNumber || '',
      message: r.message || '',
    });
    setEditRowError('');
  }

  function cancelEditRow() {
    setEditingRowId(null);
    setEditRowError('');
  }

  async function saveRow(id) {
    setEditRowError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify({ id, ...editRow }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Save failed (${res.status}). Did you run MIGRATION.sql in Supabase?`);
      }
      setEditingRowId(null);
      load();
    } catch (err) {
      setEditRowError(err.message);
    }
  }

  function exportToExcel() {
    const headers = ['Name', 'Phone', 'Attending', 'Guests', 'Drinks', 'Table', 'Source', 'Message', 'Date'];
    const rows = filteredData.map((r) => [
      r.name || '',
      r.phone || '',
      r.attending || '',
      r.guests ?? '',
      r.drinks || '',
      r.tableNumber || '',
      r.source === 'manual' ? 'Manual' : 'Link',
      (r.message || '').replace(/\r?\n/g, ' '),
      r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '',
    ]);
    const escapeCell = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-rsvps.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const total = data.length;
  const yes = data.filter((r) => r.attending === 'Yes').length;
  const no = data.filter((r) => r.attending === 'No').length;
  const guests = data
    .filter((r) => r.attending === 'Yes')
    .reduce((sum, r) => sum + (Number(r.guests) || 0), 0);
  const manualCount = data.filter((r) => r.source === 'manual').length;
  const drinksYes = data.filter((r) => r.drinks === 'Yes').length;

  const filteredData = data.filter((r) => {
    if (filterAttending !== 'all' && r.attending !== filterAttending) return false;
    if (filterDrinks === 'unset') {
      if (r.drinks) return false;
    } else if (filterDrinks !== 'all' && r.drinks !== filterDrinks) return false;
    if (filterSource !== 'all' && (r.source || 'link') !== filterSource) return false;
    return true;
  });

  const inputStyle = { width: '100%', minWidth: 70, padding: '4px 6px', fontSize: 12.5 };

  return (
    <div>
      <div className="stat-row">
        <div className="stat"><span className="stat-num">{total}</span><span className="stat-lab">Responses</span></div>
        <div className="stat"><span className="stat-num">{yes}</span><span className="stat-lab">Attending</span></div>
        <div className="stat"><span className="stat-num">{no}</span><span className="stat-lab">Declined</span></div>
        <div className="stat"><span className="stat-num">{guests}</span><span className="stat-lab">Total Guests</span></div>
        <div className="stat"><span className="stat-num">{drinksYes}</span><span className="stat-lab">Drinks: Yes</span></div>
        <div className="stat"><span className="stat-num">{manualCount}</span><span className="stat-lab">Manually Added</span></div>
      </div>

      <div className="admin-item-actions" style={{ marginBottom: 14 }}>
        {!showAdd && <button className="btn" onClick={() => setShowAdd(true)}>+ Add Guest Manually</button>}
        <button className="btn-small" onClick={exportToExcel} disabled={filteredData.length === 0}>⬇ Export to Excel</button>
      </div>

      <div className="admin-filter-bar">
        <select className="admin-filter-select" value={filterAttending} onChange={(e) => setFilterAttending(e.target.value)}>
          <option value="all">All — Attending</option>
          <option value="Yes">Attending: Yes</option>
          <option value="No">Attending: No</option>
        </select>
        <select className="admin-filter-select" value={filterDrinks} onChange={(e) => setFilterDrinks(e.target.value)}>
          <option value="all">All — Drinks</option>
          <option value="Yes">Drinks: Yes</option>
          <option value="No">Drinks: No</option>
          <option value="unset">Drinks: Not set</option>
        </select>
        <select className="admin-filter-select" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="all">All — Source</option>
          <option value="link">Source: Link</option>
          <option value="manual">Source: Manual</option>
        </select>
        {(filterAttending !== 'all' || filterDrinks !== 'all' || filterSource !== 'all') && (
          <button
            type="button"
            className="btn-small"
            onClick={() => { setFilterAttending('all'); setFilterDrinks('all'); setFilterSource('all'); }}
          >
            ✕ Clear Filters
          </button>
        )}
        <span className="admin-filter-count">
          Showing {filteredData.length} of {total}
        </span>
      </div>

      {showAdd && (
        <form className="admin-edit-form" onSubmit={addGuest} style={{ marginBottom: 20 }}>
          <input required value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} placeholder="Guest Name" />
          <input value={guestForm.phone} onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })} placeholder="Phone (optional)" />
          <select value={guestForm.attending} onChange={(e) => setGuestForm({ ...guestForm, attending: e.target.value })}>
            <option value="Yes">Attending</option>
            <option value="No">Declined</option>
          </select>
          <input type="number" min="1" max="20" value={guestForm.guests} onChange={(e) => setGuestForm({ ...guestForm, guests: e.target.value })} placeholder="Number of Guests" />
          <select value={guestForm.drinks} onChange={(e) => setGuestForm({ ...guestForm, drinks: e.target.value })}>
            <option value="">Drinks? — not set</option>
            <option value="Yes">Drinks: Yes</option>
            <option value="No">Drinks: No</option>
          </select>
          <input value={guestForm.message} onChange={(e) => setGuestForm({ ...guestForm, message: e.target.value })} placeholder="Note (optional)" />
          <div className="admin-item-actions">
            <button type="submit" className="btn-small btn-approve">Add Guest</button>
            <button type="button" className="btn-small" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
          {addStatus === 'ok' && <p className="form-msg ok">Guest added!</p>}
          {addStatus === 'err' && <p className="form-msg err">Something went wrong.</p>}
        </form>
      )}

      {loading ? (
        <p className="empty-note">Loading...</p>
      ) : total === 0 ? (
        <p className="empty-note">No RSVPs yet. Once guests respond, they&apos;ll show up here.</p>
      ) : filteredData.length === 0 ? (
        <p className="empty-note">No RSVPs match the current filters.</p>
      ) : (
        <div className="table-scroll">
          <table className="rsvp-table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Attending</th><th>Guests</th><th>Drinks</th><th>Table</th><th>Source</th><th>Message</th><th>Date</th><th>Actions</th></tr>
            </thead>
          <tbody>
            {filteredData.slice().reverse().map((r) => {
              const isEditing = editingRowId === r.id;
              return (
                <tr key={r.id}>
                  <td>
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} />
                    ) : (
                      r.name || '—'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.phone} onChange={(e) => setEditRow({ ...editRow, phone: e.target.value })} />
                    ) : (
                      r.phone || '—'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select style={inputStyle} value={editRow.attending} onChange={(e) => setEditRow({ ...editRow, attending: e.target.value })}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      r.attending || '—'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input type="number" min="1" max="20" style={{ ...inputStyle, minWidth: 50 }} value={editRow.guests} onChange={(e) => setEditRow({ ...editRow, guests: e.target.value })} />
                    ) : (
                      r.guests ?? '—'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select style={inputStyle} value={editRow.drinks} onChange={(e) => setEditRow({ ...editRow, drinks: e.target.value })}>
                        <option value="">—</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      r.drinks || '—'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input style={{ ...inputStyle, minWidth: 50 }} value={editRow.tableNumber} onChange={(e) => setEditRow({ ...editRow, tableNumber: e.target.value })} placeholder="e.g. 12" />
                    ) : (
                      r.tableNumber || '—'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${r.source === 'manual' ? 'badge-pending' : 'badge-approved'}`}>
                      {r.source === 'manual' ? 'Manual' : 'Link'}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.message} onChange={(e) => setEditRow({ ...editRow, message: e.target.value })} placeholder="Note" />
                    ) : (
                      r.message || '—'
                    )}
                  </td>
                  <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                  <td>
                    {isEditing ? (
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-small btn-approve" onClick={() => saveRow(r.id)}>Save</button>
                          <button className="btn-small" onClick={cancelEditRow}>Cancel</button>
                        </span>
                        {editRowError && <span style={{ fontSize: 11.5, color: '#b9695f' }}>{editRowError}</span>}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-small" onClick={() => startEditRow(r)}>Edit</button>
                        <button className="btn-small btn-delete" onClick={() => removeGuest(r.id)}>Delete</button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
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

// Schedule dates are stored as absolute UTC instants in Postgres. This
// converts one back to a Sri Lanka (+05:30) wall-clock string suitable for
// an <input type="datetime-local">, so the edit form shows the time the
// couple actually meant instead of the raw UTC value.
function toSriLankaDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const shifted = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
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
      date: ev.date ? toSriLankaDatetimeLocal(ev.date) : '',
      direction: ev.direction || '',
      note: ev.note || '',
      sortOrder: ev.sortOrder ?? 0,
    });
  }

  async function saveEdit(id) {
    // The <input type="datetime-local"> value has no timezone info. It's the
    // couple's local time (Sri Lanka, +05:30), so we must attach that offset
    // before saving — otherwise Postgres stores it as UTC and every displayed
    // time on the public site ends up shifted 5.5 hours later than intended.
    await fetch('/api/schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ id, ...editForm, date: editForm.date ? `${editForm.date}:00+05:30` : null }),
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
      body: JSON.stringify({ ...newForm, date: newForm.date ? `${newForm.date}:00+05:30` : null, sortOrder: events.length }),
    });
    setNewForm(emptyEventForm());
    setShowAdd(false);
    load();
  }

  if (loading) return <p className="empty-note">Loading...</p>;

  return (
    <div>
      <div className="admin-list">
        {events.map((ev, idx) => (
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
                  <span className="admin-item-num">{idx + 1}</span>
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

function MusicUploadSection({ passcode }) {
  const [songUrl, setSongUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSongUrl(data.songUrl || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      if (file.size > 15 * 1024 * 1024) {
        throw new Error('File is too large (max 15MB).');
      }
      const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
      const fileName = `site-song-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('wish-photos')
        .upload(fileName, file, { contentType: file.type || 'audio/mpeg' });
      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage.from('wish-photos').getPublicUrl(fileName);
      const newSongUrl = data.publicUrl;

      const res = await fetch('/api/settings/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify({ songUrl: newSongUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not save song.');
      setSongUrl(newSongUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm('Remove the background song?')) return;
    await fetch('/api/settings/song', {
      method: 'DELETE',
      headers: { 'x-admin-passcode': passcode },
    });
    setSongUrl(null);
  }

  return (
    <div className="admin-edit-form" style={{ maxWidth: 460, marginBottom: 28 }}>
      <label>Background Music</label>
      {loading ? (
        <p className="empty-note">Loading...</p>
      ) : songUrl ? (
        <div>
          <audio controls src={songUrl} style={{ width: '100%', marginBottom: 10 }} />
          <div className="admin-item-actions">
            <label className="btn-small" style={{ cursor: 'pointer' }}>
              Replace Song
              <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <button type="button" className="btn-small btn-delete" onClick={handleRemove}>Remove</button>
          </div>
        </div>
      ) : (
        <label className="photo-drop-modern" style={{ cursor: 'pointer' }}>
          <span className="photo-drop-icon">🎵</span>
          <span className="photo-drop-text">{uploading ? 'Uploading...' : 'Choose a song'}</span>
          <span className="photo-drop-subtext">MP3 file, up to 15MB — plays when guests tap &quot;You&apos;re Invited&quot;</span>
          <input type="file" accept="audio/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
        </label>
      )}
      {error && <p className="form-msg err">{error}</p>}
    </div>
  );
}

const HEADING_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Marcellus', 'EB Garamond', 'Cinzel', 'Prata'];
const BODY_FONTS = ['Poppins', 'Lato', 'Inter', 'Nunito Sans', 'Work Sans', 'Mulish'];

function ThemeSection({ passcode }) {
  const [theme, setTheme] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setTheme({
        themeGold: data.themeGold || '#b8863f',
        themeGoldBright: data.themeGoldBright || '#a2701f',
        themeGoldGlow: data.themeGoldGlow || '#e7bd6a',
        themeRose: data.themeRose || '#b9695f',
        themeBgDeep: data.themeBgDeep || '#faf4e9',
        themeInk: data.themeInk || '#3d2f22',
        themeHeadingFont: data.themeHeadingFont || 'Cormorant Garamond',
        themeBodyFont: data.themeBodyFont || 'Poppins',
      }));
  }, []);

  async function save(e) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify(theme),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Failed');
      setStatus('ok');
    } catch (err) {
      setStatus('err');
    }
  }

  if (!theme) return <p className="empty-note">Loading...</p>;

  return (
    <form className="admin-edit-form" onSubmit={save} style={{ maxWidth: 460, marginBottom: 28 }}>
      <label>Site Colors &amp; Fonts</label>
      <div className="theme-color-grid">
        <div className="theme-color-item">
          <span>Gold</span>
          <input type="color" value={theme.themeGold} onChange={(e) => setTheme({ ...theme, themeGold: e.target.value })} />
        </div>
        <div className="theme-color-item">
          <span>Gold Bright</span>
          <input type="color" value={theme.themeGoldBright} onChange={(e) => setTheme({ ...theme, themeGoldBright: e.target.value })} />
        </div>
        <div className="theme-color-item">
          <span>Gold Glow</span>
          <input type="color" value={theme.themeGoldGlow} onChange={(e) => setTheme({ ...theme, themeGoldGlow: e.target.value })} />
        </div>
        <div className="theme-color-item">
          <span>Accent</span>
          <input type="color" value={theme.themeRose} onChange={(e) => setTheme({ ...theme, themeRose: e.target.value })} />
        </div>
        <div className="theme-color-item">
          <span>Background</span>
          <input type="color" value={theme.themeBgDeep} onChange={(e) => setTheme({ ...theme, themeBgDeep: e.target.value })} />
        </div>
        <div className="theme-color-item">
          <span>Text</span>
          <input type="color" value={theme.themeInk} onChange={(e) => setTheme({ ...theme, themeInk: e.target.value })} />
        </div>
      </div>

      <label>Heading Font</label>
      <select value={theme.themeHeadingFont} onChange={(e) => setTheme({ ...theme, themeHeadingFont: e.target.value })}>
        {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      <label>Body Font</label>
      <select value={theme.themeBodyFont} onChange={(e) => setTheme({ ...theme, themeBodyFont: e.target.value })}>
        {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      <button type="submit" className="btn" style={{ marginTop: 16 }}>Save Theme</button>
      {status === 'saving' && <p className="form-msg">Saving...</p>}
      {status === 'ok' && <p className="form-msg ok">Saved! Refresh the main site to see it.</p>}
      {status === 'err' && <p className="form-msg err">Something went wrong.</p>}
    </form>
  );
}

function SettingsTab({ passcode }) {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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
        countdownTarget: data.countdownTarget ? data.countdownTarget.slice(0, 10) : '',
        ceremonyTime: data.ceremonyTime || '',
        thankYouTitle: data.thankYouTitle || '',
        thankYouMessage: data.thankYouMessage || '',
        venueName: data.venueName || '',
        venueHallName: data.venueHallName || '',
        venueAddress: data.venueAddress || '',
        venueMapUrl: data.venueMapUrl || '',
        venueLat: data.venueLat || '',
        venueLng: data.venueLng || '',
      }));
  }, []);

  async function save(e) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      setStatus('ok');
    } catch (err) {
      setStatus('err');
      setErrorMsg(err.message);
    }
  }

  if (!form) return <p className="empty-note">Loading...</p>;

  return (
    <>
      <MusicUploadSection passcode={passcode} />
      <ThemeSection passcode={passcode} />
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
        <label>Main Countdown Target (date)</label>
        <input type="date" value={form.countdownTarget} onChange={(e) => setForm({ ...form, countdownTarget: e.target.value })} />
        <label>Ceremony Time (shown in the Save the Date card)</label>
        <input value={form.ceremonyTime} onChange={(e) => setForm({ ...form, ceremonyTime: e.target.value })} placeholder="e.g. 9:24 AM Onwards" />
        <label>Thank You Note — Title</label>
        <input value={form.thankYouTitle} onChange={(e) => setForm({ ...form, thankYouTitle: e.target.value })} />
        <label>Thank You Note — Message</label>
        <textarea value={form.thankYouMessage} onChange={(e) => setForm({ ...form, thankYouMessage: e.target.value })} />
        <label>Venue Name</label>
        <input value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
        <label>Hall Name (e.g. Lotus Ballroom)</label>
        <input value={form.venueHallName} onChange={(e) => setForm({ ...form, venueHallName: e.target.value })} />
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
        {status === 'err' && <p className="form-msg err">{errorMsg || 'Something went wrong.'}</p>}
      </form>
    </>
  );
}

const DEFAULT_WA_MESSAGE =
  "💌 We're getting married! We would be so honoured to have you celebrate this special day with us. Your presence would mean the world to us 🌸 Open your invitation below 👇\n{link}";

function GuestLinksTab() {
  const [guestName, setGuestName] = useState('');
  const [waMessage, setWaMessage] = useState(DEFAULT_WA_MESSAGE);
  const [editingMessage, setEditingMessage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const trimmedName = guestName.trim();
  const link = trimmedName ? `${origin}/wedding?to=${encodeURIComponent(trimmedName)}` : '';
  const finalMessage = link ? waMessage.replace('{link}', link) : waMessage;

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      // ignore
    }
  }

  function shareOnWhatsApp() {
    if (!link) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(finalMessage)}`, '_blank');
  }

  return (
    <div>
      <div className="admin-edit-form" style={{ maxWidth: 520 }}>
        <label>💌 Generate Guest Link</label>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '2px 0 10px' }}>
          Type a guest&apos;s name to generate a personalized invitation link — their name
          will show on a &quot;Dear [Name]&quot; welcome screen for a few seconds when they
          open it, and auto-fill in the RSVP form.
        </p>
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="e.g. Amara &amp; Family"
        />

        {trimmedName && (
          <>
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                background: 'var(--bg-panel-2)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                fontSize: 13,
                wordBreak: 'break-all',
                color: 'var(--gold-bright)',
              }}
            >
              {link}
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ marginTop: 0 }}>📱 WhatsApp Message</label>
              <button type="button" className="btn-small" onClick={() => setEditingMessage(!editingMessage)}>
                {editingMessage ? 'Done' : '✎ Edit'}
              </button>
            </div>
            {editingMessage ? (
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                style={{ minHeight: 90 }}
              />
            ) : (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(95,143,90,0.08)',
                  border: '1px solid rgba(95,143,90,0.25)',
                  borderRadius: 6,
                  fontSize: 13,
                  color: 'var(--ink)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {finalMessage}
              </div>
            )}

            <div className="admin-item-actions" style={{ marginTop: 14 }}>
              <button type="button" className="btn-small" onClick={copyLink}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <button type="button" className="btn-small btn-approve" onClick={shareOnWhatsApp}>
                ↗ Share on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
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
      <div className="admin-shell" style={{ maxWidth: 420, margin: '90px auto', padding: '0 20px' }}>
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
    <div className="admin-shell" style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px 60px' }}>
      <h2 className="sec-title-en">Couple&apos;s Dashboard</h2>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'rsvps' ? 'active' : ''}`} onClick={() => setTab('rsvps')}>RSVPs</button>
        <button className={`admin-tab ${tab === 'wishes' ? 'active' : ''}`} onClick={() => setTab('wishes')}>Guest Wishes</button>
        <button className={`admin-tab ${tab === 'schedule' ? 'active' : ''}`} onClick={() => setTab('schedule')}>Wedding Schedule</button>
        <button className={`admin-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Site Content</button>
        <button className={`admin-tab ${tab === 'guestlinks' ? 'active' : ''}`} onClick={() => setTab('guestlinks')}>Guest Links</button>
      </div>

      <div style={{ marginTop: 24 }}>
        {tab === 'rsvps' && <RsvpTab passcode={pin} />}
        {tab === 'wishes' && <WishesTab passcode={pin} />}
        {tab === 'schedule' && <ScheduleTab passcode={pin} />}
        {tab === 'settings' && <SettingsTab passcode={pin} />}
        {tab === 'guestlinks' && <GuestLinksTab />}
      </div>
    </div>
  );
}
