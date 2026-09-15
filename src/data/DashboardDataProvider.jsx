import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fetchCeoMessage, fetchEvents, fetchRequests } from '../services/dashboardApi.js';
import { SessionExpiredError, logout } from '../services/mendixAuth.js';
import { ceoMessage as staticCeoMessage, events as staticEvents } from './dashboardData.js';

/**
 * Loads the dashboard's live datasets from Mendix and hands them to the
 * components that render them.
 *
 * Everything else on the page is still served from dashboardData.js, which is
 * where the static replication of the Mendix page lives.
 *
 * Each dataset carries its own status so one slow or failing endpoint cannot
 * blank out the others. The CEO message and Events fall back to the static
 * content they replicated, so those sections never render empty.
 *
 * The Approvals card is different: its four tabs are four separate Mendix
 * resources, so they are fetched per tab and cached. `All` loads up front
 * because it is the tab that opens by default; the other three load the first
 * time they are opened.
 */
const DashboardDataContext = createContext(null);

const initialSections = {
  ceoMessage: { status: 'loading', data: staticCeoMessage, live: false },
  events: { status: 'loading', data: staticEvents, live: false }
};

const emptyTab = { status: 'idle', data: [], live: false };

export function DashboardDataProvider({ children }) {
  const [sections, setSections] = useState(initialSections);
  const [requestTabs, setRequestTabs] = useState({});

  /*
   * A 401/403 from any endpoint means the Mendix session went away while the
   * page was open. Dropping the local session sends the user back to login
   * rather than leaving a half-loaded dashboard on screen.
   */
  const handleError = useCallback((error, source) => {
    /*
     * The CEO and Events sections fall back to their static replication on
     * failure, which means a dead endpoint renders as a plausible-looking card.
     * That is right for the user and wrong for whoever is debugging, so a
     * failure is always announced in dev.
     */
    if (import.meta.env.DEV) {
      console.warn(`[dashboard] ${source} failed:`, error?.message ?? error);
    }

    if (error instanceof SessionExpiredError) logout();
  }, []);

  /* Tabs already requested, so a re-render cannot fire a second fetch. */
  const requested = useRef(new Set());

  const loadRequestTab = useCallback(
    (tab) => {
      if (requested.current.has(tab)) return;
      requested.current.add(tab);

      setRequestTabs((previous) => ({
        ...previous,
        [tab]: { ...emptyTab, status: 'loading' }
      }));

      fetchRequests(tab)
        .then((data) => {
          setRequestTabs((previous) => ({
            ...previous,
            [tab]: { status: 'ready', data, live: true }
          }));
        })
        .catch((error) => {
          setRequestTabs((previous) => ({
            ...previous,
            [tab]: { status: 'error', data: [], live: false }
          }));
          handleError(error, `requests:${tab}`);
        });
    },
    [handleError]
  );

  useEffect(() => {
    let cancelled = false;

    function load(key, loader, fallback) {
      return loader()
        .then((data) => {
          if (cancelled) return;
          setSections((previous) => ({
            ...previous,
            [key]: { status: 'ready', data: data ?? fallback, live: true }
          }));
        })
        .catch((error) => {
          if (!cancelled) {
            setSections((previous) => ({
              ...previous,
              [key]: { status: 'error', data: fallback, live: false }
            }));
          }
          handleError(error, key);
        });
    }

    load('ceoMessage', fetchCeoMessage, staticCeoMessage);
    load('events', fetchEvents, staticEvents);

    return () => {
      cancelled = true;
    };
  }, [handleError]);

  /* The default tab, loaded alongside the rest of the page. */
  useEffect(() => {
    loadRequestTab('All');
  }, [loadRequestTab]);

  return (
    <DashboardDataContext.Provider value={{ sections, requestTabs, loadRequestTab }}>
      {children}
    </DashboardDataContext.Provider>
  );
}

/** Returns { status, data, live } for the CEO message or the events list. */
export function useDashboardData(key) {
  const context = useContext(DashboardDataContext);

  // Outside the provider (e.g. a component rendered in isolation) the static
  // replication is still the right answer.
  if (!context) return initialSections[key];

  return context.sections[key];
}

/**
 * Returns `{ status, data }` for one Approvals tab plus the loader that fetches
 * it. Callers request a tab when it is opened; the result is cached, so
 * reopening a tab does not refetch.
 */
export function useRequestsTab(tab) {
  const context = useContext(DashboardDataContext);

  if (!context) {
    return { ...emptyTab, load: () => {} };
  }

  return { ...(context.requestTabs[tab] ?? emptyTab), load: context.loadRequestTab };
}
