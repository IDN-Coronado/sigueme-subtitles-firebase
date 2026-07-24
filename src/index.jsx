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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
