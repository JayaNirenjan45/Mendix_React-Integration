import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * com.mendix.widget.web.popupmenu.PopupMenu v4.0.2, advanced mode, "Open on: Click".
 *
 * Emits the DOM the widget renders (read from its bundled source):
 *
 *   <div class="popupmenu mx-name-<name> <class>">
 *     <div class="popupmenu-trigger" data-state="closed|open" aria-expanded aria-haspopup="dialog">
 *       menu trigger widgets
 *     </div>
 *     -- only while open --
 *     <span data-floating-ui-focus-guard ...>          focus trap, before
 *     <div class="widget-popupmenu-root">
 *       <ul class="popupmenu-menu" id role="dialog" tabindex="-1" style="position:absolute; left:0; top:0; transform">
 *         <li class="popupmenu-custom-item"> item content widgets </li>
 *     <span data-floating-ui-focus-guard ...>          focus trap, after
 *   </div>
 *
 * Behaviour follows the widget's Floating UI setup: placement with a 5px offset,
 * flip to the opposite side when there is no room, shift to stay inside the
 * viewport; Enter or Space on the trigger toggles; Escape and a pointerdown
 * outside close; focus moves to the first focusable element in the menu, is
 * trapped there, and returns to the trigger when the menu closes.
 *
 * @param {string}   name          Mendix widget name, emitted as mx-name-<name>
 * @param {string}   className     the widget's Class property
 * @param {string}   position      Menu position: bottom | top | left | right
 * @param {object}   triggerProps  extra attributes for .popupmenu-trigger
 * @param {node}     trigger       the "area to open or close the menu" widgets
 * @param {Array}    customItems   [{ key, content, action? }]; action runs after the menu closes
 */

const OFFSET = 5;
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Floating UI's FocusGuard styles: focusable, but invisible and out of the flow.
const GUARD_STYLE = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'fixed',
  whiteSpace: 'nowrap',
  width: '1px',
  top: 0,
  left: 0
};

function coordsFor(placement, ref, width, height) {
  switch (placement) {
    case 'top':
      return { x: ref.left + ref.width / 2 - width / 2, y: ref.top - height - OFFSET };
    case 'left':
      return { x: ref.left - width - OFFSET, y: ref.top + ref.height / 2 - height / 2 };
    case 'right':
      return { x: ref.right + OFFSET, y: ref.top + ref.height / 2 - height / 2 };
    default:
      return { x: ref.left + ref.width / 2 - width / 2, y: ref.bottom + OFFSET };
  }
}

// How far a box at (x, y) sticks out past the viewport edge on the placement's own side.
function mainOverflow(placement, { x, y }, width, height, vw, vh) {
  switch (placement) {
    case 'top':
      return -y;
    case 'left':
      return -x;
    case 'right':
      return x + width - vw;
    default:
      return y + height - vh;
  }
}

