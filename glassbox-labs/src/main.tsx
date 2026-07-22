import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('missing #root');
// NB: React.StrictMode intentionally omitted (parity note only; no game engine here).
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
