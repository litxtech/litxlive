const resolvedWalletApi =
  (process.env.EXPO_PUBLIC_ADMIN_WALLET_API as string | undefined) ??
  "";

export const ADMIN_WALLET_API = resolvedWalletApi;

if (typeof console !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[adminWalletEnv] ADMIN_WALLET_API =', ADMIN_WALLET_API || '(not set)');
}
