import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchAbsenceBalance,
  fetchAbsenceHistory,
  fetchCurrentEmployee,
  fetchEmployees,
  fetchFoodRequestTypes,
  fetchOfficeLocations,
  fetchReplacedByOptions
} from '../services/serviceRequestsApi.js';
import { SessionExpiredError, logout } from '../services/mendixAuth.js';
import {
  absenceBalance as staticAbsenceBalance,
  absenceHistory as staticAbsenceHistory,
  currentEmployee as staticCurrentEmployee,
  employees as staticEmployees,
  foodRequestTypes as staticFoodRequestTypes,
  officeLocations as staticOfficeLocations,
  replacedByOptions as staticReplacedBy
} from './serviceData.js';

/**
 * The reference data the four service request pages read.
 *
 * Mendix fills these from microflows and database retrieves that have no
 * published REST operation yet, so every set starts as its seeded replication
 * and is replaced the moment the matching endpoint exists - see
 * MENDIX_SERVICE_PAGES_SPEC.md §3 Phase 1 and Phase 4.
 *
 * Loaded once for the whole session rather than per page, because that is what
 * they are: lookups. `live` per set says where the value came from, so a page
 * (or a reviewer) can tell real data from the replication.
 */
const ServiceDataContext = createContext(null);

const initial = {
  me: { data: staticCurrentEmployee, live: false },
  employees: { data: staticEmployees, live: false },
  offices: { data: staticOfficeLocations, live: false },
  foodTypes: { data: staticFoodRequestTypes, live: false },
  replacedBy: { data: staticReplacedBy, live: false },
  absenceBalance: { data: staticAbsenceBalance, live: false },
  absenceHistory: { data: staticAbsenceHistory, live: false }
};

export function ServiceDataProvider({ children }) {
  const [sets, setSets] = useState(initial);
  const [status, setStatus] = useState('loading');

  /*
   * A dead session must not be papered over with demo data: end it and let the
   * app send the user back to the login screen. Everything else has already
   * been turned into a fallback by serviceRequestsApi.
   */
  const handleError = useCallback((error) => {
    if (error instanceof SessionExpiredError) logout();
    else if (import.meta.env.DEV) console.warn('[service-pages] lookup failed:', error);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loaders = [
      ['me', fetchCurrentEmployee],
      ['employees', fetchEmployees],
      ['offices', fetchOfficeLocations],
      ['foodTypes', fetchFoodRequestTypes],
      ['replacedBy', fetchReplacedByOptions],
      ['absenceBalance', fetchAbsenceBalance],
      ['absenceHistory', fetchAbsenceHistory]
    ];

    Promise.all(
      loaders.map(([key, load]) =>
        load()
          .then((result) => [key, result])
          .catch((error) => {
            handleError(error);
            return [key, initial[key]];
          })
      )
    ).then((results) => {
      if (cancelled) return;
      setSets((current) => {
        const next = { ...current };
        results.forEach(([key, result]) => {
          next[key] = result;
        });
        return next;
      });
      setStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const value = useMemo(() => ({ ...sets, status }), [sets, status]);

  return <ServiceDataContext.Provider value={value}>{children}</ServiceDataContext.Provider>;
}

export function useServiceData() {
  const context = useContext(ServiceDataContext);

  if (!context) {
    throw new Error('useServiceData must be used inside a ServiceDataProvider');
  }

  return context;
}
