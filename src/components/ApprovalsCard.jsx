import React, { useEffect, useMemo, useState } from 'react';
import { approvals } from '../data/dashboardData.js';
import { MxImage, MxStaticImage } from './MxWidgets.jsx';
import { useRequestsTab } from '../data/DashboardDataProvider.jsx';

/**
 * container21 (Class: 'gs-approvals-card')
 *   staticImage22 / staticImage19
 *   container17 (Class: 'gs-approvals-head')
 *   image gsApprovalsFilter (Main.gs_image.filter_icon, Class: 'gs-approvals-filter')
 *     decorative; atom-gs.scss lines it up to the left of the "All" tab
 *   tabcontainer tabContainer1 (Class: 'gs-approvals-tabs')
 *     tabPage1..4 -> containerN (Class: 'workflow-container b-control') > listviewN
 *
 * Mendix tab containers render as:
 *   div.mx-tabcontainer.mx-name-tabContainer1.<class>
 *     ul.nav.nav-tabs.mx-tabcontainer-tabs > li[.active] > a.mx-name-<tabpage>
 *     div.tab-content.mx-tabcontainer-content > div.tab-pane.mx-tabcontainer-pane[.active]
 *
 * Only the active pane's content is mounted by the Mendix client, which is why the
 * inactive panes are empty; that is mirrored here.
 *
 * Each listview row follows the page model:
 *   containerA
 *     containerB
 *       dynamictext (RequestType, Class: 'rt-gs')
 *       containerC (Class: 'f-clock') > staticImage (Main.gs_image.clock_att) + dynamictext '{2}, {1}'
 *     dynamictext (State, Class: 'state')
 *
 * Every listview has PageSize 2. When the datasource holds more rows, Mendix appends
 * a "Load more..." button; atom-gs.scss hides it inside this card.
 *
 * The rows are live. Each tab is its own resource on DashboardService, so the
 * filtering happens server-side and React opens the matching endpoint:
 *
 *   All       POST /rest/myservice/v1/AllRequests      -> Main.DS_GetAllRequests
 *   Pending   POST /rest/myservice/v1/PendingRequests  -> Main.DS_GetPendingRequests
 *   Approved  POST /rest/myservice/v1/ApprovedRequests -> Main.DS_GetApprovedRequests
 *   Rejected  POST /rest/myservice/v1/RejectedRequests -> Main.DS_GetRejectedRequests
 *
 * A tab is fetched the first time it is opened and then cached. Every microflow
 * runs inside the authenticated Mendix session and scopes itself to
 * `[System.owner=$currentUser]`, sorted by CreationDate descending - so the rows
 * arrive already filtered and already ordered, and are rendered as they come.
 */

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function beginOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function ddMMyyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * text69..72: Content '{2}, {1}' with
 *   {1} = if EstimatedDeadline = empty then formatDateTime([%BeginOfCurrentDay%],'dd/MM/yyyy')
 *         else formatDateTime(EstimatedDeadline,'dd/MM/yyyy')
 *   {2} = if EstimatedDeadline = empty then formatDateTime([%BeginOfCurrentDay%],'EEEE')
 *         else if EstimatedDeadline = [%BeginOfCurrentDay%] then 'Today'
 *         else if EstimatedDeadline = [%BeginOfTomorrow%] then 'Tomorrow'
 *         else formatDateTime(EstimatedDeadline,'EEEE')
 */
function deadlineLabel(deadline, today) {
  if (!deadline) {
    return `${WEEKDAYS[today.getDay()]}, ${ddMMyyyy(today)}`;
  }
  const tomorrow = addDays(today, 1);
  let day;
  if (deadline.getTime() === today.getTime()) day = 'Today';
  else if (deadline.getTime() === tomorrow.getTime()) day = 'Tomorrow';
  else day = WEEKDAYS[deadline.getDay()];
  return `${day}, ${ddMMyyyy(deadline)}`;
}

