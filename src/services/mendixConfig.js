/**
 * Where the Mendix runtime lives, and which paths it publishes.
 *
 * MENDIX_ORIGIN is hardcoded to the deployed Mendix app. Every REST call this
 * React app makes is built from it, so this constant is the single place that
 * decides which runtime the app talks to.
 *
 * Because this is an absolute cross-origin URL, the browser talks to Mendix
 * directly and the vite dev proxy is bypassed. That makes CORS and third-party
 * cookies the deployed runtime's responsibility - both published services
 * (LoginService and the Active-Session services) must answer with:
 *
 *   Access-Control-Allow-Origin: <exact React origin>   (never *)
 *   Access-Control-Allow-Credentials: true
 *   Access-Control-Allow-Headers: Content-Type, X-Csrf-Token
 *   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 *
 * and the XASSESSIONID cookie must be issued `SameSite=None; Secure`, or the
 * browser will not attach it to these cross-site requests.
 *
 * To go back to the same-origin dev topology (vite.config.js proxying /rest and
 * friends to a local runtime, no CORS at all), set VITE_MENDIX_URL to an empty
 * string in .env - it overrides the hardcoded value below.
 */
export const MENDIX_ORIGIN =
  import.meta.env.VITE_MENDIX_URL ?? 'https://mxinterface.rapidhr.com';

/**
 * The deployed Mendix app itself, for navigation rather than for API calls:
 * sign-out, deep links, "open this in Mendix" buttons. The profile query string
 * is the one the deployment is served under.
 */
export const MENDIX_APP_URL = `${MENDIX_ORIGIN}/?profile=Responsive`;

/** Builds an absolute URL to a Mendix deep link, e.g. mendixLink('THome'). */
export const mendixLink = (page) =>
  `${MENDIX_ORIGIN}/link/${page}?profile=Responsive`;

/**
 * Whether the CSRF token is kept across a page reload.
 *
 * Memory-only is the stricter default the integration spec prefers, but it
 * means every browser refresh drops the user on the login screen: JavaScript
 * memory is wiped while the HttpOnly session cookie survives, and there is no
 * way to read the token back out of the runtime without a published endpoint.
 *
 * With this on, the token is written to **sessionStorage** - deliberately not
 * localStorage. sessionStorage is scoped to the one browser tab and is dropped
 * when that tab closes, so it survives the reload it needs to survive and
 * nothing more. The session id is never stored; it stays in the HttpOnly
 * cookie where only the browser can reach it.
 *
 * What this does and does not cost:
 *   - CSRF protection itself is unchanged. The defence works because another
 *     origin cannot set a custom header, and the same-origin policy keeps it
 *     out of this storage too.
 *   - The exposure it widens is XSS: script running on this origin can read
 *     sessionStorage. Script on this origin can already issue authenticated
 *     calls, so this is a narrowing of degree rather than a new hole - but it
 *     is a real difference, and it is why the spec prefers memory.
 *
 * Set VITE_PERSIST_CSRF=false to go back to memory-only.
 */
export const PERSIST_CSRF = import.meta.env.VITE_PERSIST_CSRF !== 'false';

/**
 * Published REST service: Main > Publish > LoginService, Authentication = None.
 *
 * This matches the service's Path field in Studio Pro as it is modelled today,
 * so the login button hits the URL that actually exists:
 *
 *   https://mxinterface.rapidhr.com/react-auth/v1/login
 *
 * Unlike every other service in this app it does not sit under /rest. If you
 * later change the Path to `rest/react-auth/v1` for consistency, set
 * VITE_MENDIX_AUTH_BASE=/rest/react-auth/v1 at the same time.
 */
export const AUTH_BASE = import.meta.env.VITE_MENDIX_AUTH_BASE ?? '/react-auth/v1';

/**
 * Published REST service: Main > Publish > ReactApiService, Authentication =
 * Active Session. Hosts the logout operation.
 */
export const API_BASE = import.meta.env.VITE_MENDIX_API_BASE ?? '/rest/react-api/v1';

/**
 * Published REST service: DashboardService, Authentication = Active Session.
 * Path as modelled today is `rest/myservice/v1`.
 */
export const DASHBOARD_BASE = import.meta.env.VITE_MENDIX_DASHBOARD_BASE ?? '/rest/myservice/v1';

export const endpoints = {
  login: `${MENDIX_ORIGIN}${AUTH_BASE}/login`,

  /*
   * Deliberately on the UNAUTHENTICATED service, alongside /login. Active
   * Session authentication demands the X-Csrf-Token header, and this endpoint
   * exists to hand that token back after a refresh has wiped it from memory -
   * behind Active Session you would need the token to fetch the token. The
   * session is still resolved from the cookie, and the Java action refuses to
   * answer for an anonymous or system session.
   */
  session: `${MENDIX_ORIGIN}${AUTH_BASE}/session`,
  logout: `${MENDIX_ORIGIN}${API_BASE}/logout`,
  ceoMessage: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/CEOMessage`,
  events: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/Events`,

  /*
   * The Approvals card is backed by four separate resources on
   * DashboardService, one per tab, rather than one endpoint plus client-side
   * filtering. Each maps to its own microflow:
   *
   *   AllRequests      -> Main.DS_GetAllRequests
   *   PendingRequests  -> Main.DS_GetPendingRequests
   *   ApprovedRequests -> Main.DS_GetApprovedRequests
   *   RejectedRequests -> Main.DS_GetRejectedRequests
   */
  allRequests: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/AllRequests`,
  pendingRequests: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/PendingRequests`,
  approvedRequests: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/ApprovedRequests`,
  rejectedRequests: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/RejectedRequests`
};
