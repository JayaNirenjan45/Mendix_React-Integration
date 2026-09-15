import React from 'react';
import { todaysSchedule } from '../data/dashboardData.js';
import { useDashboardData } from '../data/DashboardDataProvider.jsx';

/**
 * container244 (Class: 'list-ts')  -> listview listView9 (Main.DS_TodaysSchedule)
 * container245 (Class: 'list-eve') -> listview listView2 (database Dashboard.Event)
 *
 * Both headings carry RenderMode H2 plus Spacing margin-bottom L, which Mendix
 * renders as <h2 class="mx-text ... spacing-outer-bottom-large">.
 *
 * listView2 has a search bar enabled, so Mendix emits .mx-listview-searchbar
 * ahead of the <ul>. Each listview row is <li class="mx-name-index-N"> wrapping
 * a .mx-dataview > .mx-dataview-content.
 *
 * listView2 is live: POST /rest/myservice/v1/Events runs Main.DS_PublishEvents
 * inside the authenticated Mendix session and returns every Dashboard.Event
 * whose EndDate has not passed. An empty result renders the Mendix empty row.
 */

export function TodaysSchedule() {
  return (
    <div className="mx-name-container244 list-ts">
      <div className="mx-name-container133">
        <h2 className="mx-text mx-name-text108 text-employee dashboard-sub-headings border-bottom w-100 paddind-bottom spacing-outer-bottom-large">
          Today&apos;s Schedule
        </h2>
      </div>
      <div className="mx-listview mx-name-listView9">
        <ul>
          {todaysSchedule.map((item, i) => (
            <li key={i} className={`mx-name-index-${i}`}>
              <div className="mx-dataview">
                <div className="mx-dataview-content">
                  <span className="mx-text mx-name-text58 title">{item.title}</span>
                  <span className="mx-text mx-name-text60 date">{item.date}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function EventsList() {
  const { data: events, status } = useDashboardData('events');

  return (
    <div className="mx-name-container245 list-eve">
      <div className="mx-name-container134">
        <h2 className="mx-text mx-name-text109 text-employee dashboard-sub-headings border-bottom w-100 paddind-bottom spacing-outer-bottom-large">
          Events
        </h2>
      </div>
      <div className="mx-listview mx-name-listView2">
        <div className="mx-listview-searchbar">
          <input
            placeholder="Search"
            className="form-control"
            aria-label="Search"
            type="text"
            defaultValue=""
          />
          <button className="btn mx-button" aria-label="Refresh/Clear" title="Refresh/Clear">
            <span className="mx-icon-filled mx-icon-refresh" />
          </button>
        </div>
        <ul>
          {events.length === 0 && (
            <li className="mx-listview-empty">
              <label>{status === 'loading' ? 'Loading…' : 'No items found'}</label>
            </li>
          )}
          {events.map((item, i) => (
            <li key={`${item.title}-${i}`} className={`mx-name-index-${i}`}>
              <div className="mx-dataview">
                <div className="mx-dataview-content">
                  <span className="mx-text mx-name-text56 title">{item.title}</span>
                  <span className="mx-text mx-name-text57 date">{item.date}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
