'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  ok: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a profile avatar for a client (admin on behalf of, or client self).
 * File stored at: client-avatars/<client_id>/avatar.<ext>
 */
export async function uploadClientAvatar(
  clientId: string,
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, error: 'No file provided' };

  // Validate
  const validationError = validateFile(file);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();

  // Permission check — must be admin OR uploading their own avatar
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const isSelf = user.id === clientId;
  if (!isAdmin && !isSelf) {
    return { ok: false, error: 'Not authorized to upload for this client' };
  }

  // Build path: <client_id>/avatar.<ext>
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${clientId}/avatar.${ext}`;

  // Upload (upsert = replace existing)
  const { error: uploadError } = await supabase.storage
    .from('client-avatars')
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    return { ok: false, error: uploadError.message };
  }

  // Save URL to profiles table
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: path })
    .eq('id', clientId);

  if (updateError) {
    console.error('Profile update error:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/admin/clients');
  revalidatePath('/client/dashboard');

  return { ok: true, path };
}

/**
 * Upload a progress (transformation) photo.
 * File stored at: client-progress/<client_id>/<check_in_date>/<view>.<ext>
 * Also creates/updates the client_progress_logs row for that check-in.
 */
export async function uploadProgressPhoto(
  clientId: string,
  checkInDate: string,
  view: 'front' | 'side' | 'back',
  formData: FormData
): Promise<UploadResult> {
  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, error: 'No file provided' };

  const validationError = validateFile(file);
  if (validationError) return { ok: false, error: validationError };

  // Validate view
  if (!['front', 'side', 'back'].includes(view)) {
    return { ok: false, error: 'Invalid photo view type' };
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
    return { ok: false, error: 'Invalid check-in date format' };
  }

  const supabase = await createClient();

  // Permission check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const isSelf = user.id === clientId;
  if (!isAdmin && !isSelf) {
    return { ok: false, error: 'Not authorized' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${clientId}/${checkInDate}/${view}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('client-progress')
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Progress photo upload error:', uploadError);
    return { ok: false, error: uploadError.message };
  }

  // Upsert the progress log row with the new photo URL
  const columnName = `${view}_photo_url`; // front_photo_url / side_photo_url / back_photo_url
  // Need to use raw SQL-esque approach since column name is dynamic.
  // Fetch existing row first, then update with appropriate column.

  const { data: existing } = await supabase
    .from('client_progress_logs')
    .select('id')
    .eq('client_id', clientId)
    .eq('check_in_date', checkInDate)
    .single();

  if (existing) {
    const { error: updateError } = await supabase
      .from('client_progress_logs')
      .update({ [columnName]: path })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Progress log update error:', updateError);
      return { ok: false, error: updateError.message };
    }
  } else {
    const { error: insertError } = await supabase.from('client_progress_logs').insert({
      client_id: clientId,
      check_in_date: checkInDate,
      [columnName]: path,
    });

    if (insertError) {
      console.error('Progress log insert error:', insertError);
      return { ok: false, error: insertError.message };
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);

  return { ok: true, path };
}

/**
 * Delete a progress photo and unset its column in client_progress_logs.
 */
export async function deleteProgressPhoto(
  clientId: string,
  checkInDate: string,
  view: 'front' | 'side' | 'back',
  path: string
): Promise<UploadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  if (!isAdmin) {
    return { ok: false, error: 'Only admins can delete photos' };
  }

  // Remove file
  const { error: removeError } = await supabase.storage
    .from('client-progress')
    .remove([path]);

  if (removeError) {
    console.error('Photo delete error:', removeError);
    return { ok: false, error: removeError.message };
  }

  // Unset the column
  const columnName = `${view}_photo_url`;
  await supabase
    .from('client_progress_logs')
    .update({ [columnName]: null })
    .eq('client_id', clientId)
    .eq('check_in_date', checkInDate);

  revalidatePath(`/admin/clients/${clientId}`);

  return { ok: true };
}

// ─── VALIDATION ───────────────────────────────────────────────────────
function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File type not allowed. Use JPEG, PNG, or WebP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is 5MB.`;
  }
  if (file.size === 0) {
    return 'File is empty';
  }
  return null;
}
