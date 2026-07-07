import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data?.content || {});
}

export async function PUT(request) {
  try {
    const passcode = request.headers.get('x-admin-passcode') || '';
    if (!isValidPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('settings')
      .select('content')
      .eq('id', 1)
      .single();
    if (fetchError) throw fetchError;

    const merged = { ...(existing?.content || {}), ...body };

    const { error } = await supabaseAdmin
      .from('settings')
      .update({ content: merged })
      .eq('id', 1);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}