import React, { useCallback, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { IMG } from '../data/dashboardData.js';

/* A 1x1 transparent GIF. The toggle widget's own artwork is collapsed to its
   padding box by bahri-login-new.scss, which paints the eye icons as background
   images instead, so the <img> only has to exist. */
const BLANK =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Main.Employee_Login_Page_New
 *   Title  'Login'
 *   Layout Bahri_UI_Design.Employee_Login  (a scroll container, centre region)
 *   Class  'bahri-login-new'
 *
 * The DOM below is the page's widget tree, with the classes the stylesheet's
 * own TARGET STRUCTURE block names for the widgets mxcli cannot print
 * (validation message -> bl-error, login id / password -> bl-input, sign-in
 * button -> bl-submit).
 *
 * bahri-login-fx.js - loaded verbatim from index.html, exactly as the Mendix
 * theme loads it - takes it from there: the card tilt, the rotating "Latest at
 * Bahri" announcement and its progress dots, the shake on a refused sign-in
 * (it watches `.bl-error` for any change while an attempt is open), and the
 * hand-off curtain.
 *
 * The one thing it cannot see is the sign-in itself. It listens for the Mendix
 * client's own POST to /xas/ with `"action":"login"`; this app signs in through
 * its REST endpoint instead, so the success half of the hand-off is raised here
 * - the same sessionStorage flag and the same two classes the script and
 * index.html agree on.
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

  const pageRef = useRef(null);

  /* The hand-off, in the terms index.html and bahri-login-fx.js already share. */
  const startHandoff = useCallback(() => {
    try {
      sessionStorage.setItem('bl-signin-transition', String(Date.now()));
    } catch (storageError) {
      /* private window, blocked storage: the curtain is skipped, nothing else */
    }
    document.documentElement.classList.add('bl-handoff');
    if (pageRef.current) pageRef.current.classList.add('bl-leaving');
  }, []);

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
      /* Only a sign-in that was accepted raises the curtain. */
      startHandoff();
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
    <div className="mx-page bahri-login-new" data-focusindex="0" ref={pageRef}>
      {/* Bahri_UI_Design.Employee_Login, exactly as the client builds it:
          scrollcontainer > -center > -wrapper > placeholder. */}
      <div className="mx-scrollcontainer mx-scrollcontainer-horizontal mx-scrollcontainer-fixed mx-name-scrollContainer1">
        <div className="mx-scrollcontainer-center">
          <div className="mx-scrollcontainer-wrapper">
            <div className="mx-placeholder">

              <div className="mx-name-container2 bahri-login-new">
                <div className="mx-layoutgrid mx-layoutgrid-fluid container-fluid mx-name-layoutGrid6 bl-shell">

                  {/* ------------------------------------------- row 1: brand */}
                  <div className="row no-gutters">
                    <div className="col-lg col-md col">
                      <div className="mx-name-container8 bl-brand">

                        <div className="mx-name-gsHeaderBrand bl-brand-top">
                          <div className="mx-image-viewer mx-image-viewer-responsive mx-name-gsHeaderLogo bl-brand-logo">
                            <img className="" alt="" role="img" src={`${IMG}/Main$gs_image$bahri_toplogo.svg`} />
                          </div>
                          <span className="mx-text mx-name-gsHeaderWordmark bl-brand-wordmark">MyBahri</span>
                        </div>

                        <div className="mx-name-container3 bl-brand-copy">
                          <h1 className="mx-text mx-name-text1 bl-brand-title">
                            Your workday, in one place.
                          </h1>

                          <div className="mx-name-blAnnounce bl-announce">
                            <div className="mx-name-blAnnounceHead bl-announce-head">
                              <span className="mx-text mx-name-blAnnounceBadge bl-announce-badge">&bull;</span>
                              <span className="mx-text mx-name-blAnnounceLabel bl-announce-label">
                                Latest at Bahri
                              </span>
                              <span className="mx-text mx-name-blAnnounceChip bl-announce-chip">HR</span>
                            </div>
                            <span className="mx-text mx-name-blAnnounceText bl-announce-text">
                              September payslips are now available in the hub.
                            </span>
                          </div>

                          <p className="mx-text mx-name-text3 bl-brand-sub">
                            Requests, approvals, events and company news &mdash; all together on the
                            Bahri Employee Hub.
                          </p>
                        </div>

                        <p className="mx-text mx-name-text2 bl-brand-foot">
                          &copy; 2026 Bahri. All rights reserved.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ------------------------------------------- row 2: panel */}
                  <div className="row no-gutters">
                    <div className="col-lg col-md col">
                      <div className="mx-name-container1 bl-panel">
                        <form className="mx-name-container11 bl-form" onSubmit={handleSubmit}>

                          <div className="mx-name-container5 bl-form-head">
                            <span className="mx-text mx-name-text4 bl-title">Sign in</span>
                            <span className="mx-text mx-name-text5 bl-subtitle">
                              Use your Bahri account to continue.
                            </span>
                          </div>

                          {/* Forms$ValidationMessage. Always present and empty
                              until there is something to say: the stylesheet
                              hides it with :empty, and bahri-login-fx.js watches
                              this very node to tell a refusal from a success. */}
                          <div className="mx-name-container9 form-group">
                            <div
                              className="alert alert-danger mx-name-validationMessage2 bl-error"
                              role="alert"
                            >
                              {error}
                            </div>
                          </div>

                          <div className="mx-name-container6 bl-field">
                            <div className="form-group mx-loginidtextbox no-columns mx-name-loginIdTextBox2 bl-input">
                              <label className="control-label" htmlFor="bl-username">
                                Username
                              </label>
                              <input
                                id="bl-username"
                                className="form-control"
                                type="text"
                                name="username"
                                autoComplete="username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mx-name-container7 bl-field bl-field-pass">
                            <div className="form-group mx-passwordtextbox no-columns mx-name-passwordTextBox2 bl-input">
                              <label className="control-label" htmlFor="bl-password">
                                Password
                              </label>
                              <input
                                id="bl-password"
                                className="form-control"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                              />

                              {/*
                                toggleshowpassword. The client puts this button
                                INSIDE the .form-group, after the input - which is
                                what `.form-group:has(.toggle-password-button)
                                { position: relative }` in the widget's own
                                stylesheet is written for, and what makes its
                                `top` offset measure from the label rather than
                                from some outer box.

                                The state class reads the other way round from
                                what the name suggests: `show-val` means "the
                                reveal icon is the one on show", i.e. the password
                                is still hidden. The widget starts on `show-val`.
                              */}
                              <button
                                type="button"
                                className={`toggle-password-button mx-name-toggleShowPassword1 ${
                                  showPassword ? 'hide-val' : 'show-val'
                                }`}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                <img className="icon-hide" alt="" src={BLANK} />
                                <img className="icon-show" alt="" src={BLANK} />
                              </button>
                            </div>

                            {/* the client leaves an empty wrapper here */}
                            <div />
                          </div>

                          {/* dataview Recaptcha.DS_SampleHelper - the sign-in
                              button and the login form helper live inside it. */}
                          <div className="mx-dataview mx-name-dataView1 form-horizontal">
                            <div className="mx-dataview-content">
                              <div className="mx-name-container4">
                                <button
                                  type="submit"
                                  className="btn mx-button mx-name-signInButton2 bl-submit btn-primary"
                                  data-button-id="p.Main.Employee_Login_Page_New.signInButton2"
                                  data-disabled={busy ? 'true' : 'false'}
                                  disabled={busy}
                                >
                                  Sign in
                                </button>
                                {/* LoginFormHelperWidget renders nothing of its
                                    own; loginOnEnter is the <form> submit. */}
                                <div className="mx-name-loginFormHelperWidget1" />
                              </div>
                            </div>
                          </div>

                          <div className="mx-name-container10 row-center">
                            <span className="mx-text mx-name-text6 bl-help">
                              Trouble signing in? Contact the IT Service Desk.
                            </span>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
