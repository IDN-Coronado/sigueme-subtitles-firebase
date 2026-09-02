import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';

const scrollHideTimers = new WeakMap();

document.addEventListener(
  'scroll',
  (event) => {
    const raw = event.target;
    const target =
      raw === document || raw === document.documentElement || raw === document.body
        ? document.documentElement
        : raw;
    if (!(target instanceof Element)) return;

    target.classList.add('is-scrolling');
    const prev = scrollHideTimers.get(target);
    if (prev) window.clearTimeout(prev);

    scrollHideTimers.set(
      target,
      window.setTimeout(() => {
        target.classList.remove('is-scrolling');
        scrollHideTimers.delete(target);
      }, 800)
    );
  },
  true
);

// Steps 1-3 could leave a service worker registered against this origin. The
// worker is gone from the build now, but a registered one keeps answering every
// navigation from its precached index.html — which points at a bundle hash that
// no longer exists — and nothing will ever replace it, because there is no
// /sw.js left to update from. Any install that ever registered one would be
// frozen on that build forever, so tear it down explicitly.
//
// Reload only when something was actually removed: the unregistered worker
// still controls the current page, so the fresh bundle needs one navigation to
// take effect. The next boot finds nothing and does not reload again.
async function removeLegacyServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return;

    await Promise.all(registrations.map((r) => r.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    window.location.reload();
  } catch {
    // Nothing to clean up, or the APIs are unavailable.
  }
}

removeLegacyServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

