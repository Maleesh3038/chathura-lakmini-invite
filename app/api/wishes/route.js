import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

function adminPasscode(request) {
  return request.headers.get('x-admin-passcode') || '';
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wantAll = searchParams.get('all') === 'true';
  const isAdmin = wantAll && isValidPasscode(adminPasscode(request));

  let query = supabaseAdmin.from('wishes').select('*').order('submitted_at', { ascending: false });
  if (!isAdmin) {
    query = query.eq('approved', true);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = data.map((w) => ({
    id: w.id,
    name: w.name,
    message: w.message,
    media: Array.isArray(w.media) && w.media.length ? w.media : (w.photo_url ? [{ url: w.photo_url, type: 'image' }] : []),
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
    const media = Array.isArray(body.media) ? body.media.slice(0, 10) : [];

    const { error } = await supabaseAdmin.from('wishes').insert({
      name: String(body.name).slice(0, 80),
      message: String(body.message).slice(0, 600),
      media,
      approved: false,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!isValidPasscode(adminPasscode(request))) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.id) return Response.json({ ok: false, error: 'Missing id.' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('wishes')
      .update({ approved: !!body.approved })
      .eq('id', body.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!isValidPasscode(adminPasscode(request))) {
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