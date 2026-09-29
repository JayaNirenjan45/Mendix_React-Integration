import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import MxWindow from './MxWindow.jsx';
import { MxButton } from '../MxWidgets.jsx';
import { MxContainer, MxDataView, MxLayoutGrid, MxRow, MxColumn, MxText } from '../MxForm.jsx';
import { attachmentTypes } from '../../data/serviceData.js';

/**
 * The pop-ups the four request pages open, each built from the Mendix page it
 * stands for. They all mount on <body>, which is what the stylesheet expects -
 * every rule for them is written at top level, scoped on the pop-up page's own
 * Class rather than on .gs-service-page.
 */

/* ------------------------------------------------------- success pop-ups */

/**
 * Main.RequestSuccessPopup and EmployeeSelfServices.SavePopup. Identical
 * pages - layout Bahri_UI_Design.Employee_RequestPopUp_Half, page class
 * `request-popups` - differing only in their sentence and how the reference
 * number is composed, so they are one component with those two as props.
 *
 *   Submit  -> 'Your request has been successfully submitted.' + ReferenceNo
 *   Absence -> 'Request has been successfully saved.'          + 'ABS-<RequsetID>'
 */
export function RequestSuccessPopup({ message, referenceNo, onClose }) {
  return (
    <MxWindow pageClass="request-popups" title="Request Success Popup" onClose={onClose}>
      <MxLayoutGrid name="layoutGrid2" className="p-0 overflow-hidden">
        <MxRow>
          <MxColumn>
            <MxButton
              name="actionButton4"
              className="popuup-close_btn pull-right"
              icon="remove"
              page="p.Main.RequestSuccessPopup"
              onClick={onClose}
            />
            <MxContainer name="container9" className="request-pop-container">
              <MxDataView name="dataView7" className="p-0 save-popup spacing-outer-bottom-large">
                <MxContainer name="container16" className="save-popup">
                  <MxContainer name="container17" className="spacing-outer-bottom-medium">
                    <MxText name="text5" renderMode="h3" className="savepopup-text text-bold text-center d-block">
                      {message}
                    </MxText>
                  </MxContainer>
                  <MxContainer name="container18" className="reference-card spacing-outer-top-large">
                    <MxText name="text6" className="reference-text text-bold">
                      Reference No
                    </MxText>
                    <MxText name="text7" className="text-bold">
                      {referenceNo}
                    </MxText>
                  </MxContainer>
                </MxContainer>
              </MxDataView>
            </MxContainer>
          </MxColumn>
        </MxRow>
      </MxLayoutGrid>
    </MxWindow>
  );
}

/* --------------------------------------------------- confirmation pop-ups */

/**
 * DigitalCard.DigitalCard_ConfirmationPopUp - a page on Atlas_Core.PopupLayout,
 * so its body and footer carry .mx-dialog-body / .mx-dialog-footer, which is
 * exactly what the stylesheet's `:has(.mx-dialog-footer)` match picks out.
 */
export function ConfirmationPopup({ title = 'Confirmation', question, okCaption = 'Ok', onOk, onClose }) {
  return (
    <MxWindow pageClass="" title={title} onClose={onClose}>
      <div className="mx-name-container2 modal-body mx-dialog-body">
        <p className="mx-text mx-name-text1">{question}</p>
      </div>
      <div className="mx-name-container1 modal-footer mx-dialog-footer">
        <MxButton
          name="actionButton1"
          caption={okCaption}
          style="primary"
          page="p.DigitalCard.DigitalCard_ConfirmationPopUp"
          onClick={onOk}
        />
        <MxButton
          name="actionButton2"
          caption="Cancel"
          page="p.DigitalCard.DigitalCard_ConfirmationPopUp"
          onClick={onClose}
        />
      </div>
    </MxWindow>
  );
}

/**
 * The client's own mx.ui.confirmation - the prompt a Delete button raises
 * before `delete_object`. It is not a page, so its root is `.mx-dialog` with
 * `.mx-dialog-header` / `-body` / `-footer`, which the stylesheet styles
 * alongside the page-based prompts above.
 */
