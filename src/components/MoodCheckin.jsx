import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Daily check-in (mood) popup, ported from the Mendix theme script
 * theme/web/gs-mood-checkin.js.
 *
 * Clicking the header emoji (.gs-header-mood) opens the popup under it; the back
 * arrow, Escape, a click outside, or navigating back closes it. Choosing a mood
 * enables the arrow button, which stores the check-in and closes the popup.
 *
 * Like the original, the popup is appended to <body>: its styles (.gs-mood-pop in
 * atom-gs.scss) live outside the .gs-bahri-layout scope. The markup, classes,
 * ARIA attributes and the ring geometry are the same as the script produces.
 */

const IMG_DIR = '/gs-bahri/gs-images/mood/';

// Clockwise from the top, 40deg apart, matching the Figma frame.
const MOODS = ['Bored', 'Neutral', 'Happy', 'Sad', 'Angry', 'Surprised', 'Loving', 'Inspired', 'Calm'];

// Figma frame units (675 x 875).
const RING_CX = 338;
const RING_CY = 403;
const RING_R = 197;
const ICON = 104;
const GAP = 12;
const EDGE = 16;

// Matches the 0.18s / 0.2s transitions on .gs-mood-pop.
const EXIT_MS = 200;

const RING = MOODS.map((mood, i) => {
  const a = ((10 + i * 40) * Math.PI) / 180;
  return {
    mood,
    x: (RING_CX + RING_R * Math.sin(a) - ICON / 2).toFixed(1),
    y: (RING_CY - RING_R * Math.cos(a) - ICON / 2).toFixed(1),
    i
  };
});

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * @param {boolean}  open        whether the popup should be showing
 * @param {object}   triggerRef  ref to the .gs-header-mood element it is anchored to
 * @param {function} onClose     asks the owner to set open=false
 */
export default function MoodCheckin({ open, triggerRef, onClose }) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pos, setPos] = useState({ left: 0, top: 0, origin: '50% 0' });
  const popRef = useRef(null);
  const backRef = useRef(null);

  // Mount on open, then unmount only after the exit transition has run.
  useEffect(() => {
    if (open) {
      setSelected(null);
      setMounted(true);
      return undefined;
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  // Centred under the emoji, kept inside the viewport.
  const position = useCallback(() => {
    const pop = popRef.current;
    const trigger = triggerRef.current;
    if (!pop || !trigger) return;
    if (!document.body.contains(trigger)) {
      onClose();
      return;
    }
    const r = trigger.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const left = Math.min(Math.max(EDGE, r.left + r.width / 2 - w / 2), vw - w - EDGE);
    let top = r.bottom + GAP;
    if (top + h > vh - EDGE) top = Math.max(EDGE, vh - h - EDGE);

    setPos({
      left,
      top,
      origin: `${r.left + r.width / 2 - left}px ${r.top + r.height / 2 - top}px`
    });
  }, [triggerRef, onClose]);

  // Position before paint, then add the --open class next frame so the entry
  // transition runs, and move focus into the dialog.
  useLayoutEffect(() => {
    if (!mounted || !open) return undefined;
    position();
    const raf = requestAnimationFrame(() => setVisible(true));
    backRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(raf);
  }, [mounted, open, position]);

  // Resize, Escape, outside click and history navigation all close or reposition.
  useEffect(() => {
    if (!mounted || !open) return undefined;

    const onKeydown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onOutside = (e) => {
      const pop = popRef.current;
      const trigger = triggerRef.current;
      if (pop && !pop.contains(e.target) && !(trigger && trigger.contains(e.target))) onClose();
    };

    window.addEventListener('resize', position);
    window.addEventListener('popstate', onClose);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onOutside, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('popstate', onClose);
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onOutside, true);
    };
  }, [mounted, open, position, onClose, triggerRef]);

  // Return focus to the emoji once the popup closes.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const trigger = triggerRef.current;
      if (trigger && document.body.contains(trigger) && trigger.focus) trigger.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open, triggerRef]);

  const submit = () => {
    if (!selected) return;
    try {
      localStorage.setItem('gsDailyMood', JSON.stringify({ mood: selected, date: new Date().toISOString().slice(0, 10) }));
    } catch (e) {
      // storage unavailable; the selection is still broadcast below
    }
    // Same hook the Mendix script exposes for persisting the check-in.
    window.dispatchEvent(new CustomEvent('gs:mood-checkin', { detail: { mood: selected } }));
    onClose();
  };

  if (!mounted) return null;

  const className =
    'gs-mood-pop' +
    (visible ? ' gs-mood-pop--open' : '') +
    (selected ? ' gs-mood-pop--has-selection' : '');

  return createPortal(
    <div
      ref={popRef}
      className={className}
      role="dialog"
      aria-labelledby="gs-mood-pop-title"
      style={{ left: `${pos.left}px`, top: `${pos.top}px`, transformOrigin: pos.origin }}
    >
      <button ref={backRef} type="button" className="gs-mood-pop__back" aria-label="Close" onClick={onClose}>
        <ArrowLeft />
      </button>
      <div className="gs-mood-pop__eyebrow">Daily Check-in</div>
      <div className="gs-mood-pop__ring" role="radiogroup" aria-labelledby="gs-mood-pop-title">
        {RING.map(({ mood, x, y, i }) => (
          <button
            key={mood}
            type="button"
            className="gs-mood-pop__mood"
            role="radio"
            aria-checked={String(selected === mood)}
            data-mood={mood}
            aria-label={mood}
            style={{ '--x': x, '--y': y, '--i': i }}
            onClick={() => setSelected(mood)}
          >
            <img src={`${IMG_DIR}mood-circle-${mood}.svg`} alt="" draggable="false" />
          </button>
        ))}
      </div>
      <h2 className="gs-mood-pop__title" id="gs-mood-pop-title">
        How are you
        <br />
        feeling today?
      </h2>
      <div className="gs-mood-pop__hint">{selected ? `Feeling ${selected}` : 'Choose your mood'}</div>
      <button type="button" className="gs-mood-pop__next" aria-label="Continue" disabled={!selected} onClick={submit}>
        <ArrowRight />
      </button>
    </div>,
    document.body
  );
}
