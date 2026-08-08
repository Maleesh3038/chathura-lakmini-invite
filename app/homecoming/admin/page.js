'use client';

import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

// This is a separate, dedicated guest list/admin for the Home Coming event,
// completely independent from the Wedding RSVP list — same passcode as the
// main admin dashboard, but change it here too if you'd like a different one.
const PASSCODE = 'poruwa2026';

const GUEST_CATEGORIES = [
  'At_the_coop',
  'At_the_hospital_1',
  'At_the_hospital_2',
  'At_the_School',
  'At_the_SchoolGrid',
  'At_the_university',
  'At_the_Village',
  'Ayya_Akka',
  'Band',
  'Friends_Amma',
  'Friends_Thaththa',
  'Other',
  'Photographers',
  'Relations_Amma',
  'Relations_Thaththa',
  'Saloon',
];

function emptyGuestForm() {
  return { name: '', phone: '', side: '', attending: 'Yes', guests: 1, drinks: '', category: '', message: '' };
}

function RsvpTab({ passcode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [guestForm, setGuestForm] = useState(emptyGuestForm());
  const [addStatus, setAddStatus] = useState(null);
  const [autoFilledMatch, setAutoFilledMatch] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRow, setEditRow] = useState({});
  const [editRowError, setEditRowError] = useState('');
  const [filterAttending, setFilterAttending] = useState('all');
  const [filterSide, setFilterSide] = useState('all');
  const [filterDrinks, setFilterDrinks] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [waMessageTemplate, setWaMessageTemplate] = useState(DEFAULT_WA_MESSAGE);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.waMessageTemplate) {
          setWaMessageTemplate(data.waMessageTemplate);
        }
      })
      .catch(() => {});
  }, []);

  function formatPhoneForWhatsApp(phone) {
    let p = (phone || '').replace(/[^\d+]/g, '');
    if (!p) return '';
    if (p.startsWith('+')) return p.slice(1);
    if (p.startsWith('0')) return '94' + p.slice(1);
    return p;
  }

  function shareRowOnWhatsApp(r) {
    const guestLink = `${origin}/homecoming?to=${encodeURIComponent(r.name || '')}`;
    const message = waMessageTemplate.includes('{link}')
      ? waMessageTemplate.replace('{link}', guestLink)
      : `${waMessageTemplate}\n\n${guestLink}`;
    const waPhone = formatPhoneForWhatsApp(r.phone);
    const url = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/rsvp?event=homecoming');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleManualPhoneChange(value) {
    const cleaned = value.replace(/[\s\-()]/g, '');
    const match = cleaned.length >= 7
      ? data.find((r) => (r.phone || '').replace(/[\s\-()]/g, '') === cleaned)
      : null;

    if (match) {
      setGuestForm({
        name: match.name || '',
        phone: value,
        side: match.side || '',
        attending: match.attending || 'Yes',
        guests: match.guests ?? 1,
        drinks: match.drinks || '',
        category: match.category || '',
        message: match.message || '',
      });
      setAutoFilledMatch(true);
    } else {
      setGuestForm((prev) => ({ ...prev, phone: value }));
      setAutoFilledMatch(false);
    }
  }

  async function addGuest(e) {
    e.preventDefault();
    setAddStatus('saving');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
        body: JSON.stringify({ ...guestForm, source: 'manual', event: 'homecoming' }),
      });
      if (!res.ok) throw new Error('failed');
      setAddStatus('ok');
      setGuestForm(emptyGuestForm());
      setAutoFilledMatch(false);
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
      side: r.side || '',
      attending: r.attending || 'Yes',
      guests: r.guests ?? 1,
      drinks: r.drinks || '',
      category: r.category || '',
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
    const headers = ['Name', 'Phone', 'Side', 'Attending', 'Guests', 'Drinks', 'Category', 'Table', 'Source', 'Message', 'Date'];
    const rows = sortedData.map((r) => [
      r.name || '',
      r.phone || '',
      r.side === 'Bride' ? "Bride's Side" : r.side === 'Groom' ? "Groom's Side" : '',
      r.attending || '',
      r.guests ?? '',
      r.drinks || '',
      r.category || '',
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
  const brideSideCount = data.filter((r) => r.side === 'Bride').length;
  const groomSideCount = data.filter((r) => r.side === 'Groom').length;

  const filteredData = data.filter((r) => {
    if (filterAttending !== 'all' && r.attending !== filterAttending) return false;
    if (filterSide === 'unset') {
      if (r.side) return false;
    } else if (filterSide !== 'all' && r.side !== filterSide) return false;
    if (filterDrinks === 'unset') {
      if (r.drinks) return false;
    } else if (filterDrinks !== 'all' && r.drinks !== filterDrinks) return false;
    if (filterCategory === 'unset') {
      if (r.category) return false;
    } else if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterSource !== 'all' && (r.source || 'link') !== filterSource) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q && !(r.name || '').toLowerCase().includes(q) && !(r.phone || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const sortedData = filteredData.slice().sort((a, b) => {
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'category-asc') return (a.category || '').localeCompare(b.category || '');
    if (sortBy === 'oldest') return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
    // newest first (default)
    return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pagedData = sortedData.slice(pageStart, pageStart + pageSize);

  const inputStyle = { width: '100%', minWidth: 70, padding: '4px 6px', fontSize: 12.5 };

  return (
    <div>
      <div className="stat-row">
        <div className="stat"><span className="stat-num">{total}</span><span className="stat-lab">Responses</span></div>
        <div className="stat"><span className="stat-num">{yes}</span><span className="stat-lab">Attending</span></div>
        <div className="stat"><span className="stat-num">{no}</span><span className="stat-lab">Declined</span></div>
        <div className="stat"><span className="stat-num">{guests}</span><span className="stat-lab">Total Guests</span></div>
        <div className="stat"><span className="stat-num">{brideSideCount}</span><span className="stat-lab">Bride&apos;s Side</span></div>
        <div className="stat"><span className="stat-num">{groomSideCount}</span><span className="stat-lab">Groom&apos;s Side</span></div>
        <div className="stat"><span className="stat-num">{drinksYes}</span><span className="stat-lab">Drinks: Yes</span></div>
        <div className="stat"><span className="stat-num">{manualCount}</span><span className="stat-lab">Manually Added</span></div>
      </div>

      <div className="admin-item-actions" style={{ marginBottom: 14 }}>
        {!showAdd && <button className="btn" onClick={() => setShowAdd(true)}>+ Add Guest Manually</button>}
        <button className="btn-small" onClick={exportToExcel} disabled={filteredData.length === 0}>⬇ Export to Excel</button>
      </div>

      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-filter-search"
          placeholder="🔍 Search name or phone..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
        <select className="admin-filter-select" value={filterAttending} onChange={(e) => { setFilterAttending(e.target.value); setCurrentPage(1); }}>
          <option value="all">All — Attending</option>
          <option value="Yes">Attending: Yes</option>
          <option value="No">Attending: No</option>
        </select>
        <select className="admin-filter-select" value={filterSide} onChange={(e) => { setFilterSide(e.target.value); setCurrentPage(1); }}>
          <option value="all">All — Side</option>
          <option value="Bride">Bride&apos;s Side</option>
          <option value="Groom">Groom&apos;s Side</option>
          <option value="unset">Side: Not set</option>
        </select>
        <select className="admin-filter-select" value={filterDrinks} onChange={(e) => { setFilterDrinks(e.target.value); setCurrentPage(1); }}>
          <option value="all">All — Drinks</option>
          <option value="Yes">Drinks: Yes</option>
          <option value="No">Drinks: No</option>
          <option value="unset">Drinks: Not set</option>
        </select>
        <select className="admin-filter-select" value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}>
          <option value="all">All — Source</option>
          <option value="link">Source: Link</option>
          <option value="manual">Source: Manual</option>
        </select>
        <select className="admin-filter-select" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
          <option value="all">All — Category</option>
          {GUEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
          <option value="unset">Category: Not set</option>
        </select>
        <select className="admin-filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="name-asc">Sort: Name (A–Z)</option>
          <option value="name-desc">Sort: Name (Z–A)</option>
          <option value="category-asc">Sort: Category (A–Z)</option>
        </select>
        <select className="admin-filter-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
          <option value={30}>30 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        {(filterAttending !== 'all' || filterSide !== 'all' || filterDrinks !== 'all' || filterCategory !== 'all' || filterSource !== 'all' || searchQuery) && (
          <button
            type="button"
            className="btn-small"
            onClick={() => { setFilterAttending('all'); setFilterSide('all'); setFilterDrinks('all'); setFilterCategory('all'); setFilterSource('all'); setSearchQuery(''); setCurrentPage(1); }}
          >
            ✕ Clear Filters
          </button>
        )}
        <span className="admin-filter-count">
          Showing {pagedData.length ? pageStart + 1 : 0}–{pageStart + pagedData.length} of {filteredData.length}
        </span>
      </div>

      {showAdd && (
        <form className="admin-edit-form" onSubmit={addGuest} style={{ marginBottom: 20 }}>
          <input required value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} placeholder="Guest Name" />
          <input value={guestForm.phone} onChange={(e) => handleManualPhoneChange(e.target.value)} placeholder="Phone (optional)" />
          <select value={guestForm.side} onChange={(e) => setGuestForm({ ...guestForm, side: e.target.value })}>
            <option value="">Side? — not set</option>
            <option value="Bride">Bride&apos;s Side</option>
            <option value="Groom">Groom&apos;s Side</option>
          </select>
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
          <select value={guestForm.category} onChange={(e) => setGuestForm({ ...guestForm, category: e.target.value })}>
            <option value="">Category — not set</option>
            {GUEST_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input value={guestForm.message} onChange={(e) => setGuestForm({ ...guestForm, message: e.target.value })} placeholder="Note (optional)" />
          <div className="admin-item-actions">
            <button type="submit" className="btn-small btn-approve">Add Guest</button>
            <button type="button" className="btn-small" onClick={() => { setShowAdd(false); setGuestForm(emptyGuestForm()); setAutoFilledMatch(false); }}>Cancel</button>
          </div>
          {autoFilledMatch && (
            <p className="form-msg" style={{ color: 'var(--gold-bright)' }}>
              ✓ Existing guest found — details auto-filled below. Edit anything you like, then save to update their RSVP.
            </p>
          )}
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
              <tr><th>#</th><th>Name</th><th>Phone</th><th>Side</th><th>Attending</th><th>Guests</th><th>Drinks</th><th>Category</th><th>Table</th><th>Source</th><th>Message</th><th>Date</th><th>Actions</th></tr>
            </thead>
          <tbody>
            {pagedData.map((r, idx) => {
              const isEditing = editingRowId === r.id;
              return (
                <tr key={r.id}>
                  <td data-label="#">{pageStart + idx + 1}</td>
                  <td data-label="Name">
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} />
                    ) : (
                      r.name || '—'
                    )}
                  </td>
                  <td data-label="Phone">
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.phone} onChange={(e) => setEditRow({ ...editRow, phone: e.target.value })} />
                    ) : (
                      r.phone || '—'
                    )}
                  </td>
                  <td data-label="Side">
                    {isEditing ? (
                      <select style={inputStyle} value={editRow.side} onChange={(e) => setEditRow({ ...editRow, side: e.target.value })}>
                        <option value="">—</option>
                        <option value="Bride">Bride</option>
                        <option value="Groom">Groom</option>
                      </select>
                    ) : (
                      r.side === 'Bride' ? "Bride's Side" : r.side === 'Groom' ? "Groom's Side" : '—'
                    )}
                  </td>
                  <td data-label="Attending">
                    {isEditing ? (
                      <select style={inputStyle} value={editRow.attending} onChange={(e) => setEditRow({ ...editRow, attending: e.target.value })}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      r.attending || '—'
                    )}
                  </td>
                  <td data-label="Guests">
                    {isEditing ? (
                      <input type="number" min="1" max="20" style={{ ...inputStyle, minWidth: 50 }} value={editRow.guests} onChange={(e) => setEditRow({ ...editRow, guests: e.target.value })} />
                    ) : (
                      r.guests ?? '—'
                    )}
                  </td>
                  <td data-label="Drinks">
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
                  <td data-label="Category">
                    {isEditing ? (
                      <select style={inputStyle} value={editRow.category} onChange={(e) => setEditRow({ ...editRow, category: e.target.value })}>
                        <option value="">—</option>
                        {GUEST_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    ) : (
                      r.category ? r.category.replace(/_/g, ' ') : '—'
                    )}
                  </td>
                  <td data-label="Table">
                    {isEditing ? (
                      <input style={{ ...inputStyle, minWidth: 50 }} value={editRow.tableNumber} onChange={(e) => setEditRow({ ...editRow, tableNumber: e.target.value })} placeholder="e.g. 12" />
                    ) : (
                      r.tableNumber || '—'
                    )}
                  </td>
                  <td data-label="Source">
                    <span className={`badge ${r.source === 'manual' ? 'badge-pending' : 'badge-approved'}`}>
                      {r.source === 'manual' ? 'Manual' : 'Link'}
                    </span>
                  </td>
                  <td data-label="Message">
                    {isEditing ? (
                      <input style={inputStyle} value={editRow.message} onChange={(e) => setEditRow({ ...editRow, message: e.target.value })} placeholder="Note" />
                    ) : (
                      r.message || '—'
                    )}
                  </td>
                  <td data-label="Date">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                  <td data-label="Actions">
                    {isEditing ? (
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-small btn-approve" onClick={() => saveRow(r.id)}>Save</button>
                          <button className="btn-small" onClick={cancelEditRow}>Cancel</button>
                        </span>
                        {editRowError && <span style={{ fontSize: 11.5, color: '#b9695f' }}>{editRowError}</span>}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn-small" onClick={() => startEditRow(r)}>Edit</button>
                        <button className="btn-small btn-delete" onClick={() => removeGuest(r.id)}>Delete</button>
                        <button className="btn-small btn-whatsapp" onClick={() => shareRowOnWhatsApp(r)} title="Share invitation link on WhatsApp">↗ WhatsApp</button>
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

      {!loading && filteredData.length > 0 && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn-small"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="admin-pagination-info">Page {safeCurrentPage} of {totalPages}</span>
          <button
            type="button"
            className="btn-small"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function HomecomingAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

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
          <h2 className="sec-title-en" style={{ textAlign: 'center' }}>Home Coming Dashboard</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: '10px 0 20px' }}>
            Enter the passcode to manage the Home Coming guest list.
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
    <div className="admin-shell" style={{ maxWidth: 1400, margin: '40px auto', padding: '0 20px 60px' }}>
      <h2 className="sec-title-en">Home Coming — Guest List</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 20px' }}>
        Separate from the Wedding guest list. Manage RSVPs, table numbers, and share invitation links for the Home Coming event.
      </p>
      <RsvpTab passcode={pin} />
    </div>
  );
}
