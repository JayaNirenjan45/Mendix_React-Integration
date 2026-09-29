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
 * The deployed app's REAL origin, for links the BROWSER follows rather than
 * calls: "open this in Mendix", deep links, sign-out landing.
 *
 * MENDIX_ORIGIN is empty in the proxied topology, which is right for API calls
 * - they must stay on this origin so the dev server can forward them - but a
 * link built from it would point back at the React app instead of at Mendix.
 */
export const MENDIX_APP_ORIGIN =
  import.meta.env.VITE_MENDIX_APP_URL ?? 'https://mxinterface.rapidhr.com';

/**
 * The deployed Mendix app itself, for navigation rather than for API calls:
 * sign-out, deep links, "open this in Mendix" buttons. The profile query string
 * is the one the deployment is served under.
 */
export const MENDIX_APP_URL = `${MENDIX_APP_ORIGIN}/?profile=Responsive`;

/** Builds an absolute URL to a Mendix deep link, e.g. mendixLink('THome'). */
export const mendixLink = (page) =>
  `${MENDIX_APP_ORIGIN}/link/${page}?profile=Responsive`;

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
 * The shape of the login request body: 'object' or 'array'.
 *
 * The running service is the authority here, and it publishes an OBJECT. Its
 * own OpenAPI document - GET /rest-doc/react-auth/v1/openapi.json - declares:
 *
 *     "loginreact": { "title": "LoginReact", "type": "object",
 *                     "properties": { "username": {...}, "password": {...} } }
 *
 * so `{"username":…,"password":…}` is the correct body, which is the default.
 *
 * MENDIX_INTEGRATION.md §2.1 warns that Main.IM_LoginReact is rooted at an
 * array, and one stored copy of that mapping does carry `(Array)|(Object)|…`
 * paths - but it is not the one bound to the live POST /login operation. Trust
 * the OpenAPI contract over the mapping unit.
 *
 * Kept as a switch because the deployed app and the local runtime can disagree:
 * if a deployment's OpenAPI ever shows an array root, set
 * VITE_MENDIX_LOGIN_BODY=array in .env for that environment alone.
 */
export const LOGIN_BODY_SHAPE =
  import.meta.env.VITE_MENDIX_LOGIN_BODY === 'array' ? 'array' : 'object';

/**
 * Published REST service: Main > Publish > ReactApiService, Authentication =
 * Active Session. Hosts the logout operation.
 *
 * NOT PUBLISHED on mxinterface.rapidhr.com - its /rest-doc/ index lists
 * react-auth/v1, rest/servicerequests/v1, rest/myservice/v1,
 * rest/mysessionservice/v1 and others, but no rest/react-api/v1. POST /logout
 * therefore answers 404 and logout() ends the session locally only, warning in
 * the console; the Mendix session itself stays alive until it times out.
 */
export const API_BASE = import.meta.env.VITE_MENDIX_API_BASE ?? '/rest/react-api/v1';

/**
 * Published REST service: DashboardService, Authentication = Active Session.
 * Path as modelled today is `rest/myservice/v1`.
 */
export const DASHBOARD_BASE = import.meta.env.VITE_MENDIX_DASHBOARD_BASE ?? '/rest/myservice/v1';

/**
 * Published REST service for the four employee service request pages.
 *
 * This one does not exist yet. MENDIX_SERVICE_PAGES_SPEC.md is the build order
 * for it; until an operation is published its call answers 404 and the page
 * falls back to the seeded data in src/data/serviceData.js, announcing the
 * fallback once per endpoint in the dev console.
 */
export const SERVICE_BASE = import.meta.env.VITE_MENDIX_SERVICE_BASE ?? '/rest/react-svc/v1';

/**
 * The three services that DO already exist and cover part of these pages.
 * Their paths are read off the running app's own contracts; their request and
 * response shapes have not been confirmed against a live runtime yet, so
 * serviceRequestsApi.js treats them exactly like the unpublished ones - try,
 * and fall back on any failure.
 */
export const EXISTING_BASES = {
  absence: import.meta.env.VITE_MENDIX_ABSENCE_BASE ?? '/rest/absenceservice/v1',
  serviceRequests: import.meta.env.VITE_MENDIX_SVCREQ_BASE ?? '/rest/servicerequests/v1',
  approvals: import.meta.env.VITE_MENDIX_APPROVAL_BASE ?? '/rest/approvalservice/v1'
};

