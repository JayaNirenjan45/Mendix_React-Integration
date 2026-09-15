import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  bootstrapSession,
  getSessionState,
  login as mendixLogin,
  logout as mendixLogout,
  subscribe
} from '../services/mendixAuth.js';

/**
 * Holds nothing but a mirror of the in-memory session that mendixAuth.js owns.
 * No token or session id is ever placed in React state, storage or props - the
 * context only reports *whether* a session exists and who owns it.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSessionState);
  /* 'checking' until the refresh bootstrap has had its turn. */
  const [status, setStatus] = useState('checking');

  useEffect(() => subscribe(setSession), []);

  useEffect(() => {
    let cancelled = false;

    /*
     * A token persisted by this tab is already adopted by the time the module
     * loaded, so there is nothing to wait for - render the dashboard straight
     * away. The bootstrap endpoint is only needed when no token survived, and
     * only helps if it has been published on the Mendix side.
     */
    if (getSessionState().authenticated) {
      setStatus('ready');
      return undefined;
    }

    bootstrapSession().finally(() => {
      if (!cancelled) setStatus('ready');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      status,
      login: mendixLogin,
      logout: mendixLogout
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return context;
}
