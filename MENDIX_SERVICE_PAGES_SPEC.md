# Studio Pro spec — making the four service pages live

What to build in Studio Pro so the Digital Card, Drivers, Catering and Absence
pages in the React app read and write real Mendix data.

Nothing here touches existing pages, microflows or entities. Every operation is
a **thin wrapper** around logic the app already has — the validation, the save
and the submit microflows exist and are reused as-is. What is missing is only
the REST surface in front of them.

React is already written against this contract. Until an operation exists it
falls back to seeded demo data and says so in the dev console, so you can build
these one at a time and watch the page go live as each lands.

---

## 0. What exists today

Checked against the running app's own contracts (`/rest-doc/<service>/openapi.json`):

| Service | Path | Operations |
|---|---|---|
| LoginService | `react-auth/v1` | `POST /login` |
| DashboardService | `rest/myservice/v1` | `POST` CEOMessage, Events, All/Pending/Approved/RejectedRequests |
| ApprovalService | `rest/approvalservice/v1` | `GET POST PATCH /ehrequest` |
| ServiceRequests | `rest/servicerequests/v1` | `POST /DriverRequest` |
| AbsenceService | `rest/absenceservice/v1` | `GET /AbsenceEmployeeDetails`, `POST /SendAbsenceEligibility/{PersonID}` |

Everything the four pages need beyond that is unpublished.

---

## 1. Conventions

Follow what `DashboardService` already does, so this stays consistent with the app:

- **Auth**: `Active Session` on everything except `GET /session` (see §2).
- **Allowed roles**: the same set `DashboardService` uses.
- **Responses**: a microflow returning an object or list, through an **export
  mapping** over a non-persistent entity — the `Main.Dashboard_JsonObject`
  pattern. Do not expose persistent entities directly.
- **Errors**: return the status codes named below by setting
  `$httpResponse/StatusCode`. Never let a Java stack trace reach the client.
- **Dates**: `DateTime` serialises as ISO-8601. Keep `LocalizeDate = false` on
  date-only values (`Main.Request.EstimatedDeadline` already does) so they do
  not slide a day across time zones.

> **One naming gap.** The office-location lookup (§3.2) sits on the far side of
> `CorporateAdmin.DriversRequest_City` / `CorporateAdmin.FoodRequest_City`.
> Studio Pro will show you the entity; use its caption attribute for `label`.

---

## 2. Finish the session round-trip *(do this first)*

Without it, every browser refresh in a new tab drops the user back on the login
screen even though the Mendix session is alive. Both Java actions already exist
in `javasource/main/actions/`.

### 2.1 `GET /session` — add to the **existing** LoginService (`react-auth/v1`)

It must live on the **Authentication = None** service. Active Session would
require the CSRF token in order to hand back the CSRF token.

| | |
|---|---|
| Operation | `GET /session` on `LoginService` |
| Microflow | **new** `Main.ACT_GetReactSession` |
| Body | `JA_GetReactCsrfToken` → `$Token`. If `$Token = ''` → `StatusCode = 401` and return empty. Else return `Main.SessionResponse` |
| Entity | **new** non-persistable `Main.SessionResponse` : `Username` (String), `CsrfToken` (String) |
| Export mapping | **new** `Main.EM_SessionResponse`, exposed names `username`, `csrfToken` |

```json
200 → { "username": "aalnahdi", "csrfToken": "…" }
401 → (empty)
```

Safety: `JA_GetReactCsrfToken` already refuses to answer for an anonymous or
system session, which is what makes this safe on an unauthenticated service.

### 2.2 New service `ReactApiService` — `rest/react-api/v1`, Auth = Active Session

| Operation | Microflow | Returns |
|---|---|---|
| `POST /logout` | **new** `Main.ACT_LogoutReactSession` wrapping `JA_LogoutReactSession` | `204` |

---

## 3. New service `ReactServiceRequests` — `rest/react-svc/v1`, Auth = Active Session

### Phase 1 — lookups *(makes every dropdown and prefill real)*

These are pure reads and by far the cheapest win: four of the five already have
a microflow behind them.

