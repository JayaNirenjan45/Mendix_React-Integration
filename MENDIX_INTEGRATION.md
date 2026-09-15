# React ⇄ Mendix session authentication — implementation status

Target: `React_Mendix_Session_Authentication_Prompt.md`
Mendix Studio Pro **11.12.1** · Java 21 · React app at
`C:\Users\JayanirenjanChellaku\Downloads\Bahri React\Bahri React`

Nothing here has been committed. No unrelated module was touched.

---

## 1. What is already done

### 1.1 Java (done — compiles clean against 11.12.1)

| File | State |
| --- | --- |
| `javasource/main/actions/JA_CreateReactSession.java` | **Fixed** |
| `javasource/main/actions/JA_LogoutReactSession.java` | **New** |
| `javasource/main/actions/JA_GetReactCsrfToken.java` | **New** |

**The error you asked about.** `JA_CreateReactSession` did not compile. The
Java action's parameter is named `UserName`, so Studio Pro generates the field
`private final java.lang.String UserName`, but the user code inside
`BEGIN USER CODE` referenced `this.Username` in two places:

```java
if (this.Username == null || this.Username.trim().isEmpty())   // cannot resolve
ISession session = Core.login(this.Username, this.Password, request);
```

Both are now `this.UserName`. Everything else in the action was left as written.

Each of the three files was compiled against
`C:\Program Files\Mendix\11.12.1\runtime\bundles\com.mendix.public-api.jar`
and all three produce zero errors.

**API verification** (prompt §19 — checked against the installed 11.12.1 jar,
not assumed):

```
Core.login(String, String, IMxRuntimeRequest)                                 ✔
Core.addMendixCookies(IMxRuntimeRequest, IMxRuntimeResponse, ISession, bool)  ✔
Core.logout(ISession)                                                         ✔
ISession.getCsrfToken()          ISession.isSystemSession()                   ✔
IContext.getRuntimeRequest()  /  getRuntimeResponse()  -> Optional<...>       ✔
IContext.getSession()                                                         ✔
```

The code in the prompt matches this version exactly; no adaptation was needed.

### 1.2 Why `JA_GetReactCsrfToken` exists

Prompt §14 leaves the refresh strategy open. React keeps the CSRF token in
memory only, so a browser refresh loses it while the HttpOnly `XASSESSIONID`
cookie survives — the user would be bounced back to the login screen with a
perfectly valid server-side session still open.

`JA_GetReactCsrfToken` returns the CSRF token of the session the request is
*already* running in. Published behind **GET** `/rest/react-api/v1/session`
with Active Session authentication, it lets React re-adopt its own session
without ever seeing the session id. It must be a GET — a POST would itself
require the token being recovered.

### 1.3 React (done — `npm run build` is clean)

```
src/services/mendixConfig.js        endpoints + origin
src/services/mendixAuth.js          login / bootstrap / apiFetch / logout
src/services/dashboardApi.js        CEO message, events, the 4 request tabs
src/auth/AuthContext.jsx            session state for the component tree
src/components/LoginPage.jsx        sign-in screen
src/styles/gs-bahri/gs-login.scss   sign-in styles + header sign-out
src/data/DashboardDataProvider.jsx  loads the live datasets + per-tab requests
```

Modified: `App.jsx` (auth gate), `main.jsx` (stylesheet), `vite.config.js`
(proxy + session host isolation), `NewLayout.jsx` (sign-out button; the
header name stays the static `Ammar Al-Nahdi` caption),
`CeoMessageSnippet.jsx`, `ScheduleAndEvents.jsx`, `ApprovalsCard.jsx`.

Security rules from §1 and §16, as implemented:

- `XASSESSIONID` is never read, written, stored or logged. `credentials:
  "include"` is what puts it on the wire; the runtime owns the cookie.
- The CSRF token lives in one module-scoped variable in `mendixAuth.js`. Not
  localStorage, not sessionStorage, not React state, not a JS cookie.
- The password exists only in the login form's state and is cleared the moment
  the request settles, success or failure.
