import React, { useState } from 'react';
import {
  MxContainer,
  MxDataView,
  MxLayoutGrid,
  MxRow,
  MxColumn,
  MxText,
  MxTextBox,
  MxRadioButtons,
  BOOLEAN_OPTIONS
} from '../MxForm.jsx';
import { MxButton } from '../MxWidgets.jsx';
import { MxDateTimePicker, MxPhoneInput } from '../widgets/MxPickers.jsx';
import ServiceHeader from '../service/ServiceHeader.jsx';
import RequestCommentsAndAttachments from '../service/RequestCommentsAndAttachments.jsx';
import {
  RequestSuccessPopup,
  ConfirmationPopup,
  MxConfirmation,
  MxMessage
} from '../service/ServicePopups.jsx';
import useRequestForm, { validate } from '../service/useRequestForm.js';
import { slaDate } from '../../data/serviceData.js';
import { useServiceData } from '../../data/ServiceDataProvider.jsx';
import { useScreen } from '../../nav/ScreenContext.jsx';

/**
 * DigitalCard.DigitalCardRequest
 *   Title  'Employee Services'
 *   Layout Main.NewLayout
 *   Class  'gs-service-page gs-svc-idcard'
 *   Params $DigitalCardRequest, $RequestsList
 *
 * One form, not two: this page has no phone-only duplicate. Almost every field
 * is `Editable: Never` - they are filled from the signed-in employee's record.
 * The page carries no Onbehalf choice: the radio buttons and the Choose-Employee
 * combo box were taken off it, so `Onbehalf` is always false here.
 *
 * Submit runs VAL_DigitalCardRequest, which checks each field in turn with
 * `validation feedback … message 'This field is required.'` and only then opens
 * DigitalCard_ConfirmationPopUp; Ok on that runs ACT_SendDigitalCardRequest.
 * Both steps are reproduced, with the validator's own messages.
 */
