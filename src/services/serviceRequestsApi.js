import { apiFetch, SessionExpiredError } from './mendixAuth.js';
import { ABSENCE_TYPE_ID, endpoints } from './mendixConfig.js';
import {
  absenceBalance as staticAbsenceBalance,
  absenceHistory as staticAbsenceHistory,
  currentEmployee as staticCurrentEmployee,
  employees as staticEmployees,
  foodRequestTypes as staticFoodRequestTypes,
  officeLocations as staticOfficeLocations,
  replacedByOptions as staticReplacedBy,
  nextRequestId,
  requestsList,
  slaDate
} from '../data/serviceData.js';

/**
 * Live data for the four employee service request pages.
 *
 * Every function here answers `{ data, live }`. `live` says whether the value
 * came from Mendix or from the seeded replication in serviceData.js, so a page
 * can show real data the moment an endpoint is published without any change on
 * this side, and still render before it exists.
 *
 * The endpoints are the contract in MENDIX_SERVICE_PAGES_SPEC.md. None of them
 * is published yet, which is the point of the fallback: build them one at a
 * time in Studio Pro and each page goes live as its operation lands.
 *
 * A dead session is NOT a fallback case. SessionExpiredError is re-thrown so
 * the caller can sign the user out - silently serving demo data to someone
 * whose session has gone would be worse than an error.
 */

/** Endpoints already reported as absent, so the warning is printed once each. */
const announced = new Set();

function fallbackWarn(label, url, error) {
  if (!import.meta.env.DEV || announced.has(label)) return;
  announced.add(label);
  console.warn(
    `[service-pages] ${label}: ${url} -> ${error?.message ?? error}. ` +
      'Falling back to seeded data (see MENDIX_SERVICE_PAGES_SPEC.md).'
  );
}

/**
 * Calls Mendix, and on any failure other than a dead session answers with the
 * seeded value instead.
 */
async function liveOr(label, url, fallback, options) {
  try {
    const data = await apiFetch(url, options);
    return { data, live: true };
  } catch (error) {
    if (error instanceof SessionExpiredError) throw error;
    fallbackWarn(label, url, error);
    return { data: fallback, live: false };
  }
}

/** Mendix serialises a single object or a one-element array interchangeably. */
function first(payload) {
  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload ?? null;
}

/* ------------------------------------------------------------- Phase 1 */

/** GET /me - the signed-in employee, which prefills the Digital Card form. */
export async function fetchCurrentEmployee() {
  const { data, live } = await liveOr('me', endpoints.me, null);
  if (!live || !data) return { data: staticCurrentEmployee, live: false };

  const row = first(data);
  return {
    live: true,
    data: {
      EmployeeID: row.employeeId ?? '',
      NameinEnglish: row.nameInEnglish ?? '',
      NameInArabic: row.nameInArabic ?? '',
      Email: row.email ?? '',
      PositionTitle: row.positionTitle ?? '',
      PostionArabic: row.positionArabic ?? '',
      Department: row.department ?? '',
      Location: row.location ?? '',
      ExtentionNo: row.extensionNo ?? '',
      MobileNo: row.mobileNo ?? '',
      TelephoneNo: row.telephoneNo ?? '',
      EmpCountry: row.empCountry ?? '',
      JoinDate: (row.joinDate ?? '').slice(0, 10)
    }
  };
}

/** The four lookup lists all answer `[{ id, label }]`. */
async function fetchLookup(label, url, fallback, toOption) {
  const { data, live } = await liveOr(label, url, null);
  if (!live || !Array.isArray(data)) return { data: fallback, live: false };
  return { data: data.map(toOption), live: true };
}

export function fetchEmployees() {
  return fetchLookup('employees', endpoints.employees, staticEmployees, (row) => ({
    id: row.id,
    Name: row.label,
    /* the page copies these into the form when an employee is chosen */
    EmployeeID: row.employeeId ?? '',
    NameInArabic: row.nameInArabic ?? '',
    Email: row.email ?? '',
    PositionTitle: row.positionTitle ?? '',
    PostionArabic: row.positionArabic ?? '',
    Department: row.department ?? '',
    Location: row.location ?? '',
    ExtentionNo: row.extensionNo ?? '',
    MobileNo: row.mobileNo ?? '',
    TelephoneNo: row.telephoneNo ?? '',
    EmpCountry: row.empCountry ?? '',
    JoinDate: (row.joinDate ?? '').slice(0, 10)
  }));
}

