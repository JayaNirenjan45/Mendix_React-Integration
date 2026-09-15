import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { layout } from '../data/dashboardData.js';
import { WidgetWrapper, MxImage, MxButton } from './MxWidgets.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import MoodCheckin from './MoodCheckin.jsx';
import PopupMenu from './PopupMenu.jsx';

/**
 * Main.NewLayout  (layouttype: Responsive, class: gs-bahri-layout)
 *
 * DOM mapped 1:1 from the running Mendix client. Mendix conventions reproduced here:
 *
 *   container  <name> (Class: 'x')  ->  <div className="mx-name-<name> x">
 *   dynamictext<name> (Class: 'x')  ->  <span className="mx-text mx-name-<name> x">
 *   image      <name> (Class: 'x')  ->  <div className="mx-image-viewer mx-image-viewer-responsive mx-name-<name> x"><img/></div>
 *   actionbutton <name>            ->  <MxButton> (MxWidgets.jsx)
 *   popupmenu  <name> (Class: 'x') ->  <PopupMenu> (PopupMenu.jsx)
 *   javascriptsnippet <name>       ->  <div className="<name>" style="display: contents">, behaviour in React state
 *   placeholder Main               ->  <div className="mx-placeholder">{children}</div>
 *
 * The bare wrapper <div>s around gsHeader, gsHeaderBlackFrame and topSidebarLeft are
 * emitted by the Mendix client itself. They render with `display: contents`, so they
 * are layout-neutral, and are reproduced so the node tree matches Mendix exactly.
 */