export default function DigitalCardRequest() {
  const { openScreen, finishRequest } = useScreen();
  const form = useRequestForm('digitalCard');

  /* The signed-in employee comes from Mendix once GET /me exists; until then
     it is the seeded value. */
  const { me } = useServiceData();
  const currentEmployee = me.data;

  const [isPhysicalCard, setIsPhysicalCard] = useState(false);
  const [person, setPerson] = useState(currentEmployee);
  const [mobileNo, setMobileNo] = useState(currentEmployee.MobileNo);
  const [telephoneNo, setTelephoneNo] = useState(currentEmployee.TelephoneNo);
  /* OCH_DigitalCardEstimatedDate seeds the deadline at today + the request's
     SLA; `form.request` carries that SLA, live or seeded. */
  const [estimatedDeadline, setEstimatedDeadline] = useState(() => slaDate(form.request.sla));
  const [errors, setErrors] = useState({});

  const request = form.request;

  /*
   * Visible: [toLowerCase(EmpCountry) != 'usa' and != 'india'] on both Arabic
   * fields - the record's country decides whether they are on the page at all.
   */
  const country = (person.EmpCountry || '').toLowerCase();
  const showArabic = country !== 'usa' && country !== 'india';

  /* OCH_CheckMobileNo: the widget reports length, the page shows the hint. */
  const validMobile = mobileNo.replace(/\D/g, '').length <= 20;
  const validTelephone = telephoneNo.replace(/\D/g, '').length > 0;

  /* VAL_DigitalCardRequest, in the order the microflow checks them. */
  function submit() {
    const rules = [
      ['NameinEnglish', person.NameinEnglish],
      ...(showArabic ? [['NameInArabic', person.NameInArabic]] : []),
      ...(showArabic ? [['PostionArabic', person.PostionArabic]] : []),
      ['Email', person.Email],
      ['JoinDate', person.JoinDate],
      ['PositionTitle', person.PositionTitle],
      ['Location', person.Location, 'Location field is required.'],
      ['Department', person.Department, 'Department field is required.'],
      ['ExtentionNo', person.ExtentionNo],
      ['EstimatedDeadline', estimatedDeadline, 'Please select valid date!'],
      ['TelephoneNo', telephoneNo]
    ];

    const found = validate(rules);

    if (mobileNo.replace(/\D/g, '').length > 20) {
      found.MobileNo = 'Length of mobile no should be less than 20!';
    } else if (mobileNo && !validMobile) {
      found.MobileNo = 'Please enter valid mobile number!';
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    form.setPopup({ kind: 'confirm' });
  }

  /** The attribute names ACT_SendDigitalCardRequest writes. */
  const fields = {
    Onbehalf: false,
    IsPhysicalCard: isPhysicalCard,
    NameinEnglish: person.NameinEnglish,
    NameInArabic: person.NameInArabic,
    Email: person.Email,
    PositionTitle: person.PositionTitle,
    PostionArabic: person.PostionArabic,
    Department: person.Department,
    Location: person.Location,
    ExtentionNo: person.ExtentionNo,
    MobileNo: mobileNo,
    TelephoneNo: telephoneNo,
    JoinDate: person.JoinDate,
    EstimatedDeadline: estimatedDeadline
  };

  /* ACT_SendDigitalCardRequest, reached from Ok on the confirmation. */
  async function send() {
    const result = await form.submit(fields, null);
    if (!result.ok) {
      setErrors(result.errors ?? {});
      form.closePopup();
      return;
    }

    /* ACT_Send* ends on `show page Main.RequestSuccessPopup` + `close page`:
       the form goes, the dashboard comes back, the pop-up stays on top. */
    finishRequest({
      message: 'Your request has been successfully submitted.',
      referenceNo: result.referenceNo
    });
  }

  /* ACT_SaveDigitalCard -> DigitalCard.SavePopup */
  function saveDraft() {
    form.saveDraft(fields, (referenceNo) =>
      form.setPopup({
        kind: 'success',
        message: 'Request has been successfully saved.',
        referenceNo: referenceNo ?? `${request.prefix}-${request.requestId}`
      })
    );
  }

  /* ACT_ClosePage_ShowEmployeeSelfService */
  function cancel() {
    openScreen('home');
  }

  function remove() {
    form.setPopup({ kind: 'delete' });
  }

  return (
    <MxLayoutGrid name="layoutGrid2" className="padding-top-zero ">
      <MxRow>
        <MxColumn>
          <MxContainer
            name="container3"
            className=" employees-layout b-control spacing-outer-bottom-large spacing-inner-top spacing-inner-left-medium"
          >
            <MxContainer name="container15">
              <MxDataView name="dataView1">
                <ServiceHeader
                  names={{
                    head: 'container33',
                    inner: 'container25',
                    title: 'text42',
                    sub: 'gsSubDigitalCard',
                    circle: 'container32',
                    chip: 'gsChipDigitalCard',
                    chipText: 'gsChipTextDigitalCard',
                    chipDraft: 'gsChipDraftDigitalCard',
                    chipDraftText: 'gsChipDraftTextDigitalCard'
                  }}
                  title={request.requestTitle}
                  subtitle="Request a digital or printed employee identification card"
                  icon="Main$gs_image$two.svg"
                  isDraft={form.isDraft}
                />
              </MxDataView>

              <MxContainer
                name="container1"
                className="pageheader d-none spacing-outer-bottom-small spacing-outer-top-small"
              >
                <MxContainer
                  name="container14"
                  className="d-flex align-items-center common-mini_header spacing-outer-bottom-small"
                >
                  <h2 className="mx-text mx-name-text41 font-bold">Digital Card Request</h2>
                </MxContainer>
              </MxContainer>

              <MxContainer
                name="container17"
                className="form-container gs-svc-form spacing-outer-bottom-large"
              >
                <MxDataView name="dataView5">
                  <MxContainer name="container2" className="forminput-scroll gs-svc-body">
                    <MxContainer name="container16" className="commersial-box gs-svc-fields">

                      <MxContainer name="gsSectDcRequest" className="gs-svc-sect gs-svc-sect-user">
                        <span className="mx-text mx-name-gsSectDcRequestTitle gs-svc-sect-title">
                          Request type
                        </span>
                      </MxContainer>

                      <MxContainer name="gsSectDcCard" className="gs-svc-sect gs-svc-sect-idcard">
                        <span className="mx-text mx-name-gsSectDcCardTitle gs-svc-sect-title">Card type</span>
                      </MxContainer>

                      <MxContainer name="container18" className="items-row">
                        <MxRadioButtons
                          name="radioButtons2"
                          label="For Physical card?"
                          className="common-form_group form-radio-btn"
                          options={BOOLEAN_OPTIONS}
                          value={isPhysicalCard}
                          onChange={setIsPhysicalCard}
                        />
                      </MxContainer>

                      <MxContainer name="gsSectDcEmployee" className="gs-svc-sect gs-svc-sect-user">
                        <span className="mx-text mx-name-gsSectDcEmployeeTitle gs-svc-sect-title">
                          Employee details
                        </span>
                      </MxContainer>

                      <MxContainer name="container11" className="items-row">
                        <MxTextBox
                          name="textBox5"
                          label="Name in English"
                          className="common-form_group  required-form-group"
                          placeholder="Enter name here"
                          value={person.NameinEnglish}
                          readOnly
                          error={errors.NameinEnglish}
                        />
                      </MxContainer>

                      {showArabic && (
                        <MxContainer name="container23" className="items-row">
                          <MxTextBox
                            name="textBox10"
                            label="Name in Arabic"
                            className="common-form_group  required-form-group arabic-input-field"
                            placeholder="Enter name here"
                            value={person.NameInArabic}
                            readOnly
                            error={errors.NameInArabic}
                          />
                        </MxContainer>
                      )}

                      <MxContainer name="container19" className="items-row">
                        <MxTextBox
                          name="textBox6"
                          label="Email"
                          className="common-form_group required-form-group"
                          placeholder="Enter email here"
                          value={person.Email}
                          readOnly
                          error={errors.Email}
                        />
                      </MxContainer>

                      <MxContainer name="container22" className="items-row">
                        <MxTextBox
                          name="textBox9"
                          label="Position in English"
                          className="common-form_group required-form-group"
                          placeholder="Enter Position Title here"
                          value={person.PositionTitle}
                          readOnly
                          error={errors.PositionTitle}
                        />
                      </MxContainer>

                      {showArabic && (
                        <MxContainer name="container28" className="items-row">
                          <MxTextBox
                            name="textBox13"
                            label="Position in Arabic"
                            className="common-form_group required-form-group"
                            placeholder="Enter Position Title here"
                            value={person.PostionArabic}
                            readOnly
                            error={errors.PostionArabic}
                          />
                        </MxContainer>
                      )}

                      <MxContainer name="container26" className="items-row">
                        <MxTextBox
                          name="textBox11"
                          label="Extension Number"
                          className="common-form_group  required-form-group arabic-input-field"
                          placeholder="Enter Extension Number here"
                          value={person.ExtentionNo}
                          readOnly
                          error={errors.ExtentionNo}
                        />
                      </MxContainer>

                      <MxContainer name="container27" className="items-row">
                        <MxPhoneInput
                          name="educonnexPhone1"
                          label="Mobile No"
                          className="common-form_group  arabic-input-field"
                          value={mobileNo}
                          onChange={setMobileNo}
                          enableSearch
                          error={errors.MobileNo}
                        />
                        {!validMobile && mobileNo.trim() !== '' && (
                          <MxText name="text1" className="val-x">
                            Enter Valid Mobile Number !
                          </MxText>
                        )}
                      </MxContainer>

                      <MxContainer name="container29" className="items-row">
                        <MxPhoneInput
                          name="educonnexPhone2"
                          label="Telephone No"
                          className="common-form_group  required-form-group arabic-input-field"
                          value={telephoneNo}
                          onChange={setTelephoneNo}
                          error={errors.TelephoneNo}
                        />
                        {!validTelephone && (
                          <MxText name="text2" className="val-x">
                            Enter Valid Telephone Number !
                          </MxText>
                        )}
                      </MxContainer>

                      <MxContainer name="container30" className="items-row">
                        <MxTextBox
                          name="textBox15"
                          label="Location"
                          className="common-form_group  required-form-group arabic-input-field"
                          placeholder="Enter Location Number here"
                          value={person.Location}
                          readOnly
                          error={errors.Location}
                        />
                      </MxContainer>

                      <MxContainer name="container31" className="items-row">
                        <MxTextBox
                          name="textBox16"
                          label="Department"
                          className="common-form_group  required-form-group arabic-input-field"
                          placeholder="Enter Department Number here"
                          value={person.Department}
                          readOnly
                          error={errors.Department}
                        />
                      </MxContainer>

                      <MxContainer name="gsSectDcTimeline" className="gs-svc-sect gs-svc-sect-calendar">
                        <span className="mx-text mx-name-gsSectDcTimelineTitle gs-svc-sect-title">
                          Timeline
                        </span>
                      </MxContainer>

                      <MxContainer name="container6" className="items-row calender-container">
                        <MxDateTimePicker
                          name="reactDateTimePicker1"
                          label="Join Date"
                          className="common-calender common-form_group required-form-group"
                          picker="datepicker"
                          value={person.JoinDate}
                          readOnly
                          error={errors.JoinDate}
                        />
                      </MxContainer>

                      <MxContainer name="container9" className="items-row calender-container">
                        <MxDateTimePicker
                          name="reactDateTimePicker2"
                          label="Estimated Deadline"
                          className="required-form-group common-calender "
                          picker="datepicker"
                          minDate={new Date().toISOString().slice(0, 10)}
                          value={estimatedDeadline}
                          onChange={setEstimatedDeadline}
                          error={errors.EstimatedDeadline}
                        />
                      </MxContainer>
                    </MxContainer>

                    <RequestCommentsAndAttachments
                      variant="digitalCard"
                      comments={form.comments}
                      attachments={form.attachments}
                      onAddComment={form.addComment}
                      onChangeComment={form.changeComment}
                      onDeleteComment={form.deleteComment}
                      onAddAttachment={form.addAttachment}
                      onDeleteAttachment={form.deleteAttachment}
                    />
                  </MxContainer>

                  <MxContainer
                    name="container167"
                    className="request-pages-buttons gs-svc-actions spacing-outer-top-large"
                  >
                    <MxContainer name="container4">
                      {/* Four operational buttons the page hides with an inline style. */}
                      <MxButton
                        name="actionButton4"
                        caption="ACT Assign new workflowview GUID"
                        page="p.DigitalCard.DigitalCardRequest"
                        inlineStyle={{ display: 'none' }}
                      />
                      <MxButton
                        name="actionButton1"
                        caption="ASU Assign notification count"
                        page="p.DigitalCard.DigitalCardRequest"
                        inlineStyle={{ display: 'none' }}
                      />
                      <MxButton
                        name="actionButton2"
                        caption="ACT Create Eligibility Absence"
                        page="p.DigitalCard.DigitalCardRequest"
                        inlineStyle={{ display: 'none' }}
                      />
                      <MxButton
                        name="actionButton3"
                        caption="ACT Delete ICP"
                        page="p.DigitalCard.DigitalCardRequest"
                        inlineStyle={{ display: 'none' }}
                      />

                      <MxButton
                        name="actionButton38"
                        caption="Submit"
                        style="success"
                        className="send_cancel-btn send-btn send gs-svc-btn-submit spacing-outer-top-medium"
                        page="p.DigitalCard.DigitalCardRequest"
                        onClick={submit}
                      />
                      <MxButton
                        name="actionButton39"
                        caption="Cancel"
                        className="send_cancel-btn cancel-btn gs-svc-btn-cancel spacing-outer-left-medium spacing-outer-top-medium"
                        page="p.DigitalCard.DigitalCardRequest"
                        onClick={cancel}
                      />
                      <MxButton
                        name="actionButton40"
                        caption="Save as Draft"
                        className="send_cancel-btn save-draf-button gs-svc-btn-draft spacing-outer-top-medium spacing-outer-left-medium"
                        page="p.DigitalCard.DigitalCardRequest"
                        onClick={saveDraft}
                      />
                      {form.isDraft && (
                        <MxButton
                          name="actionButton9"
                          caption="Delete"
                          className="send_cancel-btn cancel-btn gs-svc-btn-delete spacing-outer-top-medium spacing-outer-left-medium"
                          page="p.DigitalCard.DigitalCardRequest"
                          onClick={remove}
                        />
                      )}
                    </MxContainer>
                    <MxContainer name="container10" />
                  </MxContainer>
                </MxDataView>
              </MxContainer>
            </MxContainer>
          </MxContainer>
        </MxColumn>
      </MxRow>

      {form.popup && form.popup.kind === 'confirm' && (
        <ConfirmationPopup
          question="Are you sure, you want to submit the request?"
          onOk={send}
          onClose={form.closePopup}
        />
      )}
      {form.popup && form.popup.kind === 'success' && (
        <RequestSuccessPopup
          message={form.popup.message}
          referenceNo={form.popup.referenceNo}
          onClose={() => {
            form.closePopup();
            openScreen('home');
          }}
        />
      )}
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
