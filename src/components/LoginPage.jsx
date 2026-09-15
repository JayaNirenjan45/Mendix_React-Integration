import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { IMG, layout } from '../data/dashboardData.js';

/**
 * Sign-in screen for the React dashboard.
 *
 * Styling follows the same conventions as the rest of this app: Mendix-shaped
 * `mx-name-*` hooks plus gs-bahri classes, so it sits on the same Inter type
 * ramp and the same Bahri palette (#0A5D8F / #00A9CE / #0F1729) as the
 * dashboard it guards. Its own rules live in styles/gs-bahri/gs-login.scss.
 *
 * The password only ever exists in this component's state for the lifetime of
 * the submit, and is dropped as soon as the request resolves. Nothing about the
 * attempt is written to storage or the console.
 */
export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await login(username.trim(), password);
    } catch (loginError) {
      // mendixAuth already reduced this to a generic, safe message.
      setError(loginError.message);
    } finally {
      // Clear the password whether the attempt succeeded or failed.
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <div className="mx-page gs-login-page">
      <div className="mx-name-gsLoginShell gs-login-shell">

        {/* ------------------------------------------------ brand / left pane */}
        <aside className="mx-name-gsLoginBrand gs-login-brand">
          <div className="mx-name-gsLoginBrandTop gs-login-brand-top">
            <img
              className="gs-login-brand-logo"
              src={`${IMG}/Main$gs_image$bahri_toplogo.svg`}
              alt=""
            />
            <span className="mx-text mx-name-gsLoginWordmark gs-login-wordmark">
              {layout.wordmark}
            </span>
          </div>

          <div className="mx-name-gsLoginBrandCopy gs-login-brand-copy">
            <h1 className="mx-text mx-name-gsLoginBrandTitle gs-login-brand-title">
              Your workday,<br />in one place.
            </h1>
            <p className="mx-text mx-name-gsLoginBrandSub gs-login-brand-sub">
              Requests, approvals, events and company news &mdash; all together
              on the Bahri Employee Hub.
            </p>
          </div>

          <div className="mx-name-gsLoginBrandFoot gs-login-brand-foot">
            <span className="gs-login-brand-foot-text">
              &copy; {new Date().getFullYear()} Bahri. All rights reserved.
            </span>
          </div>
        </aside>

        {/* ----------------------------------------------- form / right pane */}
        <main className="mx-name-gsLoginPanel gs-login-panel">
          <form className="mx-name-gsLoginForm gs-login-form" onSubmit={handleSubmit} noValidate>

            <div className="gs-login-form-head">
              <h2 className="mx-text mx-name-gsLoginTitle gs-login-title">Sign in</h2>
              <p className="mx-text mx-name-gsLoginSubtitle gs-login-subtitle">
                Use your Bahri account to continue.
              </p>
            </div>

            {error && (
              <div className="mx-name-gsLoginError gs-login-error" role="alert">
                {error}
              </div>
            )}

            <label className="gs-login-field">
              <span className="gs-login-label">Username</span>
              <input
                className="form-control gs-login-input"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                spellCheck="false"
                value={username}
                disabled={busy}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label className="gs-login-field">
              <span className="gs-login-label">Password</span>
              <span className="gs-login-input-wrap">
                <input
                  className="form-control gs-login-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  disabled={busy}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="gs-login-reveal"
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <button className="btn mx-button gs-login-submit" type="submit" disabled={busy}>
              {busy ? 'Signing in\u2026' : 'Sign in'}
            </button>

            <p className="gs-login-help">
              Trouble signing in? Contact the IT Service Desk.
            </p>
          </form>
        </main>

      </div>
    </div>
  );
}
