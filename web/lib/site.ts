// Canonical public URL for the site. Override with NEXT_PUBLIC_SITE_URL when
// deploying to a custom domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bughouse-app.vercel.app').replace(/\/$/, '');

export const SITE_NAME = 'Bughouse Chess';
export const SITE_DESCRIPTION =
  'Play bughouse chess online with friends. Free, real-time 4-player chess — no account required.';
