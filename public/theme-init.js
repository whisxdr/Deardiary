/**
 * Applies the stored theme before first paint.
 *
 * `settingsStore.hydrate()` writes `data-theme` only after the bundle loads, so a visitor
 * whose theme is night or paper saw one frame of the default leather theme first. This
 * file runs synchronously in `<head>` (external, so `script-src 'self'` still holds) and
 * writes the same attributes `applySettingsToDocument` writes, so the first painted frame
 * already carries the stored theme.
 *
 * Kept deliberately small and dependency-free: it runs on every load, before any bundle.
 * Storage is untrusted, so every field is validated and a malformed value falls back to
 * the defaults already present in the markup.
 */
(function () {
  var THEMES = ['leather', 'paper', 'night'];
  var FONT_SIZES = ['sm', 'md', 'lg'];
  try {
    var raw = window.localStorage.getItem('deardiary:settings');
    if (!raw) return;
    var settings = JSON.parse(raw);
    if (!settings || typeof settings !== 'object') return;
    var root = document.documentElement;
    if (THEMES.indexOf(settings.theme) !== -1) {
      root.dataset.theme = settings.theme;
      root.classList.toggle('dark', settings.theme === 'night');
    }
    if (FONT_SIZES.indexOf(settings.fontSize) !== -1) {
      root.dataset.fontSize = settings.fontSize;
    }
  } catch (error) {
    // A malformed or unreadable settings value is not worth failing the first paint over;
    // the defaults in index.html and the later hydrate() call both still apply.
  }
})();
