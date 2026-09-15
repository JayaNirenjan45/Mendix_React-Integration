import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * NOTE: src/services/mendixConfig.js now hardcodes the DEPLOYED Mendix app
 * (https://mxinterface.rapidhr.com) as the API origin, so the browser calls it
 * directly and the proxy below is bypassed. The proxy is kept for the
 * same-origin dev topology: set VITE_MENDIX_URL= (empty) and
 * MENDIX_RUNTIME_URL=http://localhost:8080 in .env and it takes over again.
 *
 * The dev server proxies the Mendix REST paths, so the browser only ever talks
 * to this origin and there is no CORS to configure:
 *
 *   http://localhost:5173/
 *     /                -> React (vite)
 *     /rest/...        -> Mendix runtime
 *     /react-auth/...  -> Mendix runtime (the LoginService path as modelled)
 *     /file, /link     -> Mendix runtime (file downloads, deep links)
 *
 * ---------------------------------------------------------------------------
 * One shared Mendix session
 * ---------------------------------------------------------------------------
 * Cookies are scoped by HOSTNAME ONLY; the port is not part of a cookie's
 * identity (RFC 6265 section 8.5). React is therefore served on the same
 * hostname as the runtime, so both apps share one cookie jar, one
 * XASSESSIONID, and one Mendix ISession:
 *
 *     React   http://localhost:5173  ─┐
 *                                     ├─ one XASSESSIONID on `localhost`
 *     Mendix  http://localhost:8080  ─┘
 *
 * Signing in from React creates the session the Mendix app also uses, and the
 * CSRF token React holds is that shared session's token. Serving React from a
 * different hostname would silently split the two, so the guard below redirects
 * to the canonical host.
 */

/** Redirects any other hostname to the one this app is meant to be served on. */
function canonicalHost(devHost, port) {
  return {
    name: 'react-session-host-guard',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const host = (req.headers.host || '').split(':')[0];

        if (!host || host === devHost) {
          next();
          return;
        }

        res.writeHead(302, { Location: `http://${devHost}:${port}${req.url}` });
        res.end();
      });
    }
  };
}

/** The deployed Mendix app. Kept in step with src/services/mendixConfig.js. */
const DEPLOYED_MENDIX_URL = 'https://mxinterface.rapidhr.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const target = env.MENDIX_RUNTIME_URL || DEPLOYED_MENDIX_URL;
  const mendixHost = new URL(target).hostname;
  const port = Number(env.REACT_DEV_PORT || 5173);

  /*
   * The shared-cookie-jar trick only exists for a LOCAL runtime: cookies ignore
   * the port, so serving React on the runtime's hostname gives both apps one
   * XASSESSIONID. A remote deployment cannot be shared that way - the dev
   * server cannot bind to mxinterface.rapidhr.com - so React stays on localhost
   * and the deployed runtime is responsible for CORS and for issuing its
   * session cookie as `SameSite=None; Secure`.
   */
  const isLocalRuntime = ['localhost', '127.0.0.1', '[::1]'].includes(mendixHost);
  const devHost = env.REACT_DEV_HOST || (isLocalRuntime ? mendixHost : 'localhost');

  if (isLocalRuntime && devHost !== mendixHost) {
    throw new Error(
      `React (${devHost}) and Mendix (${mendixHost}) are on different hostnames, ` +
        'so they cannot share a cookie jar or a Mendix session. Drop ' +
        `REACT_DEV_HOST, or set it to '${mendixHost}'.`
    );
  }

  /*
   * `changeOrigin` is deliberately off: the Host header reaches Mendix as the
   * React dev host, so any cookie Mendix scopes to the requesting host still
   * matches. The browser attributes Set-Cookie to the origin it asked for
   * either way, which is what makes the mode above work.
   *
   * Every proxied call is logged. Without this a request that never reaches
   * Mendix - wrong target, runtime down, something else on the port - looks
   * identical in the browser to one Mendix rejected, and you cannot tell
   * whether the login microflow was even called.
   */
  const proxy = {
    target,
    /*
     * A remote runtime rejects a Host header of `localhost`, so the header is
     * rewritten for it; a local runtime keeps the original Host, which is what
     * makes the shared cookie jar above work.
     */
    changeOrigin: !isLocalRuntime,
    secure: false,
    ws: false,
    configure(proxyServer) {
      proxyServer.on('proxyReq', (_proxyReq, req) => {
        /*
         * Report whether the two credentials are on the request, by name only -
         * the token and the session id are never printed. This is what makes
         * "is the CSRF header actually being sent?" answerable by looking,
         * rather than by reading the client code.
         */
        const csrf = req.headers['x-csrf-token'] ? 'csrf ok' : 'csrf MISSING';
        const cookie = /XASSESSIONID/.test(req.headers.cookie || '')
          ? 'cookie ok'
          : 'cookie MISSING';

        console.log(`[mendix] --> ${req.method} ${req.url}  [${cookie}, ${csrf}]`);
      });

      proxyServer.on('proxyRes', (proxyRes, req) => {
        const setCookie = proxyRes.headers['set-cookie'];
        // Cookie NAMES only - never a value, which would be the session id.
        const cookieNames = Array.isArray(setCookie)
          ? setCookie.map((c) => String(c).split('=')[0]).join(', ')
          : '';
        console.log(
          `[mendix] <-- ${proxyRes.statusCode} ${req.method} ${req.url}` +
            (cookieNames ? `  (Set-Cookie: ${cookieNames})` : '')
        );
      });

      proxyServer.on('error', (err, req, res) => {
        console.error(
          `[mendix] xxx ${req.method} ${req.url} never reached ${target}: ` +
            `${err.code || err.message}`
        );

        if (res && !res.headersSent && res.writeHead) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'mendix_unreachable',
              target,
              code: err.code || null
            })
          );
        }
      });
    }
  };

  /*
   * Printed once at startup so the two things that decide whether login works
   * - where React is served and where Mendix is expected - are never a guess.
   */
  console.log(
    `\n  Mendix proxy   ${target}` +
      `\n  React origin   http://${devHost}:${port}   (open this exact host)` +
      `\n  Session        ${
        isLocalRuntime
          ? 'shared with the Mendix app'
          : 'cross-site - CORS + SameSite=None cookie required on the deployment'
      }\n`
  );

  return {
    plugins: [react(), canonicalHost(devHost, port)],
    server: {
      host: devHost,
      port,
      strictPort: true,
      open: false,
      proxy: {
        '/rest': proxy,
        '/react-auth': proxy,
        '/react-api': proxy,
        '/file': proxy,
        '/link': proxy
      }
    }
  };
});
