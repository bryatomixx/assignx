/**
 * lib/profile/api.ts
 *
 * Typed client-side wrappers for POST /api/profile/action.
 * Uses fetch only. Authentication is cookie-based; no userId is sent in the body.
 * The server derives the actor identity from the session cookie.
 *
 * Avatar upload flow (client-side, documented here for the frontend):
 *   1. Obtain the browser Supabase client: getSupabaseBrowserClient()
 *   2. Upload the file to Storage:
 *        const path = `${uid}/avatar.${ext}`;
 *        await client.storage.from('avatars').upload(path, file, { upsert: true });
 *   3. Get the public URL:
 *        const { data } = client.storage.from('avatars').getPublicUrl(path);
 *   4. Call uploadAvatarComplete({ avatar_url: data.publicUrl }) to persist
 *      the URL on the profile and record the audit entry.
 *
 * Password change flow (documented here for the frontend):
 *   1. Re-verify current password:
 *        await client.auth.signInWithPassword({ email, password: currentPwd })
 *        If this fails, abort: "Current password is incorrect."
 *   2. Set the new password:
 *        await client.auth.updateUser({ password: newPwd })
 *   3. Audit the event:
 *        await recordPasswordChange()
 *   4. Sign out and redirect:
 *        await client.auth.signOut()
 *        router.push('/login?msg=password-changed')
 */

export interface ProfileActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function dispatch(
  action: string,
  payload?: Record<string, unknown>,
): Promise<ProfileActionResult> {
  const res = await fetch("/api/profile/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const data = (await res.json()) as ProfileActionResult;
  return data;
}

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

/**
 * Updates the current user's profile fields.
 * All fields are optional; at least one must be provided.
 *
 * Validation (enforced server-side):
 *   name:     2..80 characters
 *   bio:      max 300 characters
 *   timezone: valid IANA string (e.g. "America/New_York")
 */
export async function updateProfile(fields: {
  name?: string;
  bio?: string;
  timezone?: string;
}): Promise<ProfileActionResult> {
  return dispatch("updateProfile", fields);
}

// ---------------------------------------------------------------------------
// uploadAvatarComplete
// ---------------------------------------------------------------------------

/**
 * Persists the public avatar URL after the client has uploaded the file to
 * Supabase Storage. See the JSDoc comment at the top of this file for the
 * full upload flow.
 *
 * @param avatar_url - Public HTTPS URL from Supabase Storage.
 */
export async function uploadAvatarComplete(
  avatar_url: string,
): Promise<ProfileActionResult> {
  return dispatch("uploadAvatarComplete", { avatar_url });
}

// ---------------------------------------------------------------------------
// recordPasswordChange
// ---------------------------------------------------------------------------

/**
 * Appends a password-change audit entry. Call this AFTER successfully
 * updating the password via auth.updateUser(). old_value and new_value
 * are always null in the audit log (passwords are never stored).
 */
export async function recordPasswordChange(): Promise<ProfileActionResult> {
  return dispatch("recordPasswordChange");
}
