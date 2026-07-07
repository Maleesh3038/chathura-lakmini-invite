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

    const formData = await request.formData();
    const file = formData.get('song');
    if (!file) {
      return Response.json({ ok: false, error: 'No file provided.' }, { status: 400 });
    }
    if (file.size > 15 * 1024 * 1024) {
      return Response.json({ ok: false, error: 'File is too large (max 15MB).' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
    const fileName = `site-song-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('wish-photos')
      .upload(fileName, buffer, { contentType: file.type || 'audio/mpeg', upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage.from('wish-photos').getPublicUrl(fileName);
    const songUrl = publicUrlData.publicUrl;

    const content = await getSettingsContent();
    const { error: updateError } = await supabaseAdmin
      .from('settings')
      .update({ content: { ...content, songUrl } })
      .eq('id', 1);
    if (updateError) throw updateError;

    return Response.json({ ok: true, songUrl });
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
    const { error: updateError } = await supabaseAdmin
      .from('settings')
      .update({ content })
      .eq('id', 1);
    if (updateError) throw updateError;

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}