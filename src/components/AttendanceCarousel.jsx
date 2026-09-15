import React, { useState, useRef, useLayoutEffect } from 'react';
import { attendance } from '../data/dashboardData.js';

/**
 * container16
 *   dataview dataView2 (Employee_Attendance_System.DS_TodayAttendanceData_2)
 *     slickcarousel slickCarousel1 (dots: true, infinite: true, arrows: false)
 *       slidelist1 -> container26 (Class: 'timear-work')   + attendancecard1
 *
 * The carousel has a single slide. react-slick, which the widget bundles, switches
 * to "unslick" when there are no more slides than slidesToShow (1): no cloned
 * slides, no arrows and no dots, even with infinite and dots turned on. It emits
 *   .slider-outer > .slick-slider > .slick-list > .slick-track > .slick-slide
 *
 * slick still measures its container and writes the result back as inline widths on
 * the track and the slide. Those inline widths are what pin .right-lay to its
 * max-width of 70%, so they are reproduced here with the same measure-and-write
 * cycle rather than hardcoded; a ResizeObserver keeps them in step on resize.
 */

/* attendancecard1 (attendance card widget), copied from the live DOM */
function AttendanceCard() {
  return (
    <div className="ac-card attendance-card-widget">

      <div className="ac-header">
        <div className="ac-header-left">
          <svg className="ac-calendar-icon" width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="0.623377" y="0.623377" width="31.4805" height="31.4805" rx="9.1948" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.24675" />
            <path d="M13.4062 9.50195V12.2292" stroke="#6B7280" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.8594 9.50195V12.2292" stroke="#6B7280" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.9052 10.8662H11.3597C10.6066 10.8662 9.99609 11.4767 9.99609 12.2298V21.7753C9.99609 22.5284 10.6066 23.1389 11.3597 23.1389H20.9052C21.6583 23.1389 22.2688 22.5284 22.2688 21.7753V12.2298C22.2688 11.4767 21.6583 10.8662 20.9052 10.8662Z" stroke="#6B7280" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.99609 14.957H22.2688" stroke="#6B7280" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="ac-title">{attendance.title}</p>
          <button type="button" className="ac-icon-btn" disabled aria-label="Open attendance details">
            <svg width="22" height="22" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9.5625 18.6277L15.7963 12.3939L9.5625 6.16016" stroke="#99A1AF" strokeWidth="2.07792" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button type="button" className="ac-icon-btn" disabled aria-label="Attendance action">
          <svg width="26" height="24" viewBox="0 0 49 46" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M6.125 40.25V36.4167H10.2083V9.58333C10.2083 8.52917 10.6082 7.62674 11.4078 6.87604C12.2075 6.12535 13.1687 5.75 14.2917 5.75H34.7083C35.8312 5.75 36.7925 6.12535 37.5922 6.87604C38.3918 7.62674 38.7917 8.52917 38.7917 9.58333V36.4167H42.875V40.25H6.125ZM14.2917 36.4167H34.7083V9.58333H14.2917V36.4167ZM20.4167 24.9167C20.9951 24.9167 21.48 24.733 21.8714 24.3656C22.2627 23.9983 22.4583 23.5431 22.4583 23C22.4583 22.4569 22.2627 22.0017 21.8714 21.6344C21.48 21.267 20.9951 21.0833 20.4167 21.0833C19.8382 21.0833 19.3533 21.267 18.962 21.6344C18.5707 22.0017 18.375 22.4569 18.375 23C18.375 23.5431 18.5707 23.9983 18.962 24.3656C19.3533 24.733 19.8382 24.9167 20.4167 24.9167Z" fill="black" />
          </svg>
        </button>
      </div>

      <div className="ac-fields">
        <div className="ac-field">
          <p className="ac-field-label">{attendance.dateLabel}</p>
          <p className="ac-field-value">{attendance.dateValue}</p>
        </div>
        <div className="ac-field">
          <p className="ac-field-label">{attendance.balanceLabel}</p>
          <p className="ac-field-value">{attendance.balanceValue}</p>
        </div>
      </div>

      <div className="ac-timer" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
        <div className="ac-timer-value">{attendance.timerValue}</div>
        <p className="ac-timer-sub">{attendance.timerSub}</p>
        <div className="ac-timer-progress" style={{ width: '0%' }} />
      </div>

      <div className="ac-times">
        <div className="ac-time">
          <ClockIcon />
          <span>{attendance.punchIn}</span>
        </div>
        <div className="ac-time">
          <ClockIcon />
          <span>{attendance.punchOut}</span>
        </div>
      </div>

      <div className="ac-actions">
        <button type="button" className="ac-btn ac-btn-primary">{attendance.btnIn}</button>
        <button type="button" className="ac-btn ac-btn-secondary" disabled>{attendance.btnOut}</button>
      </div>

    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.63459 14.4547C11.4002 14.4547 14.4528 11.4021 14.4528 7.63654C14.4528 3.87096 11.4002 0.818359 7.63459 0.818359C3.86901 0.818359 0.816406 3.87096 0.816406 7.63654C0.816406 11.4021 3.86901 14.4547 7.63459 14.4547Z" stroke="#2B2B2B" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.63459 4.22754V7.63663L9.90065 8.99118" stroke="#2B2B2B" strokeWidth="1.44" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* slidelist1 -> container26 (Class: 'timear-work') */
function SlideAttendance() {
  return (
    <div className="mx-name-container26 timear-work">
      <AttendanceCard />
    </div>
  );
}

/* The only slide: active and current, with outline:none and the measured width. */
function Slide({ width }) {
  return (
    <div
      className="slick-slide slick-active slick-current"
      data-index={0}
      tabIndex={-1}
      aria-hidden="false"
      style={{ outline: 'none', width }}
    >
      <div>
        <div className="slide">
          <div className="slide-content">
            <SlideAttendance />
          </div>
          <div className="slide-caption" />
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCarousel() {
  const listRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);

  /**
   * slick measures .slick-list and writes the width onto the track and slides.
   *
   * Writing those widths changes the min-content of .right-lay, which changes the
   * flex resolution, which changes the measured width again. The loop settles after
   * one or two passes, so re-measure across a few animation frames until the value
   * stops moving instead of relying on ResizeObserver alone: a resize a callback
   * causes itself can be dropped by the browser's RO loop guard.
   */
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;

    let frame = 0;
    let timer = 0;
    let applied = -1;

    /* Keep re-measuring until the width stops moving. Each pass changes the
       min-content of .right-lay, so the second pass is the one that lands on the
       final value; the cap just guarantees termination. */
    const settle = (remaining) => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w !== applied) {
        applied = w;
        setSlideWidth(w);
      }
      if (remaining > 0) {
        frame = requestAnimationFrame(() => settle(remaining - 1));
      }
    };

    settle(10);
    /* one late pass for anything that shifts the layout after first paint
       (web fonts, images decoding) */
    timer = setTimeout(() => settle(3), 250);

    const onResize = () => settle(4);
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const px = slideWidth ? `${slideWidth}px` : undefined;
  /* One slide: the track is one slide wide and never moves. */
  const trackStyle = slideWidth
    ? {
        width: px,
        opacity: 1,
        transform: 'translate3d(0px, 0px, 0px)'
      }
    : undefined;

  return (
    <div className="mx-name-container16">
      <div className="mx-dataview mx-name-dataView2 form-horizontal">
        <div className="mx-dataview-content">
          <div className="slider-outer">
            <div className="slick-slider slick-initialized">
              <div className="slick-list" ref={listRef}>
                <div className="slick-track" style={trackStyle}>
                  <Slide width={px} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