/*
 * GET /officelocation -> [{ Title, Timezone, Latitude, Longitude, Code,
 *                          CountryCode, IATA }]
 *
 * `id` is the Title rather than a surrogate, because the Title is exactly what
 * SubmitDriverRequest and SubmitFoodRequest take back as OfficeLocation - so
 * whatever the select holds is already the value that gets posted.
 */
export function fetchOfficeLocations() {
  return fetchLookup(
    'officelocation',
    endpoints.serviceRequests.officeLocation,
    staticOfficeLocations,
    (row) => ({
      id: row.Title ?? '',
      caption: row.Title ?? '',
      code: row.Code ?? '',
      timezone: row.Timezone ?? ''
    })
  );
}

/** GET /foodreqtypes -> [{ FoodRequestType, changedDate, createdDate }] */
export function fetchFoodRequestTypes() {
  return fetchLookup(
    'foodreqtypes',
    endpoints.serviceRequests.foodReqTypes,
    staticFoodRequestTypes,
    (row) => ({
      id: row.FoodRequestType ?? '',
      FoodRequestType: row.FoodRequestType ?? ''
    })
  );
}

/**
 * GET /replacedby -> [{ PersonNumber, MaskedName, EmployeeName }]
 *
 * submitabsence wants both halves back - ReplacedByPersonNumber and the name in
 * ReplacedBy - so the option carries both and the page sends the pair.
 */
export function fetchReplacedByOptions() {
  return fetchLookup(
    'replacedby',
    endpoints.serviceRequests.replacedBy,
    staticReplacedBy,
    (row) => ({
      id: row.PersonNumber ?? '',
      caption: row.EmployeeName ?? row.MaskedName ?? '',
      personNumber: row.PersonNumber ?? '',
      maskedName: row.MaskedName ?? ''
    })
  );
}

/* ------------------------------------------------------------- Phase 2 */

/**
 * POST /requests/{type} - opens a request, the way the Mendix nav microflows
 * do: create the object, resolve its Main.RequestsList row, return both.
 */
export async function openRequest(type) {
  const seed = requestsList[type];
  const offline = {
    requestId: nextRequestId(),
    requestTitle: seed.RequestTitle,
    requestCode: seed.RequestCode,
    sla: seed.SLA,
    referenceNo: null,
    isDraftRecord: false,
    estimatedDeadline: slaDate(seed.SLA),
    fields: {}
  };

  const { data, live } = await liveOr(
    `open:${type}`,
    endpoints.openRequest(type),
    offline,
    { method: 'POST' }
  );

  return { data: live ? first(data) ?? offline : offline, live };
}

/* ------------------------------------------ ServiceRequests: submit & draft */

/**
 * The service takes date-times; the pickers hold 'YYYY-MM-DD' and 'HH:mm'.
 * Driver's FromTime and ToTime are times OF the request date, so they are built
 * from both.
 */
function dateTime(date, time) {
  if (!date) return '';
  return `${date}T${time ? `${time}:00` : '00:00:00'}`;
}

/** The absence operations are the only ones whose dates carry a zone. */
function utcDateTime(date) {
  return date ? `${date}T00:00:00Z` : '';
}

/** The rows the comments snippet edits, as the list-taking operations want them. */
function commentRows(comments) {
  return (comments ?? [])
    .map((row) => String(row.Comment ?? '').trim())
    .filter(Boolean)
    .map((CommentValue) => ({ CommentValue }));
}

/**
 * One builder per request type, from the attribute names the pages already use
 * to the field names the service publishes. Submit and Draft take the same body
 * on every type, so there is one builder each, not two.
 */
