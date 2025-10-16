const resolvedAdminApi =
  (process.env.EXPO_PUBLIC_ADMIN_API as string | undefined) ??
  "https://cobzwohfekgzbvxbwrll.functions.supabase.co/functions/v1/admin-working";

export const ADMIN_API = resolvedAdminApi;

if (typeof console !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[adminEnv] ADMIN_API =', ADMIN_API);
}