- Nothing logs a password, session id or token.
- Authentication failures surface one generic message.
- Logout calls the server and then forgets the token; it never tries to delete
  the HttpOnly cookie.

### 1.4 How the session actually reaches `DS_PublishCeoMeassage` and friends

Worth being precise about, because it changes what you model.

The CSRF token is **not** passed as a parameter to the dashboard microflows.
Nothing is. `DS_PublishCeoMeassage`, `DS_PublishEvents` and the four `DS_Get*Requests`
keep their existing `httpRequest` / `httpResponse` parameters and take no others.

What happens on the wire after a successful login:

```
POST /react-auth/v1/login          <- Authentication = None
        |
        v
Core.login()  ->  ISession  ->  Core.addMendixCookies()
        |
        +--> Set-Cookie: XASSESSIONID=...; HttpOnly     (browser stores it)
        +--> response body: the CSRF token              (React holds in memory)

POST /rest/myservice/v1/CEOMessage <- Authentication = Active session
        |
        +--  Cookie: XASSESSIONID=...     added by the browser, automatically
        +--  X-Csrf-Token: <token>        added by React, as a header
        |
        v
Mendix resolves the cookie to the ISession, authenticates the request, and runs
the microflow as that user. $currentUser inside the microflow is the logged-in
employee.
```

So the session is carried by the **cookie**, and the CSRF token by a **header**.
Neither is a microflow argument, and neither should be: prompt §1 rules 2–4
forbid exposing `XASSESSIONID` to React at all, and §10 shows the protected call
carrying exactly these two things. `apiFetch()` in `mendixAuth.js` is the one
place that attaches both.

The practical consequence for your microflows: because they run inside the
authenticated session, the `DS_Get*Requests` microflows scope to
`[System.owner=$currentUser]` on their own. React never sends a user id, and must not be able to.

### 1.5 One shared session across both apps (SESSION_MODE)

**What decides this.** Cookies are scoped by **hostname only** - the port is
not part of a cookie's identity (RFC 6265 section 8.5). That single fact
controls whether the React app and the Mendix app share a Mendix session:

```
same hostname  -> one cookie jar -> one XASSESSIONID -> ONE Mendix ISession
different host -> separate jars  -> two independent sessions
```

The CSRF token is *not* the sharing mechanism. It is per-session and returned
by login; once the session is shared, the token React holds simply is that
shared session's token.

**Default: `SESSION_MODE=shared`.** React is served on the same hostname as the
runtime, so signing in from React runs `Core.login()`, `Core.addMendixCookies()`
writes `XASSESSIONID` for that hostname, and the Mendix app picks up the very
same session. Signing out of either ends both.

```
React   http://localhost:5173  --+
                                 +-- one XASSESSIONID on `localhost`
Mendix  http://localhost:8080  --+
```

Verified: after signing in through React on `localhost`, every request to any
`localhost` port - the Mendix app included - carries the session cookie, while
`127.0.0.1` carries nothing.

**`SESSION_MODE=separate`** puts React on a different hostname (`127.0.0.1` vs
`localhost`) so each app gets its own cookie jar and its own session.

`vite.config.js` validates the two hostnames against the chosen mode and
refuses to start on a contradiction, because a mismatch fails silently - you
only notice when a login in one app does, or does not, appear in the other.

**In production** the same rule applies. One hostname behind a reverse proxy
(the topology prompt section 15 recommends) gives a shared session and needs no
CORS. Separate sessions need separate hostnames, which is cross-site and
therefore needs the CORS block in section 2.6 plus `SameSite=None; Secure`.

---

## 2. What you still have to do in Studio Pro

The model lives in `App.mpr`, a binary SQLite file with content-hashed units in
`mprcontents/`. Editing it outside Studio Pro corrupts the project, so
**everything below has to be done in the tool.** These are the exact steps.

### 2.1 Fix `Main.IM_LoginReact` — it expects an array, React sends an object

The mapping's JSON paths are currently:

```
(Array)|(Object)|username
(Array)|(Object)|password
```

