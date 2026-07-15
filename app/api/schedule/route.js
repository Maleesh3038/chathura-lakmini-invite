import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

function checkAdmin(request) {
  return isValidPasscode(request.headers.get('x-admin-passcode') || '');
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('schedule')
    .select('*')
    .order('event_date', { ascending: true, nullsFirst: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = data.map((e) => ({
    id: e.id,
    en: e.event_en,
    date: e.event_date,
    direction: e.dir_en,
    note: e.note,
    sortOrder: e.sort_order,
  }));
  return Response.json(mapped);
}

export async function POST(request) {
  try {
    if (!checkAdmin(request)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.en) {
      return Response.json({ ok: false, error: 'Event name is required.' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('schedule').insert({
      event_en: body.en,
      event_date: body.date || null,
      dir_en: body.direction || null,
      note: body.note || null,
      sort_order: body.sortOrder ?? 0,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!checkAdmin(request)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('schedule')
      .update({
        event_en: body.en,
        event_date: body.date || null,
        dir_en: body.direction || null,
        note: body.note || null,
        sort_order: body.sortOrder ?? 0,
      })
      .eq('id', body.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!checkAdmin(request)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });

    const { error } = await supabaseAdmin.from('schedule').delete().eq('id', body.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
