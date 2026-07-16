import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Public endpoint — returns name, phone, and table number for matching rows.
// Phone is included so guests/couple can tell apart duplicate names in the
// suggestions list. This is a small guest list for a private event; there is
// no admin passcode on this route since it's meant to be used by guests.
export async function POST(request) {
  try {
    const body = await request.json();
    const query = (body.query || '').toString().trim();
    if (!query) {
      return Response.json({ ok: false, error: 'Please enter a name or phone number.' }, { status: 400 });
    }

    const cleanedPhone = query.replace(/\s+/g, '');
    const limit = body.suggest ? 6 : 5;

    // Prefix match on either name or phone, so typing just the first
    // letter/digit already surfaces matching guests as suggestions.
    const { data, error } = await supabaseAdmin
      .from('rsvps')
      .select('name, table_number, phone')
      .or(`name.ilike.${query}%,phone.ilike.${cleanedPhone}%`)
      .limit(limit);
    if (error) throw error;

    const mapped = (data || []).map((r) => ({
      name: r.name,
      phone: r.phone || null,
      tableNumber: r.table_number || null,
    }));

    return Response.json({ ok: true, results: mapped });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