export default function PopupMenu({ name, className, position = 'bottom', triggerProps, trigger, customItems = [] }) {
  const [open, setOpen] = useState(false);
  const [floatingStyle, setFloatingStyle] = useState({ position: 'absolute', left: 0, top: 0 });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const spaceDown = useRef(false);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // flip + shift, then express the result relative to the offset parent, as Floating UI does.
  const updatePosition = useCallback(() => {
    const reference = triggerRef.current;
    const floating = menuRef.current;
    if (!reference || !floating) return;
    const parent = floating.offsetParent || document.documentElement;
    const ref = reference.getBoundingClientRect();
    const box = parent.getBoundingClientRect();
    const width = floating.offsetWidth;
    const height = floating.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let placement = position;
    let coords = coordsFor(placement, ref, width, height);
    if (mainOverflow(placement, coords, width, height, vw, vh) > 0) {
      const fallback = OPPOSITE[placement];
      const fallbackCoords = coordsFor(fallback, ref, width, height);
      if (mainOverflow(fallback, fallbackCoords, width, height, vw, vh) < mainOverflow(placement, coords, width, height, vw, vh)) {
        placement = fallback;
        coords = fallbackCoords;
      }
    }
    if (placement === 'top' || placement === 'bottom') {
      coords.x = Math.min(Math.max(coords.x, 0), Math.max(vw - width, 0));
    } else {
      coords.y = Math.min(Math.max(coords.y, 0), Math.max(vh - height, 0));
    }

    const dpr = window.devicePixelRatio || 1;
    const round = (v) => Math.round(v * dpr) / dpr;
    const x = round(coords.x - box.left - parent.clientLeft + parent.scrollLeft);
    const y = round(coords.y - box.top - parent.clientTop + parent.scrollTop);
    setFloatingStyle({
      position: 'absolute',
      left: 0,
      top: 0,
      transform: `translate(${x}px, ${y}px)`,
      ...(dpr >= 1.5 && { willChange: 'transform' })
    });
  }, [position]);

  // Position before paint, keep it attached while open (Floating UI's autoUpdate).
  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updatePosition) : null;
    if (observer) {
      if (triggerRef.current) observer.observe(triggerRef.current);
      if (menuRef.current) observer.observe(menuRef.current);
    }
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', updatePosition, true);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  // useDismiss: Escape, or a pointerdown outside the trigger and the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onKeydown = (e) => {
      if (e.key === 'Escape') close();
    };
    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (root && !root.contains(e.target)) close();
    };
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  // FloatingFocusManager: focus the first focusable element in the menu on the
  // next frame after it opens.
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;
      (menu.querySelector(TABBABLE) || menu).focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // ...and return focus to the trigger when it closes, unless the user has already
  // moved focus somewhere else. A layout effect restores it in the same task as
  // the unmount, so the next keypress cannot land on <body>.
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const active = document.activeElement;
    const root = rootRef.current;
    if (!active || active === document.body || (root && root.contains(active))) {
      triggerRef.current?.focus();
    }
  }, [open]);

  const tabbables = () => Array.from(menuRef.current ? menuRef.current.querySelectorAll(TABBABLE) : []);
  const focusFirst = () => (tabbables()[0] || menuRef.current)?.focus();
  const focusLast = () => {
    const items = tabbables();
    (items[items.length - 1] || menuRef.current)?.focus();
  };

  // useClick keyboard handlers for a non-button reference element.
  const onTriggerKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      spaceDown.current = true;
    }
    if (e.key === 'Enter') toggle();
  };
  const onTriggerKeyUp = (e) => {
    if (e.key === ' ' && spaceDown.current) {
      spaceDown.current = false;
      toggle();
    }
  };

  const onItemClick = (item) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
    if (item.action) item.action();
  };

  return (
    <div ref={rootRef} className={`popupmenu mx-name-${name}${className ? ' ' + className : ''}`}>
      <div
        {...triggerProps}
        ref={triggerRef}
        className="popupmenu-trigger"
        data-state={open ? 'open' : 'closed'}
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="dialog"
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onKeyDown={onTriggerKeyDown}
        onKeyUp={onTriggerKeyUp}
      >
        {trigger}
      </div>

      {open && (
        <>
          <span data-type="inside" tabIndex={0} aria-hidden="true" data-floating-ui-focus-guard="" style={GUARD_STYLE} onFocus={focusLast} />
          <div className="widget-popupmenu-root">
            <ul
              ref={menuRef}
              className="popupmenu-menu"
              id={menuId}
              role="dialog"
              tabIndex={-1}
              data-floating-ui-focusable=""
              style={floatingStyle}
            >
              {customItems.map((item, i) => (
                <li key={item.key ?? i} className="popupmenu-custom-item" onClick={onItemClick(item)}>
                  {item.content}
                </li>
              ))}
            </ul>
          </div>
          <span data-type="inside" tabIndex={0} aria-hidden="true" data-floating-ui-focus-guard="" style={GUARD_STYLE} onFocus={focusFirst} />
        </>
      )}
    </div>
  );
}
