import React, { useMemo, useState } from 'react';
import {
  MxContainer,
  MxDataView,
  MxLayoutGrid,
  MxRow,
  MxColumn,
  MxTextBox,
  MxTextArea,
  MxRadiobuttonList,
  MxReferenceSelector
} from '../MxForm.jsx';
import { MxButton } from '../MxWidgets.jsx';
import { MxDateTimePicker } from '../widgets/MxPickers.jsx';
import ServiceHeader from '../service/ServiceHeader.jsx';
import RequestCommentsAndAttachments from '../service/RequestCommentsAndAttachments.jsx';
import { MxConfirmation, MxMessage } from '../service/ServicePopups.jsx';
import useRequestForm, { validate } from '../service/useRequestForm.js';
import { useServiceData } from '../../data/ServiceDataProvider.jsx';
import { useScreen } from '../../nav/ScreenContext.jsx';

/**
 * CorporateAdmin.DriverRequest
 *   Title  'Employee Services'
 *   Layout Main.NewLayout
 *   Class  'gs-service-page gs-svc-car'   (set on the layout root by the router)
 *   Params $DriversRequest, $RequestsList
 *
 * The page carries TWO complete forms: container4, hidden on phone, and
 * container21, hidden on tablet and desktop, whose fields run in a different
 * order. Both are in the DOM at every width in Mendix - the Atlas `hide-phone`
 * / `hide-tablet hide-desktop` classes decide which one is seen - so both are
 * here too, over one piece of state, which is what the shared Mendix object
 * gives them.
 *
 * There is no Onbehalf choice on this page: the radio buttons and the Employee
 * ID / Name rows they revealed were taken off it, so `Onbehalf` is always
 * false. Driver Type is the single-value `dynamicEnumPicker` radio list; the
 * plain radio buttons that offered Business and Personal are gone.
 */
