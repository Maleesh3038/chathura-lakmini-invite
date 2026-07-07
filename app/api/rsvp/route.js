import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('rsvps')
    .select('*')
    .order('submitted_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = data.map((r) => ({
    name: r.name,
    phone: r.phone,
    attending: r.attending,
    guests: r.guests,
    message: r.message,
    source: r.source || 'link',
    submittedAt: r.submitted_at,
  }));
  return Response.json(mapped);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const passcode = request.headers.get('x-admin-passcode') || '';
    const isAdmin = isValidPasscode(passcode);

    if (!body.name || !body.attending) {
      return Response.json({ ok: false, error: 'Name and attending status are required.' }, { status: 400 });
    }
    if (!isAdmin && !body.phone) {
      return Response.json({ ok: false, error: 'Phone number is required.' }, { status: 400 });
    }

    const phone = body.phone ? String(body.phone).replace(/\s+/g, '') : null;
    const source = isAdmin && body.source === 'manual' ? 'manual' : 'link';

    const payload = {
      name: String(body.name).slice(0, 80),
      attending: body.attending,
      guests: body.guests || 1,
      message: body.message ? String(body.message).slice(0, 600) : null,
      submitted_at: new Date().toISOString(),
      source,
    };

    let error;
    if (phone) {
      ({ error } = await supabaseAdmin.from('rsvps').upsert({ ...payload, phone }, { onConflict: 'phone' }));
    } else {
      ({ error } = await supabaseAdmin.from('rsvps').insert(payload));
    }
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}