function RequestRow({ index, request, names, today }) {
  return (
    <li className={`mx-name-index-${index}`}>
      <div className="mx-dataview">
        <div className="mx-dataview-content">
          <div className={`mx-name-${names.outer}`}>
            <div className={`mx-name-${names.inner}`}>
              <span className={`mx-text mx-name-${names.type} rt-gs`}>{request.requestType}</span>
              <div className={`mx-name-${names.clock} f-clock`}>
                <MxStaticImage name={names.icon} src="Main$gs_image$clock_att.svg" />
                <span className={`mx-text mx-name-${names.date}`}>{deadlineLabel(request.deadlineDate, today)}</span>
              </div>
            </div>
            <span className={`mx-text mx-name-${names.status} state`}>{request.state}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Renders one tab's rows, and asks for its data the first time it opens.
 *
 * Only the first PageSize (2) requests are shown, matching the Mendix
 * listview. Mendix would append a "Load more" button for the remainder, but
 * atom-gs.scss hides it inside this card, so no paging control is reproduced
 * either - the tab simply shows the two most recent requests.
 *
 * The rows arrive sorted by CreationDate descending from the microflow, so the
 * two shown are the newest. The count badge on the card still reports the full
 * total, which is where the rest of the requests are accounted for.
 */
function RequestsPane({ tab, today }) {
  const { status, data, load } = useRequestsTab(tab.caption);

  useEffect(() => {
    load(tab.caption);
  }, [load, tab.caption]);

  const visible = data.slice(0, approvals.pageSize);

  return (
    <div className={`mx-name-${tab.container} workflow-container b-control`}>
      <div className={`mx-listview mx-name-${tab.listView}`}>
        <ul>
          {visible.length === 0 ? (
            <li className="mx-listview-empty">
              <label>
                {status === 'loading' || status === 'idle' ? 'Loading…' : approvals.emptyLabel}
              </label>
            </li>
          ) : (
            visible.map((r, idx) => (
              <RequestRow
                key={`${r.requestType}-${idx}`}
                index={idx}
                request={r}
                names={tab.row}
                today={today}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default function ApprovalsCard() {
  const [active, setActive] = useState(0);

  // Resolve "today" once per mount so every row compares against the same day.
  const today = useMemo(() => beginOfDay(new Date()), []);

  /*
   * The badge counts the tab that is open, not a fixed one, so it tracks as
   * the user moves between All / Pending / Approved / Rejected. It reports how
   * many records that tab's microflow returned - not how many rows are on
   * screen, which is capped at PageSize.
   */
  const activeTab = approvals.tabs[active];
  const current = useRequestsTab(activeTab.caption);

  return (
    <div className="mx-name-container21 gs-approvals-card">
      <MxStaticImage name="staticImage22" src="Main$Images$MyTasks.svg" />

      <div className="mx-name-container17 gs-approvals-head">
        <div className="mx-name-container18">
          <div className="mx-name-container44 gs-approvals-titlebox">
            <span className="mx-text mx-name-text52 gs-approvals-title">{approvals.title}</span>
            <MxStaticImage name="staticImage19" src="Main$gs_image$right_arrow.svg" />
          </div>
          <div className="mx-name-container19 gs-approvals-subbox">
            <span className="mx-text mx-name-text53 gs-approvals-sub">{approvals.sub}</span>
          </div>
        </div>
        {/* Blank until the tab's call settles: showing a stale or placeholder
            number over a list that is still loading is worse than showing
            nothing for a moment. A failed call counts as settled, at zero. */}
        <span className="mx-text mx-name-text8 count-gs">
          {current.status === 'ready' || current.status === 'error' ? current.data.length : ''}
        </span>
      </div>

      <MxImage name="gsApprovalsFilter" className="gs-approvals-filter" src="Main$gs_image$filter_icon.svg" />

      <div className="mx-tabcontainer mx-name-tabContainer1 gs-approvals-tabs">
        <ul className="nav nav-tabs mx-tabcontainer-tabs">
          {approvals.tabs.map((t, i) => (
            <li key={t.name} className={i === active ? 'active' : ''}>
              <a
                className={`mx-name-${t.name}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActive(i);
                }}
              >
                {t.caption}
              </a>
            </li>
          ))}
        </ul>
        <div className="tab-content mx-tabcontainer-content">
          {approvals.tabs.map((t, i) => (
            <div key={t.name} className={'tab-pane mx-tabcontainer-pane' + (i === active ? ' active' : '')}>
              {i === active && <RequestsPane tab={t} today={today} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