export default function DriverRequest() {
  const { openScreen, finishRequest } = useScreen();
  const form = useRequestForm('drivers');

  /* Office locations come from Mendix once GET /offices exists; until then the
     provider hands back the seeded list. `me` prefills the requester's email. */
  const { me, offices } = useServiceData();
  const currentEmployee = me.data;
  const officeLocations = offices.data;

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentEmployee.Email);
  const [driverType, setDriverType] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const request = form.request;

  /* Editable: [$currentObject/EmployeeID = empty] on Name and Email. */
  const identityLocked = employeeId.trim() !== '';
  /* Editable: [$currentObject/RequestDate != empty] on both time fields. */
  const timesLocked = requestDate === '';

  const rules = useMemo(
    () => [
      ['DriverType', driverType],
      ['City', officeLocation],
      ['RequestDate', requestDate],
      ['FromTime', fromTime],
      ['ToTime', toTime],
      ['Description', description]
    ],
    [driverType, officeLocation, requestDate, fromTime, toTime, description]
  );

  /** The attribute names ACT_SendDriversRequest writes, as the entity spells them. */
  const fields = {
    Onbehalf: false,
    EmployeeID: employeeId,
    Name: name,
    Email: email,
    DriverType: driverType,
    City: officeLocation,
    RequestDate: requestDate,
    FromTime: fromTime,
    ToTime: toTime,
    Description: description
  };

  /* ACT_SendDriversRequest: validate, then Main.RequestSuccessPopup. */
  async function submit() {
    const local = validate(rules);
    const result = await form.submit(fields, local);

    setErrors(result.errors ?? {});
    if (!result.ok) return;

    /* ACT_Send* ends on `show page Main.RequestSuccessPopup` + `close page`:
       the form goes, the dashboard comes back, the pop-up stays on top. */
    finishRequest({
      message: 'Your request has been successfully submitted.',
      referenceNo: result.referenceNo
    });
  }

  /* ACT_SaveDrivesRequest ends on `show message … type Information`. */
  function saveDraft() {
    form.saveDraft(fields, () =>
      form.setPopup({ kind: 'message', text: 'Your request is successfully saved!' })
    );
  }

  /* `Action: cancel_changes close_page` - back to where the nav item came from. */
  function cancel() {
    openScreen('home');
  }

  /* `Action: delete_object close_page` - the client prompts first. */
  function remove() {
    form.setPopup({ kind: 'delete' });
  }

  /* ------------------------------------------------------- field fragments */

  /** container9 / container23 - the wrapped field flow, in each form's order. */
  function desktopFields() {
    return (
      <MxContainer name="container9" className="commersial-box gs-svc-fields">
        <MxContainer name="container15" className="items-row">
          <MxTextBox
            name="textBox4"
            label="Email"
            className="common-form_group"
            placeholder="Enter email here"
            value={email}
            onChange={setEmail}
            readOnly={identityLocked}
          />
        </MxContainer>

        <MxContainer name="container38" className="items-row">
          <MxRadiobuttonList
            name="dynamicEnumPicker1"
            label="Driver Type"
            className="required-form-group"
            direction="horizontal"
            options={[{ value: 'Business', caption: 'Business' }]}
            value={driverType}
            onChange={setDriverType}
            error={errors.DriverType}
          />
        </MxContainer>

        <MxContainer name="gsSectDrTrip" className="gs-svc-sect gs-svc-sect-pin">
          <span className="mx-text mx-name-gsSectDrTripTitle gs-svc-sect-title">Trip details</span>
        </MxContainer>

        <MxContainer name="container42" className="common-select items-row   required-form-group">
          <MxReferenceSelector
            name="referenceSelector3"
            label="Office Location"
            options={officeLocations}
            value={officeLocation}
            onChange={setOfficeLocation}
            error={errors.City}
          />
        </MxContainer>

        <MxContainer name="container20" className="items-row calender-container">
          <MxDateTimePicker
            name="reactDateTimePicker1"
            label="Request Date"
            className="required-form-group common-calender"
            picker="datepicker"
            disablePast
            value={requestDate}
            onChange={(next) => {
              setRequestDate(next);
              /* OCH_ClearTimes */
              setFromTime('');
              setToTime('');
            }}
            error={errors.RequestDate}
          />
        </MxContainer>

        <MxContainer name="container6" className="calender-container items-row">
          <MxDateTimePicker
            name="reactDateTimePicker3"
            label="From Time"
            className="required-form-group common-calender"
            picker="timepicker"
            value={fromTime}
            onChange={setFromTime}
            readOnly={timesLocked}
            error={errors.FromTime}
          />
        </MxContainer>

        <MxContainer name="container5" className="calender-container items-row">
          <MxDateTimePicker
            name="reactDateTimePicker4"
            label="To Time"
            className="required-form-group common-calender"
            picker="timepicker"
            value={toTime}
            onChange={setToTime}
            readOnly={timesLocked}
            error={errors.ToTime}
          />
        </MxContainer>

        <MxContainer name="gsSectDrNotes" className="gs-svc-sect gs-svc-sect-note">
          <span className="mx-text mx-name-gsSectDrNotesTitle gs-svc-sect-title">Notes</span>
        </MxContainer>

        <MxContainer name="container17" className="w-50 gs-svc-field-wide">
          <MxTextArea
            name="textArea1"
            label="Description"
            className="common-form_group required-form-group"
            value={description}
            onChange={setDescription}
            error={errors.Description}
          />
        </MxContainer>
      </MxContainer>
    );
  }

  return (
    <MxLayoutGrid name="layoutGrid1" className="padding-top-zero ">
      <MxRow>
        <MxColumn>
          <MxContainer
            name="container12"
            className="employees-layout spacing-outer-bottom-large spacing-inner-top spacing-inner-left-medium"
          >
            <MxContainer
              name="container1"
              className="font-bold spacing-inner-left-medium spacing-inner-right-medium"
            >
              {/* dataView2 (DS_CheckCurrentTheme) > dataView3 ($RequestsList) */}
              <MxDataView name="dataView2">
                <MxDataView name="dataView3">
                  <ServiceHeader
                    names={{
                      head: 'container46',
                      inner: 'container47',
                      title: 'text44',
                      sub: 'gsSubDriver',
                      circle: 'container48',
                      chip: 'gsChipDriver',
                      chipText: 'gsChipTextDriver',
                      chipDraft: 'gsChipDraftDriver',
                      chipDraftText: 'gsChipDraftTextDriver'
                    }}
                    title={request.requestTitle}
                    subtitle="Book a company driver for a business trip"
                    icon="Main$gs_image$three.svg"
                    isDraft={form.isDraft}
                  />
                </MxDataView>
              </MxDataView>

              {/* container33 - a second head the page keeps but never shows */}
              <MxContainer
                name="container33"
                className="pageheader d-none spacing-outer-bottom-small spacing-outer-top-small"
              >
                <MxContainer
                  name="container34"
                  className="d-flex align-items-center common-mini_header spacing-outer-bottom-small"
                >
                  <h2 className="mx-text mx-name-text42 font-bold">Drivers Request</h2>
                </MxContainer>
              </MxContainer>

              {/* ------------------------------------- container4: tablet + desktop */}
              <MxContainer name="container4" className="form-container gs-svc-form hide-phone">
                <MxDataView name="dataView5">
                  <MxContainer name="container3" className="forminput-scroll gs-svc-body">
                    <MxContainer name="gsSectDrRequester" className="gs-svc-sect gs-svc-sect-user">
                      <span className="mx-text mx-name-gsSectDrRequesterTitle gs-svc-sect-title">
                        Requester
                      </span>
                    </MxContainer>

                    <MxContainer name="container8" className="items-row" />

                    {desktopFields()}

                    <MxContainer name="container13">
                      <RequestCommentsAndAttachments
                        comments={form.comments}
                        attachments={form.attachments}
                        onAddComment={form.addComment}
                        onChangeComment={form.changeComment}
                        onDeleteComment={form.deleteComment}
                        onAddAttachment={form.addAttachment}
                        onDeleteAttachment={form.deleteAttachment}
                      />
                    </MxContainer>
                  </MxContainer>

                  <MxContainer
                    name="container16"
                    className="request-pages-buttons gs-svc-actions spacing-outer-top-large"
                  >
                    <MxContainer name="container7">
                      <MxButton
                        name="actionButton1"
                        caption="Submit"
                        style="success"
                        className="send_cancel-btn send-btn gs-svc-btn-submit spacing-outer-top-medium"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={submit}
                      />
                      <MxButton
                        name="actionButton2"
                        caption="Cancel"
                        className="send_cancel-btn cancel-btn gs-svc-btn-cancel spacing-outer-left-medium spacing-outer-top-medium"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={cancel}
                      />
                      <MxButton
                        name="actionButton7"
                        caption="Save as Draft"
                        className="send_cancel-btn save-draf-button gs-svc-btn-draft spacing-outer-top-medium spacing-outer-left-medium"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={saveDraft}
                      />
                      {form.isDraft && (
                        <MxButton
                          name="actionButton9"
                          caption="Delete"
                          className="send_cancel-btn cancel-btn gs-svc-btn-delete spacing-outer-top-medium spacing-outer-left-medium"
                          page="p.CorporateAdmin.DriverRequest"
                          onClick={remove}
                        />
                      )}
                    </MxContainer>
                    <MxContainer name="container25" />
                  </MxContainer>
                </MxDataView>
              </MxContainer>

              {/* ------------------------------------------- container21: phone */}
              <MxContainer name="container21" className="form-container gs-svc-form hide-tablet hide-desktop">
                <MxDataView name="dataView6" className="spacing-outer-bottom-large">
                  <MxContainer name="container23" className="commersial-box gs-svc-fields">
                    <MxContainer name="container24" className="items-row">
                      <MxTextBox
                        name="textBox6"
                        label="Employee ID"
                        className="common-form_group"
                        placeholder="Enter employee id here"
                        value={employeeId}
                        onChange={setEmployeeId}
                      />
                    </MxContainer>
                    <MxContainer name="container39" className="items-row">
                      <MxRadiobuttonList
                        name="dynamicEnumPicker2"
                        label="Driver Type"
                        direction="horizontal"
                        options={[{ value: 'Business', caption: 'Business' }]}
                        value={driverType}
                        onChange={setDriverType}
                      />
                    </MxContainer>
                    <MxContainer name="container43" className="common-select items-row   required-form-group">
                      <MxReferenceSelector
                        name="referenceSelector4"
                        label="Office Location"
                        options={officeLocations}
                        value={officeLocation}
                        onChange={setOfficeLocation}
                      />
                    </MxContainer>
                    <MxContainer name="container26" className="items-row">
                      <MxTextBox
                        name="textBox8"
                        label="Name"
                        className="common-form_group"
                        placeholder="Enter name here"
                        value={name}
                        onChange={setName}
                        readOnly={identityLocked}
                      />
                    </MxContainer>
                    <MxContainer name="container27" className="items-row calender-container">
                      <MxDateTimePicker
                        name="reactDateTimePicker2"
                        label="Request Date"
                        className="required-form-group common-calender"
                        picker="datepicker"
                        value={requestDate}
                        onChange={setRequestDate}
                      />
                    </MxContainer>
                    <MxContainer name="container28" className="items-row">
                      <MxTextBox
                        name="textBox9"
                        label="Email"
                        className="common-form_group"
                        placeholder="Enter email here"
                        value={email}
                        onChange={setEmail}
                        readOnly={identityLocked}
                      />
                    </MxContainer>
                    <MxContainer name="container29" className="calender-container items-row">
                      <MxDateTimePicker
                        name="reactDateTimePicker5"
                        label="From Time"
                        className="required-form-group common-calender"
                        picker="timepicker"
                        value={fromTime}
                        onChange={setFromTime}
                        readOnly={timesLocked}
                      />
                    </MxContainer>
                    <MxContainer name="container30" className="calender-container items-row">
                      <MxDateTimePicker
                        name="reactDateTimePicker6"
                        label="To Time"
                        className="required-form-group common-calender"
                        picker="timepicker"
                        value={toTime}
                        onChange={setToTime}
                        readOnly={timesLocked}
                      />
                    </MxContainer>
                    <MxContainer name="container31" className="w-50 gs-svc-field-wide">
                      <MxTextArea
                        name="textArea2"
                        label="Description"
                        className="common-form_group required-form-group"
                        value={description}
                        onChange={setDescription}
                      />
                    </MxContainer>
                  </MxContainer>

                  <RequestCommentsAndAttachments
                    comments={form.comments}
                    attachments={form.attachments}
                    onAddComment={form.addComment}
                    onChangeComment={form.changeComment}
                    onDeleteComment={form.deleteComment}
                    onAddAttachment={form.addAttachment}
                    onDeleteAttachment={form.deleteAttachment}
                  />

                  <MxContainer
                    name="container32"
                    className="request-pages-buttons gs-svc-actions spacing-outer-top-large"
                  >
                    <MxContainer name="container44">
                      <MxButton
                        name="actionButton4"
                        caption="Submit"
                        style="success"
                        className="send_cancel-btn send-btn gs-svc-btn-submit spacing-outer-top-medium"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={submit}
                      />
                      <MxButton
                        name="actionButton6"
                        caption="Save as Draft"
                        className="send_cancel-btn save-draf-button gs-svc-btn-draft"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={saveDraft}
                      />
                      <MxButton
                        name="actionButton5"
                        caption="Cancel"
                        className="send_cancel-btn cancel-btn gs-svc-btn-cancel spacing-outer-left-medium spacing-outer-top-medium"
                        page="p.CorporateAdmin.DriverRequest"
                        onClick={cancel}
                      />
                    </MxContainer>
                    <MxContainer name="container45" />
                  </MxContainer>
                </MxDataView>
              </MxContainer>
            </MxContainer>
          </MxContainer>
        </MxColumn>
      </MxRow>

      {/* ------------------------------------------------------------ pop-ups */}
      {form.popup && form.popup.kind === 'message' && (
        <MxMessage text={form.popup.text} type={form.popup.type} onClose={form.closePopup} />
      )}
      {form.popup && form.popup.kind === 'delete' && (
        <MxConfirmation
          content="Are you sure you want to delete this?"
          onProceed={() => {
            form.remove();
            form.closePopup();
            openScreen('home');
          }}
          onCancel={form.closePopup}
        />
      )}
    </MxLayoutGrid>
  );
}
