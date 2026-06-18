/**
 * Community "owner" identity.
 *
 * The owner is a special admin (Noah, noahdeveloperr@gmail.com) whose profile is
 * NOT browsable by other members and whose posts broadcast an announcement
 * notification to everyone.
 *
 * Identified by the fixed seeded UUID from supabase/migrations/0004. Centralized
 * here so the client (UI gating) and the server (broadcast logic) agree on a
 * single source of truth. This module has no server-only imports, so it is safe
 * to import from both client components and route handlers.
 */

export const OWNER_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export function isOwner(userId: string | null | undefined): boolean {
  return userId === OWNER_USER_ID;
}
