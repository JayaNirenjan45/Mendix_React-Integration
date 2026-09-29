import React, { useEffect } from 'react';
import NewLayout from './components/NewLayout.jsx';
import NewDashboard from './components/NewDashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import DigitalCardRequest from './components/pages/DigitalCardRequest.jsx';
import DriverRequest from './components/pages/DriverRequest.jsx';
import FoodRequest from './components/pages/FoodRequest.jsx';
import AbsenceAnnualLeave from './components/pages/AbsenceAnnualLeave.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { DashboardDataProvider } from './data/DashboardDataProvider.jsx';
import { ServiceDataProvider } from './data/ServiceDataProvider.jsx';
import { ScreenProvider, useScreen } from './nav/ScreenContext.jsx';
import { RequestSuccessPopup } from './components/service/ServicePopups.jsx';

/**
 * Mendix drops whichever page is open into Main.NewLayout's `placeholder Main`.
 * Five pages share that layout here - the dashboard and the four employee
 * service requests - and the layout's own nav items are what move between them,
 * exactly as their microflows do in the model.
 */
function Shell() {
  const { screen, visit, title, requestSuccess, closeRequestSuccess } = useScreen();

  /* Mendix puts the page's Title in the browser tab. */
  useEffect(() => {
    document.title = title;
  }, [title]);

  /*
   * `visit` is the page's React key on the four request pages. Each opening of
   * a Mendix request page creates a new object, so reopening one is a blank
   * form; a changing key does the same to the state here.
   */
  const page = {
    home: (
      <DashboardDataProvider>
        <NewDashboard />
      </DashboardDataProvider>
    ),
    digitalCard: <DigitalCardRequest key={visit} />,
    drivers: <DriverRequest key={visit} />,
    food: <FoodRequest key={visit} />,
    absence: <AbsenceAnnualLeave key={visit} />
  }[screen];

  /*
   * The lookups the four request pages share - employees, office locations,
   * food request types, replaced-by, the signed-in employee, the absence
   * figures - are loaded once here rather than per page, because switching
   * between the pages should not refetch a list that has not changed.
   */
  /*
   * Main.RequestSuccessPopup. Submitting closes the request page - ACT_Send*
   * ends on `close page` - so the pop-up is raised here, over the dashboard,
   * rather than over the form that has just gone.
   */
  return (
    <ServiceDataProvider>
      <NewLayout>{page}</NewLayout>
      {requestSuccess && (
        <RequestSuccessPopup
          message={requestSuccess.message}
          referenceNo={requestSuccess.referenceNo}
          onClose={closeRequestSuccess}
        />
      )}
    </ServiceDataProvider>
  );
}

/**
 * Visual-review escape hatch: `VITE_DEV_SKIP_AUTH=true` renders the layout and
 * its five screens without a Mendix session, so the pages can be compared
 * against Mendix while sign-in is still being sorted out.
 *
 * `import.meta.env.DEV` is statically false in a production build, so this whole
 * branch is dropped at build time - it cannot be switched on in `dist/`. It also
 * grants nothing: the four service pages run on seeded data, and any call that
 * needs a real session still fails as it would for an anonymous user.
 */
const DEV_SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_AUTH === 'true';

function Routes() {
  const { authenticated, status } = useAuth();

  if (DEV_SKIP_AUTH) {
    return (
      <ScreenProvider>
        <Shell />
      </ScreenProvider>
    );
  }

  /*
   * Wait for the bootstrap before choosing a screen. Deciding early would flash
   * the login form on every refresh for a user whose session is still alive.
   */
  /*
   * The client's own loader while the session is being decided. Its DOM is what
   * atom-service-gs.scss restyles - the pale Atlas slab cleared away, a spinner
   * over a blurred dim - and `mx-progress-hidden` is the idle state it scopes
   * that treatment out of.
   */
  if (status === 'checking') {
    return (
      <div className="mx-progress">
        <div className="mx-progress-indicator" />
        <div className="mx-progress-message">Loading&hellip;</div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <ScreenProvider>
      <Shell />
    </ScreenProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