The root is an **array**, so a body of `{"username":...,"password":...}` will
not map. The prompt (§8) specifies the object form, and that is what React
sends.

Fix: open the message definition `Main.LoginReact.loginreact` and regenerate
the structure from this snippet instead:

```json
{ "username": "", "password": "" }
```

Then reopen `IM_LoginReact` and confirm the paths read `(Object)|username` and
`(Object)|password`.

> If you would rather leave the mapping alone, the alternative is to make React
> post `[{ "username": ..., "password": ... }]`. Not recommended — it bakes a
> Mendix mapping quirk into the client contract.

### 2.2 `LoginService` path — already handled on the React side

`Published REST Services > LoginService > Path` reads `react-auth/v1`, so the
live URL is:

```
http://localhost:8080/react-auth/v1/login
```

React now targets exactly that, so **no Studio Pro change is required** and the
login button works as-is. Note it is the only service in this app that does not
sit under `rest/`. If you ever renormalise it to `rest/react-auth/v1`, set
`VITE_MENDIX_AUTH_BASE=/rest/react-auth/v1` in the React `.env` at the same
time, or login will 404.

### 2.3 Rewrite `Main.ACT_LoginAuthenticate` to return the §7 contract

Today the microflow returns a bare `String` — the raw CSRF token — and always
answers HTTP 200. The prompt requires a JSON body and a 401 on failure.

**a. New non-persistable entity** `Main.LoginResponse`:

```
Success   : Boolean
Username  : String
CsrfToken : String
Message   : String
```

Do **not** add `SessionId`, `XASSESSIONID`, `Password` or any auth token (§3).

**b. New export mapping** `Main.EM_LoginResponse` over `Main.LoginResponse`,
with exposed names exactly `success`, `username`, `csrfToken`, `message`.

> **React already works without this step.** `ACT_LoginAuthenticate`'s return
> type is `String` today, so the operation emits the bare CSRF token rather
> than a `LoginResponse` object. `mendixAuth.js` accepts both shapes, so login
> succeeds against the model as it stands. Doing this step still matters: it is
> what produces the **HTTP 401** on bad credentials (right now a failed login
> answers `200` with an empty body) and the `username` in the response.

**c. Rebuild the microflow** (it currently has a stray second end event with an
empty return value — delete it):

```
httpRequest, httpResponse, LoginReact
        |
        v
JA_CreateReactSession($LoginReact/username, $LoginReact/password) -> $JSONResponse
        |
        v
Decision:  $JSONResponse = ''
        |
        +-- true  --> Change httpResponse: StatusCode = 401
        |              Create LoginResponse:
        |                Success   = false
        |                Username  = ''
        |                CsrfToken = ''
        |                Message   = 'Invalid username or password'
        |
        +-- false --> Change httpResponse: StatusCode = 200
                       Create LoginResponse:
                         Success   = true
                         Username  = $LoginReact/username
                         CsrfToken = $JSONResponse
                         Message   = 'Login successful'
        |
        v
End: return the LoginResponse object
```

Set the microflow's return type to `Object : Main.LoginResponse`, and set the
`POST /login` operation's **export mapping** to `EM_LoginResponse`.

Never surface a Java exception or stack trace here (§7, §17 test 2).

**d.** Leave the service's `Authentication` as **None** — it is already correct.
`Main.LoginReact` is already non-persistable and already grants `Main.Anonymous`
read/write on `username` and `password`, so no security change is needed.

### 2.4 New Published REST Service `ReactApiService`

```
Name            ReactApiService
Path            rest/react-api/v1
Authentication  Active Session
Allowed roles   the same set DashboardService uses
```

| Method | Resource | Microflow |
| --- | --- | --- |
| `GET` | `session` | `Main.ACT_GetReactSession` |
| `GET` | `test` | `Main.ACT_TestReactSession` |
| `POST` | `logout` | `Main.ACT_LogoutReact` |

**`ACT_GetReactSession`** — the §14 bootstrap. Must be GET.

