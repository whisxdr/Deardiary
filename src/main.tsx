import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles';
import { App } from '@/app';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root was not found in index.html');
}

const root = createRoot(container);

/**
 * Mount two frames from now, not in this task.
 *
 * index.html ships a static first frame of the opening screen, and React replaces the
 * whole container on its first commit. Rendering immediately let that commit land before
 * the browser ever painted, so the static frame was wasted and the first paint waited for
 * the bundle. The inner frame runs before a paint, the outer one before the next, which is
 * enough for the shell to be on screen; the animated version then takes over from it.
 */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
});