const BODY = {
  drivers: (f, comments) => ({
    Email: f.Email ?? '',
    DriverType: f.DriverType ?? '',
    OfficeLocation: f.City ?? '',
    RequestDate: dateTime(f.RequestDate),
    FromTime: dateTime(f.RequestDate, f.FromTime),
    ToTime: dateTime(f.RequestDate, f.ToTime),
    Description: f.Description ?? '',
    Comments: commentRows(comments)
  }),

  food: (f, comments) => ({
    Email: f.Email ?? '',
    FoodRequestType: f.FoodRequest_FoodRequestType ?? '',
    OfficeLocation: f.City ?? '',
    RequestDate: dateTime(f.RequestDate),
    FoodType: f.FoodType ?? '',
    NumberOfGuests: Number(f.Number_of_Guests) || 0,
    Budget: Number(f.Budget) || 0,
    Description: f.Description ?? '',
    Comments: commentRows(comments)
  }),

  digitalCard: (f, comments) => ({
    IsPhysicalCard: Boolean(f.IsPhysicalCard),
    NameInEnglish: f.NameinEnglish ?? '',
    Email: f.Email ?? '',
    PositionInEnglish: f.PositionTitle ?? '',
    ExtensionNumber: f.ExtentionNo ?? '',
    MobileNumber: f.MobileNo ?? '',
    TelephoneNumber: f.TelephoneNo ?? '',
    Location: f.Location ?? '',
    Department: f.Department ?? '',
    JoinDate: dateTime(f.JoinDate),
    EstimatedDeadline: dateTime(f.EstimatedDeadline),
    Comments: commentRows(comments)
  }),

  /* The one operation whose Comments is the reason text, not a list of rows. */
  absence: (f) => ({
    RequestId: f.RequestId ?? '',
    Email: f.Email ?? '',
    AbsenceTypeId: ABSENCE_TYPE_ID,
    StartDate: utcDateTime(f.StartDate),
    EndDate: utcDateTime(f.EndDate),
    FirstSecondHalf: f.FirstSecondHalf ?? '',
    ReplacedByPersonNumber: f.ReplacedByPersonNumber ?? '',
    ReplacedBy: f.ReplacedBy ?? '',
    EmergencyContactNumber: f.EmergencyContactNumber ?? '',
    Comments: f.Comments ?? ''
  })
};

/**
 * Both operations answer `{ Status, ReferenceNumber }` - "Success" on the three
 * request types, "Submitted" and "Draft" on absence.
 *
 * Except that submitabsence and absencedraft declare `text/plain` in the
 * deployment's own contract, not application/json. apiFetch parses by content
 * rather than by header, so a JSON body still arrives as an object - but a bare
 * string, or a body it cannot parse, arrives as null. Reaching here at all
 * means the call returned 2xx (apiFetch throws otherwise), so an unreadable
 * body is a success without a reference number, never a failure.
 */
function outcome(payload) {
  if (payload === null || payload === undefined) {
    return { ok: true, status: '', referenceNo: null, message: null };
  }

  if (typeof payload === 'string') {
    const text = payload.trim();
    const failed = /error|fail|invalid|denied/i.test(text);
    return {
      ok: !failed,
      status: text,
      /* a bare reference number is the only string worth keeping */
      referenceNo: !failed && /^[A-Za-z]{2,5}-?\d+$/.test(text) ? text : null,
      message: failed ? text : null
    };
  }

  const row = first(payload) ?? {};
  const status = String(row.Status ?? '');

  /* A 2xx with an object that carries no Status is still a 2xx. */
  if (!status) {
    return {
      ok: true,
      status: '',
      referenceNo: row.ReferenceNumber ?? null,
      message: null
    };
  }

  return {
    ok: /^(success|submitted|draft|saved)$/i.test(status),
    status,
    referenceNo: row.ReferenceNumber ?? null,
    message: row.Message ?? row.message ?? null
  };
}

/**
 * Posts a request body and reports honestly what came back.
 *
 * Unlike the lookups above, this does NOT fall back to seeded data. A submit
 * that never reached Mendix is a failure, and showing the success pop-up for it
 * would be worse than showing the error. Only a dead session is special, and
 * that still signs the user out.
 */