export default function NewLayout({ children }) {
  /* gsSidebarToggleJs: toggles .gs-sidebar-expanded on .gs-bahri-layout */
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  /* gsSidebarToggleJs1: moves .is-active between .gs-nav-item elements */
  const [activeNav, setActiveNav] = useState(layout.nav.findIndex((n) => n.active));
  /* gs-mood-checkin.js: the header emoji toggles the daily check-in popup */
  const [moodOpen, setMoodOpen] = useState(false);
  const moodRef = useRef(null);
  const closeMood = useCallback(() => setMoodOpen(false), []);

  /* gsGrayscaleJs: every page load starts in grayscale, and gsHeaderGrayscale
     switches it off and on. The class goes on <html> because a filter on any
     other element would break position:fixed children such as the check-in
     popup. A layout effect applies it before the first paint. */
  const [grayscale, setGrayscale] = useState(true);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('gs-grayscale', grayscale);
    return () => root.classList.remove('gs-grayscale');
  }, [grayscale]);

  /*
   * gsUserMenuSignOut. In Mendix this navigates to layout.signOutUrl; here it
   * ends the React app's own Mendix session instead - POST
   * /rest/react-api/v1/logout runs Core.logout(session) server-side, and React
   * only forgets its CSRF token. The HttpOnly session cookie is never touched
   * from JavaScript, and the Mendix app's separate session is unaffected.
   */
  const { logout } = useAuth();
  const signOut = useCallback(() => { logout(); }, [logout]);

  return (
    <div
      className={'mx-page gs-bahri-layout' + (sidebarExpanded ? ' gs-sidebar-expanded' : '')}
      data-focusindex="0"
    >
      <div className="mx-placeholder">
        <div className="mx-name-gsShell gs-shell">

          {/* ---------------------------------------------------------- gs-header */}
          <WidgetWrapper mendixId="l.Main.NewLayout.gsHeader">
            <div className="mx-name-gsHeader gs-header">

              <div className="mx-name-gsHeaderBrand gs-header-brand">
                <MxImage name="gsHeaderLogo" className="gs-header-logo" src="Main$gs_image$bahri_toplogo.svg" />
                <span className="mx-text mx-name-gsHeaderWordmark gs-header-wordmark">
                  {layout.wordmark}
                </span>
              </div>

              <div className="mx-name-gsHeaderActions gs-header-actions">

                {/* Icon-only action button with On click "Do nothing"; gsGrayscaleJs binds the
                    click and sets aria-pressed, aria-label and the title at runtime. */}
                <MxButton
                  name="gsHeaderGrayscale"
                  className="gs-header-grayscale"
                  icon="contrast"
                  page="l.Main.NewLayout"
                  title="Grayscale mode"
                  aria-pressed={grayscale ? 'true' : 'false'}
                  aria-label="Grayscale mode"
                  onClick={() => setGrayscale((v) => !v)}
                />
                {/* javascriptsnippet mount point; the widget renders it with display: contents. */}
                <div className="gsGrayscaleJs" style={{ display: 'contents' }} />

                {/* No action in the model: the Mendix script binds this click by
                    delegation, so the DOM carries no role or tabindex. */}
                <div
                  ref={moodRef}
                  className="mx-name-gsHeaderMood gs-header-mood"
                  onClick={() => setMoodOpen((v) => !v)}
                >
                  <MxImage name="gsHeaderMoodIcon" className="gs-header-mood-icon" src="Main$gs_image$gs_hdr_mood.svg" />
                </div>

                <div className="mx-name-gsHeaderWeather gs-header-weather">
                  <MxImage name="gsHeaderWeatherIcon" className="gs-header-weather-icon" src="Main$gs_image$gs_hdr_weather.svg" />
                  <span className="mx-text mx-name-gsHeaderWeatherTemp gs-header-weather-temp">
                    {layout.weatherTemp}
                  </span>
                  <span className="mx-text mx-name-gsHeaderWeatherCity gs-header-weather-city">
                    {layout.weatherCity}
                  </span>
                </div>

                <div className="mx-name-gsHeaderCard gs-header-card">
                  <MxImage name="gsHeaderCardIcon" className="gs-header-card-icon" src="Main$gs_image$gs_hdr_idcard.svg" />
                </div>

                <div className="mx-name-gsHeaderBell gs-header-bell">
                  <MxImage name="gsHeaderBellIcon" className="gs-header-bell-icon" src="Main$gs_image$gs_hdr_bell.svg" />
                  <span className="mx-text mx-name-gsHeaderBellCount gs-header-bell-count">
                    {layout.bellCount}
                  </span>
                </div>

                {/* Pop-up menu: the user block is the trigger, and its one custom item holds
                    the Sign out button. gsUserMenuJs gives the plain trigger div tabindex and
                    role at runtime so the keyboard can reach it. */}
                <PopupMenu
                  name="gsUserMenu"
                  className="gs-user-menu"
                  position="bottom"
                  triggerProps={{ tabIndex: 0, role: 'button' }}
                  trigger={
                    <div className="mx-name-gsHeaderUser gs-header-user">
                      <div className="mx-name-gsHeaderAvatar gs-header-avatar">
                        <span className="mx-text mx-name-gsHeaderInitials gs-header-initials">
                          {layout.userInitials}
                        </span>
                      </div>
                      <div className="mx-name-gsHeaderUserMeta gs-header-user-meta">
                        <span className="mx-text mx-name-gsHeaderUserName gs-header-user-name">
                          {layout.userName}
                        </span>
                        <span className="mx-text mx-name-gsHeaderUserRole gs-header-user-role">
                          {layout.userRole}
                        </span>
                      </div>
                      <MxImage name="gsHeaderUserChevron" className="gs-header-user-chevron" src="Main$gs_image$gs_hdr_chevron.svg" />
                    </div>
                  }
                  customItems={[
                    {
                      key: 'gsUserMenuSignOutItem',
                      content: (
                        <MxButton
                          name="gsUserMenuSignOut"
                          className="gs-user-menu-item"
                          icon="logout"
                          caption="Sign out"
                          page="l.Main.NewLayout"
                          onClick={signOut}
                        />
                      )
                    }
                  ]}
                />
                <div className="gsUserMenuJs" style={{ display: 'contents' }} />

              </div>
            </div>
          </WidgetWrapper>

          {/* ---------------------------------------------- gs-header-black-frame */}
          <WidgetWrapper mendixId="l.Main.NewLayout.gsHeaderBlackFrame">
            <div className="mx-name-gsHeaderBlackFrame gs-header-black-frame">
              <div className="mx-name-gsTickerTrack gs-ticker-track">
                <div className="mx-name-gsTickerGroupA gs-ticker-group">
                  <span className="mx-text mx-name-gsTickerA1 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerA2 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerA3 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerA4 gs-ticker-item">{layout.tickerText}</span>
                </div>
                <div className="mx-name-gsTickerGroupB gs-ticker-group">
                  <span className="mx-text mx-name-gsTickerB1 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerB2 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerB3 gs-ticker-item">{layout.tickerText}</span>
                  <span className="mx-text mx-name-gsTickerB4 gs-ticker-item">{layout.tickerText}</span>
                </div>
              </div>
            </div>
          </WidgetWrapper>

          {/* ----------------------------------------------------- gs-main-layout */}
          <div className="mx-name-gsMainLayout gs-main-layout">

            <WidgetWrapper mendixId="l.Main.NewLayout.topSidebarLeft">
              <div className="mx-name-topSidebarLeft top-sidebar-left">

                <div className="mx-name-gsNav gs-nav">
                  {layout.nav.map((item, i) => (
                    <div
                      key={item.name}
                      className={`mx-name-${item.name} gs-nav-item${i === activeNav ? ' is-active' : ''}`}
                      /* gsNavEngagement is the only nav item with an Action, so it is
                         the only one Mendix makes focusable. */
                      tabIndex={item.name === 'gsNavEngagement' ? 0 : undefined}
                      role={item.name === 'gsNavEngagement' ? 'button' : undefined}
                      onClick={() => setActiveNav(i)}
                    >
                      <MxImage name={`${item.name}Icon`} className="gs-nav-icon" src={`Main$gs_image$${item.icon}.svg`} />
                      <div className={`mx-name-${item.name}Text gs-nav-text`}>
                        <span className={`mx-text mx-name-${item.name}Title gs-nav-title`}>{item.title}</span>
                        <span className={`mx-text mx-name-${item.name}Sub gs-nav-sub`}>{item.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="mx-name-toggleDynamic toggle-dynamic"
                  onClick={() => setSidebarExpanded((v) => !v)}
                >
                  <MxImage name="gsToggleIcon" className="toggle-dynamic-icon" src="Main$gs_image$gs_nav_toggle.svg" />
                </div>

                {/* javascriptsnippet mount points. Mendix suffixes these class names with a
                    per-session hash; the behaviour itself is implemented above in React state. */}
                <div className="gsSidebarToggleJs1" />
                <div className="gsSidebarToggleJs" />

              </div>
            </WidgetWrapper>

            {/* placeholder Main -> the New_Dashboard page content */}
            <div className="mx-name-gsContentArea gs-content-area">
              <div className="mx-placeholder">{children}</div>
            </div>

          </div>
        </div>
      </div>

      {/* Portalled into <body>, so it adds no nodes inside the layout. */}
      <MoodCheckin open={moodOpen} triggerRef={moodRef} onClose={closeMood} />
    </div>
  );
}
