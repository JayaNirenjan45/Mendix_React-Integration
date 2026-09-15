import React from 'react';
import NewLayout from './components/NewLayout.jsx';
import NewDashboard from './components/NewDashboard.jsx';
import LoginPage from './components/LoginPage.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { DashboardDataProvider } from './data/DashboardDataProvider.jsx';

/**
 * Mendix binds Main.New_Dashboard to Main.NewLayout and drops the page content
 * into the layout's `placeholder Main`. That composition is unchanged; it is
 * now gated on an authenticated Mendix session.
 */
function Routes() {
  const { authenticated, status } = useAuth();

  /*
   * Wait for the bootstrap before choosing a screen. Deciding early would flash
   * the login form on every refresh for a user whose session is still alive.
   */
  if (status === 'checking') {
    return <div className="gs-login-booting">Loading&hellip;</div>;
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardDataProvider>
      <NewLayout>
        <NewDashboard />
      </NewLayout>
    </DashboardDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
