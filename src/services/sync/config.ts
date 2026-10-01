/**
 * Whether cloud sync is available in this build.
 *
 * The deployed site has no backend: `/api` falls through the SPA rewrite to `index.html`,
 * so every sync call fails and the user is told their connection is at fault. Showing a
 * sign-in form that cannot work is worse than not showing it.
 *
 * Set `VITE_SYNC_BASE` to enable the feature. Empty or absent means the section is hidden
 * and the app stays local-only, which is the honest default for a build with no server.
 */
export function syncEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SYNC_BASE);
}

/**
 * The API root the adapter talks to.
 *
 * Always ends in `/api`. The configured value is an origin — `http://localhost:5213` in
 * development, the backend's address in production — and the routes live under `/api` on
 * it. Joining the origin straight to a path produced `…/auth/request-code`, which the
 * static server answered with its SPA fallback: a 200 carrying HTML, so the sign-in form
 * looked like it worked while the code never arrived.
 *
 * Same-origin deployments (the origin serving the app also serves the API) need no
 * variable; the fallback is `/api` relative to the page.
 */
export function syncBase(): string {
  const configured = import.meta.env.VITE_SYNC_BASE;
  if (!configured) return '/api';
  return `${configured.replace(/\/+$/, '')}/api`;
}
