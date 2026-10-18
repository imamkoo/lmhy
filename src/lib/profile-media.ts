import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfileImageKind = 'avatar' | 'banner';

export const ACCEPTED_IMAGE_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
];

export const PROFILE_IMAGE_MAX_BYTES: Record<ProfileImageKind, number> = {
  avatar: 2 * 1024 * 1024,
  banner: 5 * 1024 * 1024,
};

const UPLOAD_ERROR = 'Gagal mengunggah gambar — coba lagi.';
const STORAGE_BUCKET = 'profile-media';

function sanitizeImageExt(ext: string): string {
  const safe = ext.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return safe || 'png';
}

export function validateProfileImage(
  kind: ProfileImageKind,
  file: File
): { ok: true } | { ok: false; error: string } {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: 'Format harus JPG, PNG, WebP, atau AVIF.' };
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES[kind]) {
    return {
      ok: false,
      error: kind === 'avatar' ? 'Ukuran maksimal 2MB.' : 'Ukuran maksimal 5MB.',
    };
  }
  return { ok: true };
}

export function buildProfileImagePath(uid: string, kind: ProfileImageKind, ext: string): string {
  return `${uid}/${kind}-${Date.now()}.${sanitizeImageExt(ext)}`;
}

export async function uploadProfileImage(
  client: SupabaseClient,
  uid: string,
  kind: ProfileImageKind,
  file: File
): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
  try {
    const path = buildProfileImagePath(uid, kind, file.type.split('/')[1] ?? '');
    const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
      upsert: false,
    });
    if (error) {
      console.error('[profile-media] upload failed:', error);
      return { ok: false, error: UPLOAD_ERROR };
    }
    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) {
      console.error('[profile-media] public url missing for path:', path);
      return { ok: false, error: UPLOAD_ERROR };
    }
    return { ok: true, url: data.publicUrl, path };
  } catch (err) {
    console.error('[profile-media] upload exception:', err);
    return { ok: false, error: UPLOAD_ERROR };
  }
}

export function isOwnProfileMediaUrl(url: string, uid: string): boolean {
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/${uid}/`);
}

export function extractOwnProfileMediaPath(url: string, uid: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/${uid}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split(/[?#]/)[0];
  if (!rest) return null;
  return `${uid}/${rest}`;
}

export async function removeProfileMedia(client: SupabaseClient, path: string): Promise<void> {
  try {
    const { error } = await client.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) {
      console.warn('[profile-media] remove failed:', error);
    }
  } catch (err) {
    console.warn('[profile-media] remove exception:', err);
  }
}
