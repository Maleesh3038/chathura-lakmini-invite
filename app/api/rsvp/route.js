import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('rsvps')
    .select('*')
    .order('submitted_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const mapped = data.map((r) => ({
    name: r.name,
    attending: r.attending,
    guests: r.guests,
    message: r.message,
    submittedAt: r.submitted_at,
  }));
  return Response.json(mapped);
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.name || !body.attending) {
      return Response.json({ ok: false, error: 'Name and attending status required.' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('rsvps').insert({
      name: String(body.name).slice(0, 80),
      attending: body.attending,
      guests: body.guests || 1,
      message: body.message ? String(body.message).slice(0, 600) : null,
    });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}