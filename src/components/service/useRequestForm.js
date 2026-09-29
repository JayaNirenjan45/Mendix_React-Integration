import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createComment,
  deleteAttachment as apiDeleteAttachment,
  deleteComment as apiDeleteComment,
  deleteRequest,
  openRequest,
  saveRequestDraft,
  submitRequest
} from '../../services/serviceRequestsApi.js';
import { SessionExpiredError, logout } from '../../services/mendixAuth.js';
import { nextRequestId, requestsList, slaDate } from '../../data/serviceData.js';

/**
 * The plumbing every request page shares: the request object itself, the
 * comment and attachment lists the snippet edits, the draft flag the header
 * chip and the Delete button read, and which pop-up is on screen.
 *
 * Mendix does all of this through microflows on one persistent object - the nav
 * microflow creates it, ACT_Save writes a draft, VAL_ then ACT_Send submits,
 * `delete_object` removes it - so the calls below follow those rather than
 * inventing their own shape. Each one goes to Mendix when its endpoint exists
 * and falls back to local state when it does not, which is what lets the pages
 * work today and go live per endpoint later.
 *
 * `type` is the key in serviceData.requestsList: digitalCard | drivers | food |
 * absence - the same key the published Submit and Draft operations are indexed
 * by in mendixConfig, so it is passed straight through.
 */

export default function useRequestForm(type) {
  const seed = requestsList[type];

  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [isDraft, setIsDraft] = useState(false);

  /** The request as Mendix opened it: id, title, SLA deadline. */
  const [request, setRequest] = useState(() => ({
    requestId: nextRequestId(),
    requestTitle: seed.RequestTitle,
    prefix: seed.prefix,
    sla: seed.SLA,
    estimatedDeadline: slaDate(seed.SLA),
    live: false
  }));

  /** null | {kind: 'success'|'confirm'|'delete'|'message', …} */
  const [popup, setPopup] = useState(null);

  const nextId = useRef(1);
  const id = () => `row-${nextId.current++}`;

  /* A dead session ends the app's session rather than degrading to demo data. */
  const guard = useCallback((error) => {
    if (error instanceof SessionExpiredError) logout();
    else if (import.meta.env.DEV) console.warn('[service-pages]', error);
  }, []);

  /*
   * Opening the page is what creates the object in Mendix, so it happens once
   * on mount. Until POST /requests/{type} is published this answers the seeded
   * values and nothing changes on screen.
   */
  useEffect(() => {
    let cancelled = false;

    openRequest(type)
      .then(({ data, live }) => {
        if (cancelled || !live) return;
        setRequest({
          requestId: data.requestId,
          requestTitle: data.requestTitle ?? seed.RequestTitle,
          prefix: seed.prefix,
          sla: data.sla ?? seed.SLA,
          estimatedDeadline: (data.estimatedDeadline ?? '').slice(0, 10) || slaDate(seed.SLA),
          live: true
        });
        if (data.isDraftRecord) setIsDraft(true);
      })
      .catch(guard);

    return () => {
      cancelled = true;
    };
  }, [type, seed.RequestTitle, seed.SLA, guard]);

  /* Main.ACT_CreateComment - a new empty row, edited in place in the list. */
  const addComment = useCallback(() => {
    setComments((list) => [...list, { id: id(), Comment: '' }]);
  }, []);

  const changeComment = useCallback((rowId, text) => {
    setComments((list) => list.map((row) => (row.id === rowId ? { ...row, Comment: text } : row)));
  }, []);

  /* The row is written on blur, mirroring the textbox's OnChange = save_changes. */
  const commitComment = useCallback(
    (rowId, text) => {
      if (!text.trim()) return;
      createComment(request.requestId, text).catch(guard);
    },
    [request.requestId, guard]
  );

  const deleteComment = useCallback(
    (rowId) => {
      setComments((list) => list.filter((row) => row.id !== rowId));
      apiDeleteComment(request.requestId, rowId).catch(guard);
    },
    [request.requestId, guard]
  );

  const addAttachment = useCallback((file) => {
    setAttachments((list) => [...list, { id: id(), Name: file.Name, type: file.type }]);
  }, []);

  const deleteAttachment = useCallback(
    (rowId) => {
      setAttachments((list) => list.filter((row) => row.id !== rowId));
      apiDeleteAttachment(request.requestId, rowId).catch(guard);
    },
    [request.requestId, guard]
  );

  const closePopup = useCallback(() => setPopup(null), []);

  /**
   * ACT_Save* - writes the draft, flips the header chip and reveals Delete.
   * `after` is what the page does next: a message bar on Drivers and Catering,
   * a save pop-up on Digital Card and Absence.
   */
  const saveDraft = useCallback(
    async (fields, after) => {
      let result;

      try {
        result = await saveRequestDraft(type, fields, comments);
      } catch (error) {
        guard(error);
        return;
      }

      /* Nothing was saved, so the chip must not flip and Delete must not appear. */
      if (!result.ok) {
        setPopup({ kind: 'message', type: 'danger', text: result.message });
        return;
      }

      setIsDraft(true);
      after(result.referenceNo);
    },
    [type, comments, guard]
  );

  /**
   * VAL_* / ACT_Send* - submits.
   *
   * `localErrors` is what the page's own required-field pass found; if it is
   * non-empty the call is never made, exactly as the Mendix validator returns
   * before sending.
   *
   * A submit Mendix did not accept - or that never reached it - is reported as
   * a failure carrying the service's own message, never as a success with an
   * invented reference number.
   *
   * Resolves to `{ ok, errors, referenceNo }`.
   */
  const submit = useCallback(
    async (fields, localErrors) => {
      if (localErrors && Object.keys(localErrors).length > 0) {
        return { ok: false, errors: localErrors, referenceNo: null };
      }

      let result;

      try {
        result = await submitRequest(type, fields, comments);
      } catch (error) {
        guard(error);
        return { ok: false, errors: null, referenceNo: null };
      }

      if (!result.ok) {
        setPopup({ kind: 'message', type: 'danger', text: result.message });
        return { ok: false, errors: null, referenceNo: null };
      }

      return { ok: true, errors: null, referenceNo: result.referenceNo };
    },
    [type, comments, guard]
  );

  const remove = useCallback(() => {
    deleteRequest(type, request.requestId).catch(guard);
  }, [type, request.requestId, guard]);

  return {
    request,
    comments,
    attachments,
    isDraft,
    setIsDraft,
    popup,
    setPopup,
    closePopup,
    addComment,
    changeComment,
    commitComment,
    deleteComment,
    addAttachment,
    deleteAttachment,
    saveDraft,
    submit,
    remove
  };
}

/**
 * The client's own required-field check. Mendix runs it inside the VAL_/ACT_
 * microflow behind Submit and answers with `validation feedback … message
 * 'This field is required.'` against each empty attribute, which the client
 * renders as `.has-error` on the group plus an `.alert.mx-validation-message`
 * under the control.
 *
 * `rules` is [attribute, value, message] and the result is keyed by attribute,
 * which is what the pages spread onto their fields as `error`.
 */
export function validate(rules) {
  const errors = {};

  rules.forEach(([field, value, message = 'This field is required.']) => {
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (empty) errors[field] = message;
  });

  return errors;
}