```
JA_GetReactCsrfToken -> $CsrfToken
   $CsrfToken = ''  --true-->  httpResponse.StatusCode = 401, Success = false
                    --false->  StatusCode = 200
                                Success   = true
                                Username  = $currentUser/Name
                                CsrfToken = $CsrfToken
                                Message   = 'Session active'
return LoginResponse        (export mapping EM_LoginResponse)
```

**`ACT_TestReactSession`** — the §9 probe. Returns
`{"success": true, "message": "Authenticated Mendix session is active"}`.
Retrieve `$currentUser` in it to confirm the microflow really runs as the
logged-in Mendix user, not as a guest.

**`ACT_LogoutReact`** — §12.

```
JA_LogoutReactSession  ->  Core.logout(currentSession)
return { "success": true, "message": "Logout successful" }   -> HTTP 200
```

Create the two Java actions in Studio Pro under `Main` with **exactly** these
names and signatures, so Studio Pro merges with the `.java` files already on
disk instead of overwriting them:

| Java action | Parameters | Return |
| --- | --- | --- |
| `JA_LogoutReactSession` | none | `Boolean` |
| `JA_GetReactCsrfToken` | none | `String` |

### 2.5 Add the status filters to the three request microflows

**Done:** `DashboardService` now publishes four request resources, and React is
wired to all four — one endpoint per tab, fetched when the tab is opened and
then cached:

| Tab | Resource (POST) | Microflow |
| --- | --- | --- |
| All | `AllRequests` | `Main.DS_GetAllRequests` |
| Pending | `PendingRequests` | `Main.DS_GetPendingRequests` |
| Approved | `ApprovedRequests` | `Main.DS_GetApprovedRequests` |
| Rejected | `RejectedRequests` | `Main.DS_GetRejectedRequests` |

**Outstanding — and it will show:** all four microflows are currently
*identical*. Each one retrieves `Main.RequestDetails` with the single
constraint:

```
[System.owner=$currentUser]
```

sorted by `CreationDate` descending. None of them contains a decision, a list
filter, or any constraint on `State`, so **`PendingRequests`,
`ApprovedRequests` and `RejectedRequests` return every request** — the three
filtered tabs will show exactly what `All` shows.

The filter belongs in the microflow, not in React. `Main.RequestDetails.State`
is an enumeration, `Main.ENUM_State`, with these values:

```
Draft   InProgress   Rejected   Completed   Submitted
Failed  Cancelled    Initiated  Withdrawn   Additional_Info_Required
```

Your own dashboard page already defines each tab, and those microflows carry
the filters. Copy them verbatim - they are this app's authoritative definition
of what each tab means:

```
page microflow          constraint              -> copy into
DS_PendingRequests      [State = 'InProgress']     DS_GetPendingRequests
DS_ApproveRequests      [State = 'Completed']      DS_GetApprovedRequests
DS_RejectedRequests     [State = 'Rejected']       DS_GetRejectedRequests
```

Add the matching constraint alongside the existing owner constraint, e.g.:

```
DS_GetPendingRequests   [System.owner=$currentUser][State = 'InProgress']
DS_GetApprovedRequests  [System.owner=$currentUser][State = 'Completed']
DS_GetRejectedRequests  [System.owner=$currentUser][State = 'Rejected']
```

`DS_GetAllRequests` stays unconstrained on State.
React needs no change when you do this; it already asks each tab's own
endpoint and renders whatever comes back.

#### How the rows are rendered

`RequestName` and `RequestStatus` are written with `toString(<enum>)`, which
emits the enumeration **key** (`LeaveRequest`, `InProgress`,
`Additional_Info_Required`). React converts the key back to the caption the
enumeration declares, so the card shows "Leave Request", "In Progress",
"Additional Info Required".

`RequestDeadline` is `Main.Request.EstimatedDeadline`, a DateTime, rendered
with the **same `dd-MM-yyyy` formatter the Events list uses**. It is frequently
empty, in which case the row renders without a date line rather than showing a
placeholder.

