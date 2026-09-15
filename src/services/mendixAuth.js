import { endpoints, PERSIST_CSRF } from './mendixConfig.js';

/*
 * Tab-scoped storage for the CSRF token, so a reload can rejoin the session
 * the cookie still points at. The session id is never written here - it is not
 * even readable from JavaScript. See PERSIST_CSRF in mendixConfig.js for what
 * this trades away.
 *
 * Every access is guarded: sessionStorage throws outright in some privacy
 * modes, and a storage failure must never break signing in.
 */
const TOKEN_KEY = 'mybahri.csrf';
const USER_KEY = 'mybahri.user';

function rememberSession(token, user) {
  if (!PERSIST_CSRF) return;

  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    if (user) window.sessionStorage.setItem(USER_KEY, user);
  } catch {
    // Storage unavailable; the session simply will not survive a reload.
  }
}

function forgetStoredSession() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to do - there was nothing readable to clear.
  }
}

function readStoredSession() {
  if (!PERSIST_CSRF) return null;

  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    return { token, user: window.sessionStorage.getItem(USER_KEY) };
  } catch {
    return null;
  }
}

/**
 * Session-based authentication against the Mendix runtime.
 *
 * The rules this module is built around (section 1 of the integration prompt):
 *
 *   XASSESSIONID  is created by the Mendix runtime, written as an HttpOnly
 *                 cookie by Core.addMendixCookies(), and managed by the
 *                 browser. It is never read, stored, logged or constructed
 *                 here, and `credentials: "include"` is what puts it on the
 *                 wire.
 *
 *   CSRF token    comes back in the login response body and lives in the
 *                 module-scoped `csrfToken` below. It is sent as the
 *                 X-Csrf-Token header on every protected call, and - when
 *                 PERSIST_CSRF is on - mirrored into tab-scoped
 *                 sessionStorage so a reload can rejoin the session. Never
 *                 localStorage, and never a JS cookie.
 *
 * Nothing in this file logs a password, a session id or a token.
 */

let csrfToken = null;
let currentUser = null;

/*
 * Adopt a token this tab persisted on an earlier page load. Doing it at module
 * load means getSessionState() is already correct on the very first render, so
 * a reload goes straight back to the dashboard with no login-screen flash and
 * no round trip.
 *
 * A token whose session has since died is harmless: the first protected call
 * returns 401, apiFetch raises SessionExpiredError, and the user lands back on
 * the login screen.
 */
{
  const stored = readStoredSession();

  if (stored) {
    csrfToken = stored.token;
    currentUser = stored.user;
  }
}

/** Subscribers are notified whenever the in-memory session changes. */
const listeners = new Set();

function emit() {
  const snapshot = { authenticated: csrfToken !== null, username: currentUser };
  listeners.forEach((fn) => fn(snapshot));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionState() {
  return { authenticated: csrfToken !== null, username: currentUser };
}

function clearSession() {
  csrfToken = null;
  currentUser = null;
  forgetStoredSession();
  emit();
}

/** Raised when Mendix rejects a call because the session is gone or CSRF failed. */
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
  }
}

/**
 * POST /rest/react-auth/v1/login  (Authentication = None)
 *
 * Mendix authenticates with Core.login(), creates the ISession, writes the
 * Mendix cookies onto this very response, and returns the CSRF token.
 *
 * The body shape matches Main.IM_LoginReact, which maps `username` and
 * `password` onto Main.LoginReact.
 */