async function send(kind, type, fields, comments) {
  const url = endpoints.serviceRequests[kind][type];
  const build = BODY[type];

  if (!url || !build) {
    return { ok: false, referenceNo: null, message: `No ${kind} operation for ${type}.` };
  }

  try {
    const data = await apiFetch(url, { method: 'POST', body: build(fields, comments) });
    const result = outcome(data);

    return {
      ok: result.ok,
      referenceNo: result.referenceNo,
      message: result.ok
        ? null
        : result.message ?? `The request was not accepted (${result.status || 'no status'}).`
    };
  } catch (error) {
    if (error instanceof SessionExpiredError) throw error;
    if (import.meta.env.DEV) console.warn(`[service-pages] ${kind}:${type} -> ${url}`, error);
    return {
      ok: false,
      referenceNo: null,
      message: `Could not reach the service. ${error.message}`
    };
  }
}

/** POST /Draft{Type}Request, /absencedraft - Save as Draft. */
export function saveRequestDraft(type, fields, comments) {
  return send('draft', type, fields, comments);
}

/** POST /Submit{Type}Request, /submitabsence. */
export function submitRequest(type, fields, comments) {
  return send('submit', type, fields, comments);
}

/** DELETE /requests/{type}/{id} */
export function deleteRequest(type, id) {
  return liveOr(`delete:${type}`, endpoints.deleteRequest(type, id), { deleted: false }, {
    method: 'DELETE'
  });
}

/* ------------------------------------------------------------- Phase 4 */

export async function fetchAbsenceBalance() {
  const { data, live } = await liveOr('absence/balance', endpoints.absenceBalance, null);
  if (!live || !data) return { data: staticAbsenceBalance, live: false };

  const row = first(data) ?? {};
  return {
    live: true,
    data: {
      AbsenceBalance: Number(row.absenceBalance ?? 0),
      PlannedLeave: Number(row.plannedLeave ?? 0)
    }
  };
}

export async function fetchAbsenceHistory() {
  const { data, live } = await liveOr('absence/history', endpoints.absenceHistory, null);
  if (!live || !Array.isArray(data)) return { data: staticAbsenceHistory, live: false };

  return {
    live: true,
    data: data.map((row, index) => ({
      id: row.id ?? `h-${index}`,
      AbsenceType: row.absenceType ?? '',
      Duration: String(row.duration ?? ''),
      StartDate: row.startDate ?? '',
      EndDate: row.endDate ?? '',
      ApprovalStatusCd: row.approvalStatusCd ?? '',
      AbsenceStatusCd: row.absenceStatusCd ?? ''
    }))
  };
}

/* ------------------------------------------------------------- Phase 3 */

export async function fetchComments(requestId) {
  const { data, live } = await liveOr(`comments:${requestId}`, endpoints.comments(requestId), null);
  if (!live || !Array.isArray(data)) return { data: [], live: false };

  return {
    live: true,
    data: data.map((row) => ({
      id: row.id,
      Comment: row.comment ?? '',
      createdBy: row.createdBy ?? '',
      isOwn: row.isOwn !== false
    }))
  };
}

export function createComment(requestId, comment) {
  return liveOr(`comment+:${requestId}`, endpoints.comments(requestId), null, {
    method: 'POST',
    body: { comment }
  });
}

export function deleteComment(requestId, commentId) {
  return liveOr(`comment-:${requestId}`, endpoints.comment(requestId, commentId), null, {
    method: 'DELETE'
  });
}

export async function fetchAttachments(requestId) {
  const { data, live } = await liveOr(
    `attachments:${requestId}`,
    endpoints.attachments(requestId),
    null
  );
  if (!live || !Array.isArray(data)) return { data: [], live: false };

  return {
    live: true,
    data: data.map((row) => ({
      id: row.id,
      Name: row.name ?? '',
      type: row.type ?? '',
      url: row.url ?? null
    }))
  };
}

export function deleteAttachment(requestId, attachmentId) {
  return liveOr(`attachment-:${requestId}`, endpoints.attachment(requestId, attachmentId), null, {
    method: 'DELETE'
  });
}
