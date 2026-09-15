import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Dashboard background images, mirroring the end of Mendix's
// theme/web/atom-bahri-imagedirect.scss. Mendix's main.scss imports that file
// before atom-gs.scss, and the order matters: atom-gs.scss sets the position,
// repeat and size that this file's `background` shorthand resets.
import './styles/atom-bahri-imagedirect.scss';

// atom-gs.scss is copied byte-for-byte from
// Employee Hub/theme/web/gs-bahri/atom-gs.scss and is never modified.
// It is imported here so it resolves exactly as it does in Mendix, where
// main.scss ends with `@import "gs-bahri/atom-gs.scss"`.
import './styles/gs-bahri/atom-gs.scss';

// Responsive layer. MUST stay after atom-gs.scss: its rules mirror the same
// selector depth, so they win on source order when a media query matches.
import './styles/gs-bahri/atom-gs-responsive.scss';

// Sign-in screen. Everything in it is scoped under .gs-login-page, so it is
// layout-neutral for the dashboard and its position in this list does not
// matter; it sits last to keep the Mendix-mirroring imports above together.
import './styles/gs-bahri/gs-login.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