| # | Operation | Microflow | Notes |
|---|---|---|---|
| 3.1 | `GET /me` | **new** `Main.DS_GetCurrentEmployeeJson` | Retrieve `Main.Employee` where `Main.Employee_Account = $currentUser` |
| 3.2 | `GET /offices` | **new** `CorporateAdmin.DS_GetOfficeLocationsJson` | Retrieve all rows of the city entity |
| 3.3 | `GET /food-types` | **new** `CorporateAdmin.DS_GetFoodRequestTypesJson` | `CorporateAdmin.FoodRequestType` sorted by `FoodRequestType` asc |
| 3.4 | `GET /employees` | wraps existing **`DigitalCard.ACT_GetEmployee`** | The Choose-Employee combo box |
| 3.5 | `GET /replaced-by` | wraps existing **`EmployeeSelfServices.DS_ReplacedByValues`** | |

**`GET /me`** — entity **new** `Main.EmployeeJson`, export mapping
`Main.EM_EmployeeJson`:

```json
{
  "employeeId": "BH-10427",
  "nameInEnglish": "Ammar Al-Nahdi",
  "nameInArabic": "…",
  "email": "…@bahri.sa",
  "positionTitle": "Project Manager",
  "positionArabic": "…",
  "department": "Fleet Operations",
  "location": "Riyadh Head Office",
  "extensionNo": "4182",
  "mobileNo": "966551002030",
  "telephoneNo": "966112750000",
  "empCountry": "Saudi Arabia",
  "joinDate": "2019-03-17T00:00:00Z"
}
```

`empCountry` matters: the Digital Card page hides both Arabic fields when it is
`USA` or `India`, exactly as `Visible: [toLowerCase($currentObject/EmpCountry) != …]` does.

**The four list operations** — one shared entity **new** `Main.LookupItem`
(`Id` String, `Label` String), export mapping `Main.EM_LookupItem`, exposed as
`id` and `label`:

```json
[ { "id": "…guid…", "label": "Riyadh Head Office" }, … ]
```

For `/employees` also expose the fields the page copies into the form when an
employee is chosen (`OCH_OnbehalfDigitalCard` does this server-side today), so
add to `Main.LookupItem` an optional `Detail` association to `Main.EmployeeJson`,
or simply return `Main.EmployeeJson` rows with `id`/`label` added.

### Phase 2 — the request lifecycle

One set of operations, parameterised by `{type}` ∈ `digitalcard | drivers | food | absence`.
Each wrapper switches on `{type}` and calls the microflow that already exists.

| # | Operation | Wraps (existing) |
|---|---|---|
| 3.6 | `POST /requests/{type}` | `DigitalCard.DS_DigitalCardRequest_2` / `EmployeeSelfServices.ACT_RedirectToAbsenceRequestPage_2` |
| 3.7 | `PATCH /requests/{type}/{id}` | `ACT_SaveDigitalCard` / `ACT_SaveDrivesRequest` / `ACT_SaveFoodRequest` / `ACT_SaveAbsenceRequest` |
| 3.8 | `POST /requests/{type}/{id}/submit` | `VAL_DigitalCardRequest`→`ACT_SendDigitalCardRequest` / `ACT_SendDriversRequest` / `ACT_SendFoodRequest` / `ACT_Create_AbsenceRequest_New` |
| 3.9 | `DELETE /requests/{type}/{id}` | `delete_object` |

**3.6 `POST /requests/{type}`** opens a request. It returns the object the page
binds to, prefilled the way the Mendix page is when it opens:

```json
{
  "requestId": 4418,
  "requestTitle": "Digital Card Request",
  "requestCode": 1007,
  "sla": 5,
  "referenceNo": "DGC-4418",
  "isDraftRecord": false,
  "estimatedDeadline": "2026-09-30T00:00:00Z",
  "fields": { "…": "the entity's own attributes, camelCased…" }
}
```

Entity **new** `Main.RequestJson` + export mapping `Main.EM_RequestJson`. Keep
`fields` flat per type — four small non-persistable entities
(`DigitalCardRequestJson`, `DriversRequestJson`, `FoodRequestJson`,
`AbsenceRequestJson`) is clearer than one union.

**3.8 submit** is the one that must report failure properly, because this is
where the page shows its validation:

```json
200 → { "success": true,  "referenceNo": "DGC-4418" }
422 → { "success": false, "errors": [ { "field": "NameinEnglish", "message": "This field is required." } ] }
```