export function MxConfirmation({ caption = 'Confirmation', content, onProceed, onCancel }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return createPortal(
    <>
      <div className="mx-underlay" style={{ opacity: 0.5 }} onClick={onCancel} />
      <div className="modal-dialog mx-dialog" role="dialog" aria-modal="true">
        <div className="mx-dialog-content">
          <div className="mx-dialog-header">
            <span className="mx-dialog-caption">{caption}</span>
            <button type="button" className="mx-dialog-close" aria-label="Close" onClick={onCancel}>
              &times;
            </button>
          </div>
          <div className="mx-dialog-body">
            <p>{content}</p>
          </div>
          <div className="mx-dialog-footer">
            <button type="button" className="btn btn-primary" onClick={onProceed}>
              OK
            </button>
            <button type="button" className="btn btn-default" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ------------------------------------------------------ attachment pop-up */

/**
 * Main.FileAttachmentsPage - page class `testing`, layout
 * Bahri_UI_Design.Employee_CyberPopUp_Half. The page repeats its own title and
 * close button inside the body; both are reproduced and both are hidden by the
 * stylesheet, which keeps the window header's pair as the only ones on screen.
 *
 * The FileManager is the widget's compound control: a read-only input naming
 * the chosen file beside a Browse button, which the stylesheet turns into the
 * dashed dropzone.
 */
export function FileAttachmentsPage({ onSave, onClose }) {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(attachmentTypes[0]);
  const [touched, setTouched] = useState(false);
  const inputRef = React.useRef(null);

  const missing = touched && !file;

  function save() {
    setTouched(true);
    if (!file) return;
    onSave({ Name: file.name, type });
  }

  return (
    <MxWindow pageClass="testing" title="Attachments" onClose={onClose}>
      <MxLayoutGrid name="layoutGrid2" className="cybersecurity-popup-container">
        <MxRow>
          <MxColumn>
            <MxButton
              name="actionButton4"
              className="popuup-close_btn pull-right"
              icon="remove"
              page="p.Main.FileAttachmentsPage"
              onClick={onClose}
            />
            <MxContainer name="container10" className="cybersecurity-popup-inner">
              <MxContainer name="container8" className="pageheader spacing-outer-bottom-large spacing-outer-top-large">
                <MxContainer name="container14" className="d-flex align-items-center common-mini_header spacing-outer-bottom-medium">
                  <h1 className="mx-title mx-name-pageTitle2">Attachments</h1>
                </MxContainer>
              </MxContainer>

              <MxContainer name="container9" className="popup-inputs cybersecurity-video-modal">
                <MxDataView name="dataView6">
                  <MxContainer name="container11">
                    <div className="mx-filemanager mx-name-fileManager2">
                      <label className="control-label">Attachment</label>
                      <div className="mx-compound-control">
                        <input
                          className="form-control"
                          type="text"
                          readOnly
                          value={file ? file.name : ''}
                          placeholder="No file chosen"
                          onClick={() => inputRef.current && inputRef.current.click()}
                        />
                        <button
                          type="button"
                          className="btn mx-button mx-fileinput-upload-button"
                          onClick={() => inputRef.current && inputRef.current.click()}
                        >
                          Browse
                        </button>
                        <input
                          ref={inputRef}
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(event) => {
                            const chosen = event.target.files && event.target.files[0];
                            if (chosen) setFile(chosen);
                          }}
                        />
                      </div>
                    </div>

                    {missing && (
                      <MxContainer name="container13" className="validation-error">
                        <MxText name="text2">This field is required.</MxText>
                      </MxContainer>
                    )}
                  </MxContainer>
                </MxDataView>
              </MxContainer>

              <MxContainer name="container7" className="d-flex justify-content-end spacing-outer-top-medium spacing-outer-bottom-medium">
                <MxButton
                  name="actionButton6"
                  caption="Save"
                  style="primary"
                  className=" send_cancel-btn   send-btn popup-button-size"
                  page="p.Main.FileAttachmentsPage"
                  onClick={save}
                />
                <MxButton
                  name="actionButton8"
                  caption="Cancel"
                  className="send_cancel-btn cancel-btn popup-button-size"
                  page="p.Main.FileAttachmentsPage"
                  onClick={onClose}
                />
              </MxContainer>
            </MxContainer>
          </MxColumn>
        </MxRow>
      </MxLayoutGrid>
    </MxWindow>
  );
}

/* --------------------------------------------------------------- messages */

/**
 * `show message … type Information` - the client's message bar, which Drivers'
 * Save as Draft ends on instead of a pop-up. Atlas styles this; nothing in the
 * service stylesheet touches it.
 */
export function MxMessage({ text, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div className="mx-messages">
      <div className={`alert alert-${type} mx-message`} role="alert">
        <span>{text}</span>
        <button type="button" className="close" aria-label="Close" onClick={onClose}>
          &times;
        </button>
      </div>
    </div>,
    document.body
  );
}