export async function login(username, password) {
  let response;

  /*
   * Login is the one call that carries no CSRF token: the token is a property
   * of a session, and no session exists yet. That is why LoginService is
   * published with Authentication = None.
   */
  try {
    response = await fetch(endpoints.login, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  } catch {
    // Network / DNS / CORS preflight failure - never a credentials problem.
    throw new Error('Unable to reach the server. Please try again.');
  }

  clearSession();

  // 401 is the only status Main.ACT_LoginAuthenticate returns for bad
  // credentials. A 403 is something else - typically the request never reached
  // the login microflow - so it must not be reported as a wrong password.
  if (response.status === 401) {
    throw new Error('Invalid username or password');
  }

  if (!response.ok) {
    throw new Error('Unable to sign in. Please try again.');
  }

  const { token, user } = readLoginBody(await response.text());

  // An empty token is how JA_CreateReactSession reports a failed Core.login():
  // it returns "" for bad credentials rather than throwing.
  if (!token) {
    throw new Error('Invalid username or password');
  }

  csrfToken = token;
  currentUser = user ?? username;
  rememberSession(csrfToken, currentUser);
  emit();

  return { username: currentUser };
}

/**
 * GET /react-auth/v1/session  (Authentication = None)
 *
 * Recovers the CSRF token for a session that already exists. React holds the
 * token in memory only, so a browser refresh loses it while the HttpOnly
 * XASSESSIONID cookie survives - without this, every refresh would drop the
 * user on the login screen even though the Mendix session is alive.
 *
 * It sends no CSRF header, and it must not: recovering that header is the
 * point. Safety comes from the Java action behind it, which returns nothing
 * unless the cookie resolves to a real signed-in user.
 *
 * Returns true when a live session was adopted.
 */
export async function bootstrapSession() {
  let response;

  try {
    response = await fetch(endpoints.session, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
  } catch {
    clearSession();
    return false;
  }

  if (!response.ok) {
    clearSession();
    return false;
  }

  // Same two shapes login accepts: a JSON object, or the bare token string the
  // String-returning microflow emits today.
  const { token, user } = readLoginBody(await response.text());

  if (!token) {
    clearSession();
    return false;
  }

  csrfToken = token;
  currentUser = user;
  rememberSession(csrfToken, currentUser);
  emit();

  return true;
}

/**
 * The single entry point for every call that needs an authenticated Mendix
 * session. Adds the session cookie (via credentials) and the CSRF header, and
 * turns a rejected session into SessionExpiredError so the UI can send the user
 * back to the login screen.
 */
export async function apiFetch(url, { method = 'GET', body, headers } = {}) {
  const requestHeaders = { Accept: 'application/json', ...headers };

  if (csrfToken) {
    requestHeaders['X-Csrf-Token'] = csrfToken;
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 401 || response.status === 403) {
    clearSession();
    throw new SessionExpiredError();
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return readJson(response);
}

/**
 * POST /rest/react-api/v1/logout  (Authentication = Active Session)
 *
 * Core.logout(session) on the server is what actually ends the session. React
 * only forgets the CSRF token; it must not try to delete the HttpOnly cookie.
 */
export async function logout() {
  let serverEndedIt = false;

  try {
    const response = await fetch(endpoints.logout, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? { 'X-Csrf-Token': csrfToken } : {}
    });

    serverEndedIt = response.ok;

    /*
     * Signing out locally while the server-side session lives on is the worst
     * kind of failure: React shows the login screen, so it looks like it
     * worked, while the Mendix app stays signed in on the same cookie. Never
     * let that pass silently.
     */
    if (!serverEndedIt && import.meta.env.DEV) {
      console.warn(
        `[auth] Signed out locally, but ${endpoints.logout} answered ` +
          `${response.status}. The Mendix session is still alive and the ` +
          'Mendix app will remain signed in. Publish POST /logout on ' +
          'ReactApiService so Core.logout() actually runs.'
      );
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[auth] Signed out locally, but ${endpoints.logout} could not be ` +
          `reached (${error?.message ?? error}). The Mendix session is still alive.`
      );
    }
  } finally {
    // The local session is dropped either way: a failed call must not trap the
    // user in a signed-in UI.
    clearSession();
  }

  return { serverEndedSession: serverEndedIt };
}

/**
 * Reads the CSRF token out of the login response.
 *
 * Two shapes are accepted, because the Mendix side is mid-migration:
 *
 *   1. The target contract - a JSON object:
 *        { "success": true, "username": "...", "csrfToken": "...", ... }
 *
 *   2. What Main.ACT_LoginAuthenticate returns *today* - the microflow's return
 *      type is still String, so the operation emits the bare CSRF token, either
 *      as a JSON string literal ("abc123") or as plain text (abc123).
 *
 * Accepting both means login works against the model as it stands and keeps
 * working once the microflow is rebuilt to return LoginResponse.
 */
function readLoginBody(text) {
  const body = (text ?? '').trim();

  if (!body) {
    return { token: '', user: null };
  }

  try {
    const parsed = JSON.parse(body);

    // Shape 1: the LoginResponse object.
    if (parsed && typeof parsed === 'object') {
      return {
        token: parsed.csrfToken ?? parsed.CsrfToken ?? '',
        user: parsed.username ?? parsed.Username ?? null
      };
    }

    // Shape 2a: a JSON string literal holding the token.
    if (typeof parsed === 'string') {
      return { token: parsed.trim(), user: null };
    }

    return { token: '', user: null };
  } catch {
    // Shape 2b: plain text. Anything with whitespace or markup is not a token -
    // it is an error page or a proxy response, so treat it as a failure.
    if (/^[\w.~+/=-]+$/.test(body)) {
      return { token: body, user: null };
    }

    return { token: '', user: null };
  }
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
