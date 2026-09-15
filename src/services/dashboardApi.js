import { apiFetch } from './mendixAuth.js';
import { endpoints } from './mendixConfig.js';

/**
 * Dashboard data sourced from the Mendix DashboardService
 * (Authentication = Active Session, path rest/myservice/v1).
 *
 * Every operation is POST and every one serialises through the same export
 * mapping, Main.EM_CEODetails, so all responses share one flat shape - a JSON
 * array of Main.Dashboard_JsonObject:
 *
 *   [{
 *     "CEOMessage": "...", "CEOName": "...", "CEODesignation": "...",
 *     "CEOMsgPublishDate": "...", "CEOLongMessage": "...",
 *     "EventName": "...", "EventStartDate": "...", "EventEndDate": "...",
 *     "RequestName": "...", "RequestDeadline": "...", "RequestStatus": "..."
 *   }]
 *
 * Each operation fills in only the attributes it is responsible for, which is
 * why the readers below pick fields out rather than consuming whole objects.
 */

function asList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return [payload];
  return [];
}

/** Mendix serialises DateTime as ISO-8601. Anything unparseable becomes null. */
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** '11 Aug 2025' - the format Main.snip_ceomessage renders. */
export function formatLongDate(value) {
  const date = parseDate(value);
  if (!date) return typeof value === 'string' ? value : '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** '02-04-2026' - the format the Events listview renders. */
export function formatShortDate(value) {
  const date = parseDate(value);
  if (!date) return typeof value === 'string' ? value : '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * Mendix writes both RequestName and RequestStatus with `toString(<enum>)`,
 * which yields the enumeration *key* rather than its caption - `InProgress`,
 * `Additional_Info_Required`. This turns the key back into the caption the
 * enumeration declares ("In Progress", "Additional Info Required") so the card
 * reads the way the Mendix page does.
 */
function humaniseEnum(value) {
  const key = String(value ?? '').trim();

  if (!key) return '';

  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Turns the serialised EstimatedDeadline into a local midnight Date, so it can
 * be compared with `beginOfDay(new Date())` in ApprovalsCard.
 *
 * `Main.Request.EstimatedDeadline` has LocalizeDate = false: it is a plain date
 * pinned to UTC midnight, which Mendix renders unshifted in every time zone.
 * Reading it back with the UTC getters keeps it on that calendar day here;
 * local getters would slide it a day earlier for anyone west of UTC.
 */
function toLocalDateOnly(value) {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

/**
 * POST /rest/myservice/v1/CEOMessage -> Main.DS_PublishCeoMeassage
 *
 * The microflow retrieves the newest Dashboard.COMessage still inside its
 * EndDate for the CEO C-level role, plus the CEO's account, and returns a
 * single-element list. Returns null when no message is published.
 */
export async function fetchCeoMessage() {
  const rows = asList(await apiFetch(endpoints.ceoMessage, { method: 'POST' }));
  const row = rows.find((item) => item && (item.CEOMessage || item.CEOName));

  if (!row) return null;

  return {
    heading: 'SpotLight',
    body: row.CEOMessage ?? '',
    longBody: row.CEOLongMessage ?? '',
    name: row.CEOName ?? '',
    position: row.CEODesignation ?? '',
    date: formatLongDate(row.CEOMsgPublishDate),
    button: 'Read Full Message'
  };
}

/**
 * POST /rest/myservice/v1/Events -> Main.DS_PublishEvents
 *
 * One row per Dashboard.Event whose EndDate has not passed.
 */
export async function fetchEvents() {
  const rows = asList(await apiFetch(endpoints.events, { method: 'POST' }));

  return rows
    .filter((row) => row && row.EventName)
    .map((row) => ({
      title: row.EventName,
      date: formatShortDate(row.EventStartDate),
      endDate: formatShortDate(row.EventEndDate)
    }));
}

/**
 * The Approvals card's four tabs, each backed by its own resource on
 * DashboardService. Mendix does the filtering, so React picks the endpoint
 * that matches the open tab instead of filtering a single payload.
 */
export const REQUEST_TABS = {
  All: endpoints.allRequests,
  Pending: endpoints.pendingRequests,
  Approved: endpoints.approvedRequests,
  Rejected: endpoints.rejectedRequests
};

/**
 * POST one of the four request resources above.
 *
 * Each retrieves Main.RequestDetails constrained to `[System.owner=$currentUser]`
 * and sorted by CreationDate descending, then emits RequestName,
 * RequestDeadline and RequestStatus through EM_CEODetails. The microflows run
 * inside the authenticated Mendix session, so they scope to the signed-in user
 * themselves - React never passes a user id.
 *
 * Rows come back in the order Mendix sorted them, so they are not re-sorted
 * here; the API response *is* the CreationDate-descending order.
 *
 * The shape returned matches what ApprovalsCard renders: `requestType` and
 * `state` as captions, `deadlineDate` as a Date or null for deadlineLabel().
 */
export async function fetchRequests(tab) {
  const url = REQUEST_TABS[tab];

  if (!url) {
    throw new Error(`Unknown requests tab: ${tab}`);
  }

  const payload = await apiFetch(url, { method: 'POST' });
  const rows = asList(payload);

  /*
   * A row counts as a request if Mendix filled in ANY of the three request
   * columns. Keying only off RequestName would silently drop rows whose
   * RequestType enum happens to be empty - `toString(empty)` is '' - and an
   * empty tab looks identical to a broken endpoint.
   */
  const requests = rows
    .filter(
      (row) =>
        row &&
        typeof row === 'object' &&
        (row.RequestName || row.RequestStatus || row.RequestDeadline)
    )
    .map((row) => ({
      requestType: humaniseEnum(row.RequestName),
      state: humaniseEnum(row.RequestStatus),
      deadlineDate: toLocalDateOnly(row.RequestDeadline)
    }));

  /*
   * The endpoint answered but nothing survived parsing. That is the signature
   * of a response shaped differently from EM_CEODetails' flat array, and it is
   * invisible in the UI (the tab just says "No items found"), so say so here.
   * Field names only - no values are logged.
   */
  if (import.meta.env.DEV && requests.length === 0) {
    const sample = rows.find((row) => row && typeof row === 'object');
    console.warn(
      `[dashboardApi] ${tab}: response parsed to 0 requests.`,
      Array.isArray(payload) ? `array of ${rows.length}` : `type ${typeof payload}`,
      sample ? `first item keys: ${Object.keys(sample).join(', ')}` : 'no object items'
    );
  }

  return requests;
}
