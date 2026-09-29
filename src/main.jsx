import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/*
 * Only ONE stylesheet is imported here, and it is not a theme file.
 *
 * Mendix compiles theme/web/main.scss - variables, the two font files,
 * atom-bahri-imagedirect, gs-bahri/atom-gs, bahri-login-new,
 * gs-bahri/atom-gs-responsive and gs-bahri/atom-service-gs - into a single
 * theme.compiled.css. index.html loads that file, copied byte-for-byte from the
 * running app, so this app gets Mendix's own compiled output: the same cascade,
 * the same @import order, the same Sass resolution, with nothing recompiled here
 * that could drift from it.
 *
 * That is why the individual .scss copies under styles/ are no longer imported.
 * They are kept as the readable source of what the compiled file contains; to
 * pick up a theme change, re-copy theme.compiled.css from the runtime rather
 * than editing anything here:
 *
 *   curl http://localhost:8080/theme.compiled.css -o public/mx-theme/theme.compiled.css
 *
 * mx-client.scss is the exception and stays: it is the sliver of mxclientsystem's
 * own stylesheet - pop-up window and dialog positioning - which the runtime
 * serves separately and which theme.compiled.css therefore does not contain.
 */
import './styles/mx-client.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
