# Bahri React — New_Dashboard

React replication of the Mendix **`Main.New_Dashboard`** page rendered on the
**`Main.NewLayout`** layout, from the Employee Hub app.

The goal is a 1-to-1 DOM and class-name match with the Mendix output so the
existing stylesheets apply unchanged.

## Verified parity

Measured against the live Mendix page at
`http://localhost:8080/link/THome?profile=Responsive`, both at a 2400x1200 viewport:

| Check | Mendix | React |
|---|---|---|
| Element count under `.gs-bahri-layout` | 853 | 853 |
| Structural hash (tag + classes at every depth) | `788aba29` | `788aba29` |
| Page box | 2385 x 4115 | 2385 x 4115 |
| `.left-lay` / `.right-lay` | 588 / 1522 | 588 / 1522 |
| Broken images | 0 | 0 |

The structural hash walks the whole tree and records each element's tag plus its
sorted class list at its depth, so an identical hash means every element, class
and nesting level matches.

These figures predate the header's grayscale toggle and user menu (see
[Behaviour carried over](#behaviour-carried-over)). Those widgets were added to
`Main.NewLayout` and to this app together, and their DOM here is taken from the
widgets' own source, so re-measure against the live page once Mendix has been run
with the new layout.

## Running it

```bash
npm install && npm run dev
```

Opens on `http://localhost:5173`.

## Stylesheets

Load order in `index.html` mirrors what the Mendix client injects at runtime.

| File | Origin | Modified |
|---|---|---|
| `public/mx-theme/widgets/widgets.css` | `deployment/web/widgets/widgets.css` | no |
| `public/mx-theme/theme.compiled.css` | `deployment/web/theme.compiled.css` | yes: its compiled copy of atom-gs.scss is removed, see below |
| `public/mx-theme/RadiobuttonList.css` | `deployment/web/widgets/com/tgict/widget/web/radiobuttonlist/` | no |
| `src/styles/atom-bahri-imagedirect.scss` | the last two rules of `theme/web/atom-bahri-imagedirect.scss` | the dashboard background images; loaded before atom-gs.scss |
| `src/styles/gs-bahri/atom-gs.scss` | `theme/web/gs-bahri/atom-gs.scss` | the single source for these rules; edit here, and keep it byte-identical to the Mendix copy |
| `src/styles/gs-bahri/atom-gs-responsive.scss` | written for this app | responsive layer, loaded after atom-gs.scss |

**Why the compiled theme no longer contains atom-gs.** Mendix compiles
`atom-gs.scss` into `theme.compiled.css`, so the vendored file carried a second,
frozen copy of every atom-gs rule. An edit in `src/.../atom-gs.scss` that changed
a value still won, because that file loads last, but a declaration that was
*removed* kept applying from the frozen copy. For example, changing the badge's
`height: 24px` to `min-height: 24px` had no effect. That block (lines 31508-33408
and its hoisted Inter/Outfit font `@import` on line 4) has been deleted, so atom-gs
now comes only from `src/`.

If `theme.compiled.css` is ever re-copied from a Mendix build, strip the atom-gs
block again. Also strip any `atom-gs-responsive.scss` rules, if that file has been
added to the Mendix `main.scss`. Otherwise the same stale-rule problem returns.

`public/` files are not hot-reloaded: after changing one, refresh the browser.

`atom-gs.scss` is scoped under `.gs-bahri-layout` and styles classes it does not
itself define, such as `.d-flex`, `.w-100`, `.spacing-outer-bottom-large`, `.btn`,
`.form-control` and `.mx-listview`. Those come from Mendix's compiled theme, which
is why `theme.compiled.css` is vendored alongside it. The vendor files live under
`public/` so their own relative `url()` references keep resolving; the fonts and
images they point at were copied next to them.

`atom-gs.scss` is imported last, from `src/main.jsx`, matching Mendix where
`main.scss` ends with `@import "gs-bahri/atom-gs.scss"`.

## Responsive behaviour

`atom-gs-responsive.scss` holds every dashboard responsive rule and mirrors the
selector depth of `atom-gs.scss`, so it wins on source order. The one exception is
the header block at the end of `atom-gs.scss`: it ships from Mendix with its own
small-phone rule, which shrinks the grayscale toggle and hides the weather pill
below 480px.

Two kinds of breakpoint are used, because two different things narrow the page.

**Viewport media queries** handle the page frame and device modes:

| Band | Width | What changes |
|---|---|---|
| Mobile | up to 767px | Single column. Header drops to 64px and hides the name/role and weather city. The 113px sidebar becomes a horizontal icon strip. Reduced font sizes. |
| Tablet | 768 – 1023px | Rails stack, cards go two-up, sidebar stays vertical, header hides the name/role only. Reduced font sizes. |
| Desktop | 1024 – 1919px | Content-area padding eases down via `clamp()`. |
| Baseline | 1920px and up | Untouched. Covers 1920 at 100% and at 80% zoom (2400px). |

**Container queries on `.gs-content-area`** handle the dashboard rows. On a desktop
the content width shrinks for two reasons, browser zoom and expanding the sidebar
from 113px to 385px, and the rows respond to the real width either way:

| Tier | Content width | What changes |
|---|---|---|
| Fluid | 1693px and below | Rows wrap on pixel bases and min-widths. When the Quick Links row wraps, Employee of the Month takes the full width. |
| Stack | 839px and below | The two rails and the celebrations row stack. |
| Narrow | 580px and below | Single-column rows. Reached with the sidebar expanded on a tablet or around 1024px. |

With the sidebar collapsed, 1693px of content is exactly a 1919px viewport and the
narrowest desktop has 840px, so the fluid and stack tiers switch at the same widths
the old viewport band did; only the expanded sidebar reaches the lower tiers.

Desktop font sizes are never touched. Only the mobile and tablet queries adjust type.

On mobile the sidebar strip gets its full width from `align-self: stretch` rather
than `width: 100%`. atom-gs animates that element's width for the expand toggle, and
100% to 113px is interpolable, so leaving mobile used to slide the sidebar from full
width down to 113px and push the content off-screen for the duration.

Zoom stability is the reason the fluid band exists. Browser zoom rescales the CSS
viewport, so a 1920px screen reports 1536px at 125% and a 1366px screen reports
1092px. Measured at 1092px, the Quick Links tiles were collapsing to 47px wide and
the calendar grid was spilling over the right-hand rail. Verified results:

| Viewport | Quick Links tile | Horizontal scroll |
|---|---|---|
| 2400px (1920 at 80%) | 210px | none |
| 1920px (baseline) | 138px, unchanged | none |
| 1536px (1920 at 125%) | 87px → 105px | none |
| 1280px (1600 at 125%) | 47px → 141px | none |
| 1092px (1366 at 125%) | 47px → 214px | none |

Zooming out to 2400px and back, or in to 1536px and back, returns the layout to
the exact baseline measurements each time.

Two flexbox details drove the implementation. With `flex-wrap: wrap`, lines break
on each item's flex-basis before `flex-shrink` runs, so any row whose bases sum to
100% wraps as soon as a gap exists; every wrapped row therefore uses a pixel basis
instead. And `flex-basis: 0` with proportional `flex-grow` keeps a ratio such as
the 66/34 celebrations split intact while `min-width` still decides when to break.

### Fixed-size widgets

Three parts of `atom-gs.scss` are sized in absolute pixels that only add up at
full width, so each one breaks out of its card as the content narrows. They are
fixed together in one rule set, applied by the fluid container tier on desktop and
by the handheld media query below 1024px, which leaves the baseline untouched.

- **Celebration avatars.** The list `<ul>` is a `nowrap` flex row of ten 44px
  avatars with 44px gaps, a fixed 836px, and the list is a flex item with the
  default `min-width: auto` so it cannot shrink. Below about 1600px the last
  avatars left the card and landed on the Viva Engage column. The row now wraps
  and the list can shrink.
- **Employee of the Month.** `EmployeeOfMonth.svg` only fits a card of roughly its
  own 380 x 460 shape. The blue panel inside it stops 10px short of the file's
  edges, so `cover` leaves white strips down a wide card, and the SVG keeps its
  aspect ratio, so a non-uniform `background-size` letterboxes it into a narrow
  column. Below the baseline the panel is drawn in CSS from the SVG's own 15
  gradient stops and its 5%-opacity corner circle. At the original shape the
  `131deg` gradient is 577 units long against the SVG's 576, so the two match.
- **Calendar grid.** Seven rigid 46px columns, with the today pill pinned by
  `min-width` and `max-width` as well. The columns now share the row.

## Images

All images the page requests were copied from `deployment/web/img/` into
`public/img/`, keeping the Mendix `Module$Collection$Name.svg` filenames so the
`src` values line up with the originals. The mood check-in faces are in
`public/gs-bahri/gs-images/mood/`, the same relative path the Mendix script uses.

The Employee of the Month artwork and the celebration tile artwork come from
`src/styles/atom-bahri-imagedirect.scss`, which holds the same two rules that end
the Mendix `theme/web/atom-bahri-imagedirect.scss`. As in Mendix,
`EmployeeOfMonth.svg` and `bdaycontainer.svg` sit next to the stylesheet, and
`main.jsx` imports it before `atom-gs.scss`, matching Mendix's `main.scss`. The order
matters: the `background` shorthand resets position, repeat and size, and
`atom-gs.scss` then sets them. Vite inlines the small `EmployeeOfMonth.svg` as a
data URI, while `bdaycontainer.svg` is served as a file.

The footer social icons are painted from `atom-gs.scss` itself, as
`url("img/Main$Images$social_*.svg")`. In Mendix that path is relative to
`theme.compiled.css`, at the web root. Here it is relative to the stylesheet, so
the six SVGs are kept in `src/styles/gs-bahri/img/`, byte-identical to the Mendix
copies. Without them the dev server still finds `/img/...`, but a production build
cannot resolve the path and the icons disappear.

## Mendix to JSX conventions

| Mendix model | Rendered DOM |
|---|---|
| `container name (Class: 'x')` | `<div class="mx-name-name x">` |
| `dynamictext name (Class: 'x')` | `<span class="mx-text mx-name-name x">` |
| `dynamictext` with `RenderMode: H2` | `<h2 class="mx-text ...">` |
| `image name` | `<div class="mx-image-viewer mx-image-viewer-responsive mx-name-name x"><img class="" alt="" role="img"></div>` |
| `Forms$StaticImageViewer` | `<img class="mx-image mx-name-name img-responsive" role="presentation">` |
| `actionbutton` | `<button type="button" class="btn mx-button mx-name-name btn-default" title="" data-button-id="..." data-disabled="false">` (layout buttons use a `l.Main.NewLayout.` id) |
| `popupmenu name (Class: 'x')` | `<div class="popupmenu mx-name-name x"><div class="popupmenu-trigger" data-state="closed">`, plus `<div class="widget-popupmenu-root"><ul class="popupmenu-menu"><li class="popupmenu-custom-item">` while open |
| `javascriptsnippet name` | `<div class="name" style="display:contents">`; Mendix adds a per-session suffix to the class |
| `linkbutton` | `<a class="mx-link mx-name-name" role="link" data-button-id="..." data-disabled="false">` |
| `dataview` | `<div class="mx-dataview mx-name-name form-horizontal"><div class="mx-dataview-content">` |
| `listview` | `<div class="mx-listview mx-name-name"><ul><li class="mx-name-index-N">` |
| `tabcontainer` | `<div class="mx-tabcontainer ..."><ul class="nav nav-tabs mx-tabcontainer-tabs">` |
| `Spacing margin-bottom: L` | `spacing-outer-bottom-large` |
| `Weight: Gotham-Bold` | `GothamBold` |
| `placeholder Main` | `<div class="mx-placeholder">` |

The primitives that emit these live in `src/components/MxWidgets.jsx`.

Mendix also wraps some widgets in a bare `<div data-widget-wrapper style="display:contents">`.
Those are reproduced because they are real nodes in the tree. The runtime-generated
`id` / `widgetid` attributes are not, since they change on every Mendix session and
no stylesheet selects on them.

## Files

| File | Mendix source |
|---|---|
| `src/App.jsx` | binds the page to the layout |
| `src/components/NewLayout.jsx` | `Main.NewLayout` |
| `src/components/MoodCheckin.jsx` | theme script `gs-mood-checkin.js` |
| `src/components/NewDashboard.jsx` | `Main.New_Dashboard`, `container2` |
| `src/components/MxWidgets.jsx` | shared Mendix widget primitives |
| `src/components/PopupMenu.jsx` | the Pop-up menu widget, `com.mendix.widget.web.popupmenu.PopupMenu` 4.0.2 |
| `src/components/MxComboBox.jsx` | the `combobox` widget |
| `src/components/PromotionsCard.jsx` | `container76`, `black-card` |
| `src/components/CeoMessageSnippet.jsx` | snippet `Main.snip_ceomessage` |
| `src/components/VacationCalendarSnippet.jsx` | snippet `Main.snip_vacationcalendar_New` |
| `src/components/ScheduleAndEvents.jsx` | `container244` `list-ts`, `container245` `list-eve` |
| `src/components/LatestNews.jsx` | `container8`, `lates-newss` |
| `src/components/LinksRow.jsx` | `gsLinksRow`, quick links, resources, employee of the month |
| `src/components/AttendanceCarousel.jsx` | `container16`, `dataView2`, the slick carousel |
| `src/components/ApprovalsCard.jsx` | `container21`, `gs-approvals-card` |
| `src/components/ServicesRow.jsx` | `svcRow`, `gs-services-row` |
| `src/components/CelebrationsRow.jsx` | `gsCelebrationsRow` + snippet `Main.SNippet_Engage` |
| `src/components/OrganizationSection.jsx` | `container900`, `organization-section` |
| `src/components/FooterTop.jsx` | `container14`, `b-footer-top` |
| `src/data/dashboardData.js` | all page text, each block labelled with the datasource it replaces |

## Behaviour carried over

The `javascriptsnippet` widgets in the layout are reimplemented as React state
rather than global click listeners: the sidebar toggle adds `gs-sidebar-expanded`
to `.gs-bahri-layout`, and clicking a nav item moves `is-active` between
`.gs-nav-item` elements. Their mount-point divs are still rendered. The two header
snippets are described below.

**Grayscale mode.** The round `gsHeaderGrayscale` button, left of the check-in
emoji, stands in for the `gsGrayscaleJs` snippet. Every page load starts in
grayscale, and each click switches it off or back on. The `gs-grayscale` class goes
on `<html>`, because a CSS filter on any other element would break `position: fixed`
children such as the check-in popup; it is applied in a layout effect, before the
first paint. The button carries the `aria-pressed`, `aria-label` and `title` the
snippet sets.

**User menu.** The user block (avatar, name, role, chevron) is the trigger of the
`gsUserMenu` Pop-up menu. `PopupMenu.jsx` follows the widget's Floating UI setup:
- The menu sits 5px below its trigger. It flips to the other side when there is
  no room and shifts to stay on screen.
- Enter or Space on the trigger toggles it, and Escape or a click outside closes it.
- Focus moves to the first control in the menu and stays there until the menu
  closes, then returns to the trigger.

The trigger also gets the `tabindex="0"` and `role="button"` that the `gsUserMenuJs`
snippet adds. The only item is a Sign out action button with the Atlas `logout`
icon. Mendix's Sign out ends the session and reloads into the login page. There is
no session here, so it reloads `layout.signOutUrl` from `dashboardData.js`
(default `/`).

The slick carousel measures `.slick-list` and writes the result back as inline
widths on the track and slides, the same measure-and-write cycle the real widget
runs. Those inline widths are what pin `.right-lay` to its 70% max-width, so the
three/nine column split only matches Mendix once they are applied. `slickCarousel1`
now has a single slide (the attendance card). react-slick therefore runs in
"unslick" mode: one slide, no clones and no dots.

Selecting a celebration tile adds `expand-part` and reveals that tile's send link,
standing in for the `Main.ACT_SelectEvent` nanoflow and the `DynamicClasses`
expression on `container150`..`container157`.

**Mood check-in.** `src/components/MoodCheckin.jsx` is a port of the Mendix theme
script `theme/web/gs-mood-checkin.js`. Clicking the header emoji opens the popup under
it; the back arrow, Escape, a click outside, or navigating back closes it. Picking a
mood enables the arrow, which writes `gsDailyMood` to localStorage, dispatches the
same `gs:mood-checkin` event the script exposes, and closes. Like the original it is
rendered into `<body>`, since its `.gs-mood-pop` styles sit outside the layout scope,
with the same markup, ARIA attributes and ring geometry.

**Calendar.** `VacationCalendarSnippet.jsx` ports the logic of the
`bahri.CustomVacationCalendar` widget from its bundled source: month navigation, the
Gregorian / Hijri switch using the Umm al-Qura calendar through `Intl`, Friday and
Saturday weekends, and today taken from the real clock. One deliberate difference:
Gregorian navigation steps from the 1st of the month, where the widget calls
`setMonth` on the current day and would skip February when starting from the 31st.

**Approvals & My Requests.** Each tab mirrors its datasource microflow:
`DS_GetRequestDetailsList_ExeuctiveTemplate` for All, and `State` of `In Progress`,
`Completed` or `Rejected` for Pending, Approved and Reject, sorted by creation date
and shown two at a time (PageSize 2, with the hidden "Load more" button Mendix adds).
The deadline line is the page's own expression, so it reads `Today`, `Tomorrow` or the
weekday. The decorative filter icon `gsApprovalsFilter` (`Main.gs_image.filter_icon`)
sits just before the tab container, and `atom-gs.scss` lines it up to the left of
the "All" tab.

## Data

There is no Mendix runtime behind this app. Everything a microflow or database
retrieve would supply is captured in `src/data/dashboardData.js`, each block
commented with the datasource it stands in for. The request types and states in the
approvals data are the real `Main.ENUM_CommonRequestTypes` and `Main.ENUM_State`
captions; their dates are stored as day offsets from today so the `Today` and
`Tomorrow` wording stays meaningful. The Mendix project was only read, except for
the header's grayscale toggle and user menu, which were added to `Main.NewLayout` and
its `atom-gs.scss` on request before being carried over here.