The `field` values must be the **entity attribute names** — the React pages key
their `.has-error` state on exactly those, and the messages are already written
in `VAL_DigitalCardRequest` (`'This field is required.'`,
`'Location field is required.'`, `'Please select valid date!'`,
`'Length of mobile no should be less than 20!'`, `'Please enter valid mobile number!'`,
`'Please choose an employee!'`).

Today those checks call `validation feedback`, which only works against a live
page. Wrap them: have the VAL_ microflow also build a list of
`Main.ValidationError` (`Field`, `Message`) and return it.

### Phase 3 — comments and attachments

| # | Operation | Wraps |
|---|---|---|
| 3.10 | `GET /requests/{id}/comments` | `DigitalCard.DS_RetrieveAll_Comments` (generalise to any `Main.Request`) |
| 3.11 | `POST /requests/{id}/comments` | `Main.ACT_CreateComment` — body `{ "comment": "…" }` |
| 3.12 | `DELETE /requests/{id}/comments/{commentId}` | `delete_object` |
| 3.13 | `GET /requests/{id}/attachments` | `DigitalCard.DS_RetrieveAll_Attachments` |
| 3.14 | `POST /requests/{id}/attachments` | `Main.DS_SaveAddAttachment` — **`multipart/form-data`**, the file part plus `type` |
| 3.15 | `DELETE /requests/{id}/attachments/{attachmentId}` | `delete_object` |

```json
comment    → { "id": "…", "comment": "…", "createdBy": "…", "createdDate": "…", "isOwn": true }
attachment → { "id": "…", "name": "report.pdf", "type": "Supporting document", "url": "/file?…" }
```

`isOwn` carries what the snippet expresses as
`$currentObject/System.owner = [%CurrentUser%] and $currentObject/IsNew` — it is
what decides whether the row is editable and shows its delete button.

### Phase 4 — the absence rail

| # | Operation | Wraps (existing) |
|---|---|---|
| 3.16 | `GET /absence/balance` | `EmployeeSelfServices.DS_ShowAbsenceBalance` |
| 3.17 | `GET /absence/history` | `EmployeeSelfServices.DS_GetAbsenceHistory` |
| 3.18 | `GET /absence/duration?start=&end=` | `EmployeeSelfServices.DS_AbsenceTypeTotalDuration` |

```json
balance  → { "absenceBalance": 18.5, "plannedLeave": 4 }
history  → [ { "absenceType": "Annual Leave", "duration": "5",
               "startDate": "12-05-2026", "endDate": "16-05-2026",
               "approvalStatusCd": "APPROVED", "absenceStatusCd": "ORA_APPROVED" } ]
duration → { "totalDuration": "6" }
```

**Do not** return `ChartCode`. The donut is drawn in React from
`absenceBalance` + `plannedLeave` with the same Highcharts options the
microflow's HTML uses, so the chart stays a client concern and the endpoint
stays data-only.

`DS_ShowAbsenceBalance` currently takes an `AbsenceRequest` in order to compute
the projected balance. Split it: the endpoint returns the two stored figures and
React derives the projection, which it already does.

---

## 4. Order of work

Each phase is independently useful — React goes live per operation, no big bang.

1. **§2** session round-trip — stops the refresh-to-login annoyance.
2. **§3 Phase 1** lookups — five reads, every dropdown and prefill becomes real.
3. **§3 Phase 2** lifecycle — Submit and Save as Draft write to Mendix.
4. **§3 Phase 4** absence rail — real balance and history.
5. **§3 Phase 3** comments and attachments — the file upload is the fiddliest, so last.

## 5. Known defects to fix while you are in there

| Where | Problem | Fix |
|---|---|---|
| `Main.ACT_LoginAuthenticate` | `on error … return ''` turns every failure — wrong password, a runtime error, a null response — into an identical `HTTP 200` with an empty body. Undiagnosable from the client | Return `401` with a message on failure, per `MENDIX_INTEGRATION.md` §2.3 |
| `Main.ACT_LoginAuthenticate` | Returns a bare `String` | Return `Main.LoginResponse` so `username` comes back too |
| Published services | `OPTIONS` answers `405`, so no browser can call these cross-origin | Not needed while React is served through the vite proxy. It **will** matter for a deployed React app on its own domain |
