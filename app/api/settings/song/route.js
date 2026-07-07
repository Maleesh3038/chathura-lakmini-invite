import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isValidPasscode } from '@/lib/checkPasscode';

async function getSettingsContent() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('content')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data?.content || {};
}

export async function POST(request) {
  try {
    const passcode = request.headers.get('x-admin-passcode') || '';
    if (!isValidPasscode(passcode)) {
      return Response.json({ ok: false, error: 'Invalid passcode.' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.songUrl) {
      return Response.json({ ok: false, error: 'Missing songUrl.' }, { status: 400 });
    }

    const content = await getSettingsContent();
    const { error } = await supabaseAdmin
      .from('settings')
      .update({ content: { ...content, songUrl: body.songUrl } })
      .eq('id', 1);
    if (error) throw error;

    return Response.json({ ok: true, songUrl: body.songUrl });
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

    const content = await getSettingsContent();
    delete content.songUrl;
    const { error } = await supabaseAdmin
      .from('settings')
      .update({ content })
      .eq('id', 1);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}