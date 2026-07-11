import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Public endpoint — intentionally returns ONLY name + table number for
// matching rows, never phone numbers or other guest data, since this is
// reachable by anyone on the public site (no admin passcode required).
export async function POST(request) {
  try {
    const body = await request.json();
    const query = (body.query || '').toString().trim();
    if (!query) {
      return Response.json({ ok: false, error: 'Please enter a name or phone number.' }, { status: 400 });
    }

    const cleanedPhone = query.replace(/\s+/g, '');
    const isPhoneLike = /^[0-9+]{6,}$/.test(cleanedPhone);

    let results = [];

    if (isPhoneLike) {
      const { data, error } = await supabaseAdmin
        .from('rsvps')
        .select('name, table_number, phone')
        .eq('phone', cleanedPhone)
        .limit(5);
      if (error) throw error;
      results = data || [];
    } else {
      const { data, error } = await supabaseAdmin
        .from('rsvps')
        .select('name, table_number')
        .ilike('name', `%${query}%`)
        .limit(5);
      if (error) throw error;
      results = data || [];
    }

    const mapped = results.map((r) => ({
      name: r.name,
      tableNumber: r.table_number || null,
    }));

    return Response.json({ ok: true, results: mapped });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