The count badge on the card reflects the `All` tab.

---

### 2.6 CORS — only if you are not using the proxy

With the Vite proxy (§3 below) React and Mendix share an origin and no CORS
configuration is required. For a split-origin deployment, set on **both**
services:

```
Access-Control-Allow-Origin:      https://<exact React origin>   <- never *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers:     Content-Type, X-Csrf-Token
Access-Control-Allow-Methods:     GET, POST, PUT, PATCH, DELETE, OPTIONS
```

and check `com.mendix.core.SameSiteCookies` plus HTTPS, because a cross-site
`XASSESSIONID` needs `SameSite=None; Secure`.

---

## 3. Running the two apps together

Mendix is configured for port **8080** (`MXCONSOLE_RUNTIME_PORT` in
`Employee_Hub_Interface_POC.launch`).

> **Port 8080 on this machine is currently held by Jenkins**, not Mendix —
> a POST to `http://localhost:8080/rest/react-auth/v1/login` answers
> `403 No valid crumb was included in the request` from `SERVLET: Stapler`,
> which is Jenkins' CSRF filter. Stop Jenkins or move the Mendix runtime to a
> free port before testing.

Then:

```bash
# 1. Run the app from Studio Pro   ->  http://localhost:8080
# 2. In the React project:
npm run dev                        # ->  http://localhost:5173
```

**Open React at `http://localhost:5173`.** With the default
`SESSION_MODE=shared` both apps sit on `localhost` and share one Mendix
session — see §1.5. The dev server redirects any other hostname to the
canonical one, and refuses to start if the hostnames contradict the mode.

`vite.config.js` proxies `/rest`, `/react-auth`, `/react-api`, `/file` and
`/link` to the runtime, so the browser only ever talks to one origin and no
CORS configuration is needed. Override the target with `MENDIX_RUNTIME_URL` in
a `.env` file if Mendix is not on `http://localhost:8080`, and the React
hostname/port with `REACT_DEV_HOST` / `REACT_DEV_PORT`.

---

## 4. Other defects found in the existing model

Not fixed — each needs a decision from you.

1. **Duplicate service path.** `DashboardService` and `MyService` are both
   published at `rest/myservice/v1`. Their operation paths differ
   (`/CEOMessage`, `/Events` vs `/resource/{fileid}`), so it may route today,
   but two services on one base path is fragile. Consider moving the dashboard
   service to `rest/dashboard/v1` — if you do, set
   `VITE_MENDIX_DASHBOARD_BASE` in the React `.env` to match.

2. **`Events` reuses `EM_CEODetails`.** Harmless as it stands, since the
   mapping is one flat row type shared by all three operations, but it is worth
   an explicit comment in the model so it does not read as a copy/paste slip.

3. **Dashboard reads are `POST`.** `GET` would suit a read and would skip the
   CSRF header entirely. React sends `X-Csrf-Token` on them regardless, so this
   works either way; flagging it as a design smell only.

---

## 5. Test plan (prompt §17)

| # | Test | Covered by |
| --- | --- | --- |
| 1 | Successful login -> 200 + `csrfToken`, HttpOnly cookie set | login form; confirm in DevTools that JS cannot read the cookie |
| 2 | Invalid login -> 401, generic message, no stack trace | §2.3 decision branch |
| 3 | Active Session API with cookie + token -> 200 | `GET /rest/react-api/v1/test` |
| 4 | No session (incognito) -> 401/403 | Active Session auth |
| 5 | Missing `X-Csrf-Token` -> rejected | send the request without the header |
| 6 | Wrong `X-Csrf-Token` -> rejected | send a junk token |
| 7 | Logout -> 200, then `/test` -> 401/403 | `Core.logout(session)` |
| 8 | Refresh keeps the session | `GET /session` bootstrap (§1.2) |
| 9 | Two browsers, two users, no session bleed | runtime-managed cookies |

Tests 1–9 need the runtime up, so they are **not yet run** — port 8080 is
occupied (§3) and the model work in §2 is still outstanding.
