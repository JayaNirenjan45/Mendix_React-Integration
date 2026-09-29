import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Which screen the layout is showing.
 *
 * Mendix reaches these five screens through the microflows on the layout's
 * nav items - ACT_CallDeepLinkHomeWithDefaultHomePage for the dashboard,
 * DS_DigitalCardRequest_2 for the three request types it parameterises, and
 * ACT_RedirectToAbsenceRequestPage_2 for Absence. Each of those retrieves the
 * Main.RequestsList row for its ENUM_CommonRequestTypes value, creates the
 * request object and opens the page with both as parameters.
 *
 * Here the same five screens are held in state instead: no URL changes, which
 * is what was asked for, and `is-active` moves between the nav items the way
 * gsSidebarToggleJs1 moves it in the layout.
 *
 * `key` is what the nav item and the router switch on; `pageClass` is the
 * Class the Mendix page declares, which lands on the same root element as the
 * layout's own class - the service stylesheet is written against that.
 */
export const SCREENS = {
  home: { key: 'home', pageClass: '', title: 'My Bahri' },
  digitalCard: { key: 'digitalCard', pageClass: 'gs-service-page gs-svc-idcard', title: 'Employee Services' },
  drivers: { key: 'drivers', pageClass: 'gs-service-page gs-svc-car', title: 'Employee Services' },
  food: { key: 'food', pageClass: 'gs-service-page gs-svc-food', title: 'Employee Services' },
  absence: { key: 'absence', pageClass: 'thenew-grey gs-service-page gs-svc-calendar', title: 'Employee Services' }
};

const ScreenContext = createContext(null);

export function ScreenProvider({ children }) {
  const [screen, setScreen] = useState('home');

  /*
   * Opening a request page in Mendix creates a fresh object every time, so a
   * page reopened is a page reset. `visit` counts the openings and is used as
   * the page component's React key, which throws the previous form state away
   * exactly as Mendix throws away the previous object.
   */
  const [visit, setVisit] = useState(0);

  /*
   * Main.RequestSuccessPopup, held here rather than on the request page.
   *
   * ACT_SendDigitalCardRequest shows that pop-up and then runs `close page`, so
   * the form is gone and the dashboard is what sits behind it. All four request
   * pages behave that way here, which means the pop-up has to outlive the page
   * that raised it - so it belongs to the shell, not to the page.
   */
  const [requestSuccess, setRequestSuccess] = useState(null);

  const openScreen = useCallback((next) => {
    setScreen((current) => {
      setVisit((n) => n + 1);
      return SCREENS[next] ? next : current;
    });
    /* Mendix lands every page at the top; React keeps the old scroll position. */
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  /** Submitted: back to the dashboard, with the success pop-up over it. */
  const finishRequest = useCallback(
    (outcome) => {
      setRequestSuccess(outcome);
      openScreen('home');
    },
    [openScreen]
  );

  const closeRequestSuccess = useCallback(() => setRequestSuccess(null), []);

  const value = useMemo(
    () => ({
      screen,
      visit,
      openScreen,
      requestSuccess,
      finishRequest,
      closeRequestSuccess,
      pageClass: SCREENS[screen].pageClass,
      title: SCREENS[screen].title
    }),
    [screen, visit, openScreen, requestSuccess, finishRequest, closeRequestSuccess]
  );

  return <ScreenContext.Provider value={value}>{children}</ScreenContext.Provider>;
}

export function useScreen() {
  const context = useContext(ScreenContext);

  if (!context) {
    throw new Error('useScreen must be used inside a ScreenProvider');
  }

  return context;
}
