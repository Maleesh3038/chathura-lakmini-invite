import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get('event') || 'wedding';
  const all = searchParams.get('all') === 'true';
  const passcode = request.headers.get('x-admin-passcode') || '';

  let query = supabaseAdmin
    .from('wishes')
    .select('*')
    .eq('event_type', event)
    .order('submitted_at', { ascending: false });

  // Public visitors only ever see visible ("approved") wishes. The admin
  // dashboard passes ?all=true with the passcode to see hidden ones too.
  if (!(all && isValidPasscode(passcode))) {
    query = query.eq('approved', true);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = data.map((w) => ({
    id: w.id,
    name: w.name,
    message: w.message,
    media: (w.media && w.media.length ? w.media : (w.photo_url ? [{ url: w.photo_url, type: 'image' }] : [])),
    approved: w.approved,
    submittedAt: w.submitted_at,
  }));
  return Response.json(mapped);
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.message) {
      return Response.json({ ok: false, error: 'Name and message are required.' }, { status: 400 });
    }

    const eventType = body.event === 'homecoming' ? 'homecoming' : 'wedding';
    const media = Array.isArray(body.media) ? body.media.slice(0, 6) : [];

    const payload = {
      name: String(body.name).slice(0, 80),
      message: String(body.message).slice(0, 600),
      media,
      photo_url: media[0]?.url || null,
      // Wishes go live immediately — no admin approval needed. The couple
      // can still hide (or delete) anything inappropriate from the admin
      // dashboard afterwards.
      approved: true,
      submitted_at: new Date().toISOString(),
      event_type: eventType,
    };

    const { error } = await supabaseAdmin.from('wishes').insert(payload);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const passcode = request.headers.get('x-admin-passcode') || '';
    if (!isValidPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });

    const update = {};
    if (body.approved !== undefined) update.approved = !!body.approved;

    const { error } = await supabaseAdmin.from('wishes').update(update).eq('id', body.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const passcode = request.headers.get('x-admin-passcode') || '';
    if (!isValidPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });

    const { error } = await supabaseAdmin.from('wishes').delete().eq('id', body.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
