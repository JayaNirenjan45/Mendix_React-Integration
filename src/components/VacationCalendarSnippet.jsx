import React, { useMemo, useState } from 'react';
import { calendar } from '../data/dashboardData.js';

/**
 * snippetcall snippetCall14 -> Main.snip_vacationcalendar_New
 *
 * container244
 *   dataview dataView1  (Main.DS_GetEmployeeInfo)
 *     dataview dataView39 (Dashboard.DS_ReturnVancationObject)
 *       container228 (Class: 'calender-wrap')
 *         customvacationcalendar vacationCalendar1 (bahri.CustomVacationCalendar)
 *
 * The calendar logic below is ported from the widget's own source
 * (deployment/web/widgets/bahri/customvacationcalendar/CustomVacationCalendar.mjs):
 * month navigation, the Gregorian / Hijri switch using the Umm al-Qura calendar,
 * Friday + Saturday weekends, and today's highlight taken from the real clock.
 * The widget props mirror the ones set on vacationCalendar1 in the page model.
 */

const WIDGET_PROPS = {
  title: 'Calendar',
  defaultCalendar: 'gregorian',
  allowSystemSwitch: true,
  showLegend: true,
  firstDayOfWeek: 0, // "sunday"
  weekendMode: 'friSat',
  width: '100%',
  maxWidth: '640px',
  // Colour props are applied as CSS variables, exactly as the widget does.
  cssVars: {
    '--vc-card': '#f3f5f7',
    '--vc-ink': '#003c71',
    '--vc-tooltip-bg': '#2d83ae',
    '--vc-holiday-text': '#ffffff',
    '--vc-tooltip-text': '#ffffff',
    '--vc-button': '#215ea9',
    '--vc-weekday': '#003c71',
    '--vc-accent': '#c2410c'
  }
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/* ---- date helpers, as in the widget ------------------------------------- */

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWeekend(date, mode) {
  const d = date.getDay(); // 0 Sun .. 6 Sat
  if (mode === 'friSat') return d === 5 || d === 6;
  if (mode === 'satSun') return d === 6 || d === 0;
  return false;
}

/* ---- Hijri (Umm al-Qura) helpers ---------------------------------------- */

const HIJRI_LOCALE = 'en-u-ca-islamic-umalqura';
const hijriNumeric = new Intl.DateTimeFormat(HIJRI_LOCALE, { day: 'numeric', month: 'numeric', year: 'numeric' });
const hijriMonthLong = new Intl.DateTimeFormat(HIJRI_LOCALE, { month: 'long' });

function toHijri(date) {
  const o = { day: 0, month: 0, year: 0 };
  for (const p of hijriNumeric.formatToParts(date)) {
    if (p.type === 'day') o.day = parseInt(p.value, 10);
    else if (p.type === 'month') o.month = parseInt(p.value, 10);
    else if (p.type === 'year') o.year = parseInt(p.value, 10);
  }
  return o;
}

function hijriMonthName(date) {
  return hijriMonthLong.format(date);
}

/** First Gregorian date of the Hijri month containing `anchor`, and its length. */
function hijriGrid(anchor) {
  const h = toHijri(anchor);
  const first = new Date(anchor);
  first.setDate(first.getDate() - (h.day - 1));
  let n = 0;
  const probe = new Date(first);
  while (toHijri(probe).month === h.month) {
    n++;
    probe.setDate(probe.getDate() + 1);
  }
  return { hYear: h.year, first, days: n };
}

/* ---- the widget --------------------------------------------------------- */

function Calendar() {
  const { title, defaultCalendar, allowSystemSwitch, showLegend, firstDayOfWeek, weekendMode } = WIDGET_PROPS;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [system, setSystem] = useState(defaultCalendar);

  // No days off are configured for this employee (Dashboard.DS_GetVacationDetails
  // returns nothing), so there are no holiday items and no tooltips to show.
  const items = calendar.daysOff;

  const grid = useMemo(() => {
    if (system === 'hijri') {
      const g = hijriGrid(anchor);
      return { first: g.first, total: g.days, titleMain: hijriMonthName(g.first), titleSub: String(g.hYear) };
    }
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    return {
      first: new Date(y, m, 1),
      total: new Date(y, m + 1, 0).getDate(),
      titleMain: MONTHS[m],
      titleSub: String(y)
    };
  }, [anchor, system]);

  const goPrev = () => {
    if (system === 'hijri') {
      const prev = new Date(grid.first);
      prev.setDate(prev.getDate() - 1);
      setAnchor(prev);
    } else {
      // Step from the 1st so a 31st never rolls over into the following month.
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
    }
  };

  const goNext = () => {
    if (system === 'hijri') {
      const next = new Date(grid.first);
      next.setDate(next.getDate() + grid.total);
      setAnchor(next);
    } else {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
    }
  };

  const goToday = () => setAnchor(startOfDay(new Date()));

  const cells = [];
  const lead = (grid.first.getDay() - firstDayOfWeek + 7) % 7;
  for (let i = 0; i < lead; i++) {
    cells.push(<div key={`e${i}`} className="vc-day vc-day--empty" />);
  }
  for (let i = 0; i < grid.total; i++) {
    const date = new Date(grid.first);
    date.setDate(date.getDate() + i);
    const primary = system === 'hijri' ? i + 1 : date.getDate();
    const secondary = system === 'hijri' ? date.getDate() : toHijri(date).day;

    const classes = ['vc-day'];
    if (isWeekend(date, weekendMode)) classes.push('vc-day--weekend');
    if (sameDay(date, today)) classes.push('vc-day--today');

    cells.push(
      <div key={i} className={classes.join(' ')}>
        <span className="vc-day__num">{primary}</span>
        <span className="vc-day__alt">{secondary}</span>
      </div>
    );
  }

  // The widget renders Sun..Sat; the page's javascriptsnippet (gsSidebarToggleJs)
  // then trims every label to its first letter. This is that final text.
  const weekdayLabels = useMemo(() => {
    const base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, i) => base[(firstDayOfWeek + i) % 7].charAt(0));
  }, [firstDayOfWeek]);

  return (
    <div className="vc-calendar">
      {title && (
        <div className="vc-titlebar">
          <div className="vc-titleblock">
            <div className="vc-widget-title">{title}</div>
            <div className="vc-title-rule" />
          </div>
        </div>
      )}

      {allowSystemSwitch && (
        <div className="vc-modebar">
          <button
            type="button"
            className={system === 'gregorian' ? 'vc-mode vc-mode--active' : 'vc-mode'}
            onClick={() => setSystem('gregorian')}
          >
            Gregorian
          </button>
          <button
            type="button"
            className={system === 'hijri' ? 'vc-mode vc-mode--active' : 'vc-mode'}
            onClick={() => setSystem('hijri')}
          >
            Hijri
          </button>
        </div>
      )}

      <div className="vc-header">
        <div className="vc-title">
          {grid.titleMain} <span>{grid.titleSub}</span>
        </div>
        <div className="vc-nav">
          <button type="button" className="vc-today" onClick={goToday}>Today</button>
          <button type="button" className="vc-arrow" onClick={goPrev} aria-label="Previous">&lsaquo;</button>
          <button type="button" className="vc-arrow" onClick={goNext} aria-label="Next">&rsaquo;</button>
        </div>
      </div>

      <div className="vc-weekdays">
        {weekdayLabels.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>

      <div className="vc-days">{cells}</div>

      {showLegend && items.length === 0 && (
        <div className="vc-empty">{calendar.emptyLegend}</div>
      )}
    </div>
  );
}

export default function VacationCalendarSnippet() {
  const rootStyle = { width: WIDGET_PROPS.width, maxWidth: WIDGET_PROPS.maxWidth, ...WIDGET_PROPS.cssVars };

  return (
    <div className="mx-name-container244">
      <div className="mx-dataview mx-name-dataView1 form-horizontal">
        <div className="mx-dataview-content">
          <div className="mx-dataview mx-name-dataView39 form-horizontal">
            <div className="mx-dataview-content">
              <div className="mx-name-container228 calender-wrap">
                <div className="vc-widget" style={rootStyle}>
                  <Calendar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
