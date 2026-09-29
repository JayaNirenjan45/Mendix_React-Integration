import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * A Mendix pop-up page, in the DOM the client builds for one.
 *
 * `show page … ` mounts the page on <body> rather than inside the page that
 * opened it, which is why every pop-up rule in atom-service-gs.scss is written
 * at top level and scoped on the pop-up page's own Class - `request-popups`,
 * `testing` - instead of on `.gs-service-page`. The portal below does the same.
 *
 *   <div class="mx-underlay" style="opacity: .5">
 *   <div class="modal-dialog mx-window <pageClass>">
 *     <div class="modal-content mx-window-content">
 *       <div class="modal-header mx-window-header">
 *         <h4 class="caption">Title</h4>
 *         <button class="close">×</button>
 *       <div class="modal-body mx-window-body">…the page…
 *
 * The underlay's opacity is the 0.5 the client animates to; the stylesheet's
 * own comment explains that the dim is carried in the colour rather than pinned
 * here, so that value has to be the client's.
 */
export default function MxWindow({ pageClass, title, onClose, children, role = 'dialog' }) {
  /* Mendix takes the page's scrollbar while a modal window is up. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && onClose) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <>
      <div className="mx-underlay" style={{ opacity: 0.5 }} onClick={onClose} />
      <div
        className={['modal-dialog', 'mx-window', pageClass].filter(Boolean).join(' ')}
        role={role}
        aria-modal="true"
      >
        <div className="modal-content mx-window-content">
          <div className="modal-header mx-window-header">
            <h4 className="caption">{title}</h4>
            <button type="button" className="close" aria-label="Close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="modal-body mx-window-body">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}