/**
 * ServiceRequests > AbsenceTypeId.
 *
 * submitabsence and absencedraft both take the Fusion absence type the request
 * is for. The Absence page is Annual Leave and has no type picker, so the id is
 * a constant here rather than a field. The value below is the one the Postman
 * collection ships; set VITE_ABSENCE_TYPE_ID for a tenant whose Annual Leave
 * type has a different id.
 */
export const ABSENCE_TYPE_ID = Number(
  import.meta.env.VITE_ABSENCE_TYPE_ID ?? 300000001234567
);

/** Everything the published ServiceRequests service exposes, by page. */
const SVCREQ = `${MENDIX_ORIGIN}${EXISTING_BASES.serviceRequests}`;

export const serviceRequests = {
  /* Submit and Draft are separate operations, not one with a flag. */
  submit: {
    drivers: `${SVCREQ}/SubmitDriverRequest`,
    food: `${SVCREQ}/SubmitFoodRequest`,
    digitalCard: `${SVCREQ}/SubmitDigitalCardRequest`,
    /* the two absence operations are the only lower-case paths */
    absence: `${SVCREQ}/submitabsence`
  },
  draft: {
    drivers: `${SVCREQ}/DraftDriverRequest`,
    food: `${SVCREQ}/DraftFoodRequest`,
    digitalCard: `${SVCREQ}/DraftDigitalCardRequest`,
    absence: `${SVCREQ}/absencedraft`
  },
  replacedBy: `${SVCREQ}/replacedby`,
  foodReqTypes: `${SVCREQ}/foodreqtypes`,
  officeLocation: `${SVCREQ}/officelocation`
};

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
  /*
   * NOT PUBLISHED on the deployment either, so a browser refresh drops the user
   * on the login screen rather than restoring the session.
   *
   * MySessionService (GET /rest/mysessionservice/v1/SessionMgnt) cannot stand in
   * for it: it takes sessionId and xasId as QUERY parameters and answers a bare
   * boolean. Both values live in HttpOnly cookies, so JavaScript cannot read
   * them to ask, and a boolean is not the CSRF token this endpoint has to hand
   * back. Restoring a session needs an operation that reads the session from the
   * cookie and returns its token.
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
  rejectedRequests: `${MENDIX_ORIGIN}${DASHBOARD_BASE}/RejectedRequests`,

  /* --- the four service request pages (MENDIX_SERVICE_PAGES_SPEC.md) ------- */

  /* §3 Phase 1 - lookups */
  me: `${MENDIX_ORIGIN}${SERVICE_BASE}/me`,
  employees: `${MENDIX_ORIGIN}${SERVICE_BASE}/employees`,
  offices: `${MENDIX_ORIGIN}${SERVICE_BASE}/offices`,
  foodTypes: `${MENDIX_ORIGIN}${SERVICE_BASE}/food-types`,
  replacedBy: `${MENDIX_ORIGIN}${SERVICE_BASE}/replaced-by`,

  /* §3 Phase 2 - request lifecycle, {type} is digitalcard|drivers|food|absence */
  openRequest: (type) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${type}`,
  saveRequest: (type, id) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${type}/${id}`,
  submitRequest: (type, id) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${type}/${id}/submit`,
  deleteRequest: (type, id) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${type}/${id}`,

  /* §3 Phase 3 - comments and attachments */
  comments: (id) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${id}/comments`,
  comment: (id, commentId) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${id}/comments/${commentId}`,
  attachments: (id) => `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${id}/attachments`,
  attachment: (id, attachmentId) =>
    `${MENDIX_ORIGIN}${SERVICE_BASE}/requests/${id}/attachments/${attachmentId}`,

  /* §3 Phase 4 - the absence rail */
  absenceBalance: `${MENDIX_ORIGIN}${SERVICE_BASE}/absence/balance`,
  absenceHistory: `${MENDIX_ORIGIN}${SERVICE_BASE}/absence/history`,
  absenceDuration: (start, end) =>
    `${MENDIX_ORIGIN}${SERVICE_BASE}/absence/duration?start=${encodeURIComponent(start)}` +
    `&end=${encodeURIComponent(end)}`,

  /* --- services that already exist on the runtime -------------------------- */
  absenceEmployeeDetails: `${MENDIX_ORIGIN}${EXISTING_BASES.absence}/AbsenceEmployeeDetails`,
  approvalRequests: `${MENDIX_ORIGIN}${EXISTING_BASES.approvals}/ehrequest`,

  /* --- ServiceRequests, as the published collection defines it ------------ */
  serviceRequests
};
