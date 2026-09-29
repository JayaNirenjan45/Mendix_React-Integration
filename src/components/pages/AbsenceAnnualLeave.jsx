import React, { useMemo, useState } from 'react';
import {
  MxContainer,
  MxDataView,
  MxLayoutGrid,
  MxRow,
  MxColumn,
  MxText,
  MxTextBox,
  MxTextArea,
  MxComboBox
} from '../MxForm.jsx';
import { MxButton } from '../MxWidgets.jsx';
import { MxDateRangePicker } from '../widgets/MxPickers.jsx';
import ServiceHeader from '../service/ServiceHeader.jsx';
import AbsenceReqDetails from '../service/AbsenceReqDetails.jsx';
import { RequestSuccessPopup, MxConfirmation, MxMessage } from '../service/ServicePopups.jsx';
import useRequestForm, { validate } from '../service/useRequestForm.js';
import { useServiceData } from '../../data/ServiceDataProvider.jsx';
import { useScreen } from '../../nav/ScreenContext.jsx';

/**
 * EmployeeSelfServices.Absence_AnnualLeave
 *   Title  'Employee Services'
 *   Layout Main.NewLayout
 *   Class  'thenew-grey gs-service-page gs-svc-calendar'
 *   Params $AbsenceRequest, $RequestsList
 *
 * The only one of the four with a second column: layoutGrid5 puts the form in
 * col1 and SNIP_AbsenceReqDetails in col2. The stylesheet splits that row
 * 1.55 / 0.95 in flex and collapses it to one column under 1080px, matching the
 * reference - which is why the row is a real layout grid here rather than two
 * divs.
 *
 * Duration is DS_AbsenceTypeTotalDuration, which runs on every change of the
 * range; the same inclusive day count is computed here.
 */
export default function AbsenceAnnualLeave() {
  const { openScreen, finishRequest } = useScreen();
  const form = useRequestForm('absence');

  /* Replaced-by comes from DS_ReplacedByValues once GET /replaced-by exists;
     `me` supplies the join date the before-hire-date banner compares against. */
  const { me, replacedBy: replacedBySet } = useServiceData();
  const currentEmployee = me.data;
  const replacedByOptions = replacedBySet.data;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comments, setComments] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [replacedBy, setReplacedBy] = useState('');
  const [errors, setErrors] = useState({});

  const request = form.request;

  /* DS_AbsenceTypeTotalDuration - inclusive day count across the range. */
  const totalDuration = useMemo(() => {
    if (!startDate || !endDate) return '';
    const from = new Date(startDate);
    const to = new Date(endDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return '';
    return String(Math.round((to - from) / 86400000) + 1);
  }, [startDate, endDate]);

  /*
   * IsStartDateAfterHireDate / IsEndDateAfterHireDate. Both default to true and
   * the banner appears only once a date falls before the employee's join date.
   */
  const hireDate = currentEmployee.JoinDate;
  const beforeHire =
    (startDate !== '' && startDate < hireDate) || (endDate !== '' && endDate < hireDate);

  /* text1 prints '0' until both ends of the range and a duration exist. */
  const durationText = startDate && endDate && totalDuration ? totalDuration : '0';

  /*
   * submitabsence / absencedraft take the replacement as a pair - the person
   * number it is keyed by, and the name to show - so the chosen option supplies
   * both. `Comments` is the reason text here, not a list of comment rows: the
   * absence operations are the only two shaped that way.
   */
  const replacedByOption = replacedByOptions.find((option) => option.id === replacedBy);

  const fields = {
    RequestId: request.live ? String(request.requestId) : '',
    Email: currentEmployee.Email ?? '',
    StartDate: startDate,
    EndDate: endDate,
    TotalDuration: totalDuration,
    FirstSecondHalf: '',
    Comments: comments,
    EmergencyContactNumber: emergencyContact,
    ReplacedByPersonNumber: replacedByOption ? replacedByOption.personNumber : '',
    ReplacedBy: replacedByOption ? replacedByOption.caption : ''
  };

  async function submit() {
    const local = validate([
      ['StartDate', startDate],
      ['EndDate', endDate],
      ['EmergencyContactNumber', emergencyContact],
      ['ReplacedBy', replacedBy]
    ]);

    if (beforeHire) {
      local.StartDate = "Error: You can't record an absence before hire date.";
    }

    /* ACT_Create_AbsenceRequest_New ends on Main.RequestSuccessPopup. */
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

  /* ACT_SaveAbsenceRequest -> EmployeeSelfServices.SavePopup */
  function saveDraft() {
    form.saveDraft(fields, (referenceNo) =>
      form.setPopup({
        kind: 'success',
        message: 'Request has been successfully saved.',
        referenceNo: referenceNo ?? `${request.prefix}-${request.requestId}`
      })
    );
  }

  function cancel() {
    openScreen('home');
  }

  function remove() {
    form.setPopup({ kind: 'delete' });
  }

  return (
    <MxLayoutGrid name="layoutGrid1" className="g-lay">
      <MxRow>
        <MxColumn>
          <MxContainer
            name="container3"
            className=" employees-layout spacing-outer-bottom-large spacing-inner-top spacing-inner-left-medium"
          >
            <MxContainer name="container15">
              <MxDataView name="dataView2">
                <MxDataView name="dataView3">
                  <ServiceHeader
                    names={{
                      head: 'container34',
                      inner: 'container26',
                      title: 'text43',
                      sub: 'gsSubAbsence',
                      circle: 'container35',
                      chip: 'gsChipAbsence',
                      chipText: 'gsChipTextAbsence',
                      chipDraft: 'gsChipDraftAbsence',
                      chipDraftText: 'gsChipDraftTextAbsence'
                    }}
                    title={`Absence Request - ${request.requestTitle}`}
                    subtitle="Annual leave"
                    icon="Main$gs_image$five.svg"
                    isDraft={form.isDraft}
                  />
                </MxDataView>
              </MxDataView>

              <MxLayoutGrid name="layoutGrid5">
                <MxRow>
                  {/* ------------------------------------------------ the form */}
                  <MxColumn lg={8}>
                    <MxContainer
                      name="container17"
                      className="form-container gs-svc-form spacing-outer-bottom-large"
                    >
                      <MxDataView name="dataView5">
                        <MxContainer name="container2" className="requesttype gs-svc-body">
                          <MxContainer name="gsSectAbPeriod" className="gs-svc-sect gs-svc-sect-calendar">
                            <span className="mx-text mx-name-gsSectAbPeriodTitle gs-svc-sect-title">
                              Leave period
                            </span>
                          </MxContainer>

                          <MxLayoutGrid name="layoutGrid2">
                            <MxRow>
                              <MxColumn lg={8}>
                                <MxContainer name="container5" className="tt-cont-w">
                                  {/* A plain container carrying form-group: the label
                                      is a dynamic text with control-label, not the
                                      widget's own. */}
                                  <MxContainer
                                    name="container4"
                                    className="form-group required-form-group"
                                  >
                                    <MxText name="text2" className="control-label required-form-group">
                                      Start to End Date
                                    </MxText>
                                    <MxDateRangePicker
                                      name="antdDateRangePicker1"
                                      className="common-calender"
                                      start={startDate}
                                      end={endDate}
                                      onChange={(from, to) => {
                                        setStartDate(from);
                                        setEndDate(to);
                                      }}
                                    />
                                  </MxContainer>

                                  {beforeHire && (
                                    <MxContainer name="container6" className="wtt-c">
                                      <MxText name="text8" className="x-c">
                                        X
                                      </MxText>
                                      <MxText name="text5">
                                        Error: You can&#39;t record an absence before hire date.
                                      </MxText>
                                      <MxContainer name="container7" className="ktch" />
                                    </MxContainer>
                                  )}
                                </MxContainer>
                              </MxColumn>

                              <MxColumn>
                                <MxContainer name="container21" className="org-anslabel">
                                  <MxText name="text7">Duration</MxText>
                                  <MxContainer name="container1">
                                    <MxText name="text1">{durationText}</MxText>
                                    <MxText name="text3">Days</MxText>
                                  </MxContainer>
                                </MxContainer>
                              </MxColumn>
                            </MxRow>
                          </MxLayoutGrid>

                          <MxContainer name="gsSectAbReason" className="gs-svc-sect gs-svc-sect-note">
                            <span className="mx-text mx-name-gsSectAbReasonTitle gs-svc-sect-title">
                              Reason
                            </span>
                          </MxContainer>

                          <MxContainer
                            name="container18"
                            className="d-flex  sm-form-comment common-form_group-widthfull"
                          >
                            <MxTextArea
                              name="textArea2"
                              label="Comments"
                              className="common-form_group"
                              style={{ width: '100%' }}
                              value={comments}
                              onChange={setComments}
                            />
                          </MxContainer>

                          <MxContainer name="container46">
                            <MxContainer
                              name="container47"
                              className="gs-svc-sect gs-svc-sect-info spacing-outer-top-medium spacing-outer-bottom-medium"
                            >
                              <span className="mx-text mx-name-gsSectAbInfoTitle gs-svc-sect-title">
                                Additional information
                              </span>
                            </MxContainer>

                            <MxLayoutGrid name="layoutGrid3">
                              <MxRow>
                                <MxColumn>
                                  <MxTextBox
                                    name="textBox5"
                                    label="Emergency contact number"
                                    className="required-form-group common-form_group mob-web"
                                    placeholder="Please add mobile number start with 0"
                                    value={emergencyContact}
                                    onChange={setEmergencyContact}
                                    error={errors.EmergencyContactNumber}
                                  />
                                </MxColumn>
                                <MxColumn>
                                  <MxComboBox
                                    name="comboBox6"
                                    label="Replaced by"
                                    className="required-form-group"
                                    options={replacedByOptions.map((option) => ({
                                      value: option.id,
                                      caption: option.caption
                                    }))}
                                    value={replacedBy}
                                    onChange={setReplacedBy}
                                    error={errors.ReplacedBy}
                                  />
                                </MxColumn>
                              </MxRow>
                            </MxLayoutGrid>
                          </MxContainer>
                        </MxContainer>

                        <MxContainer name="container50" className="brd-btn gs-svc-actions">
                          <MxButton
                            name="actionButton2"
                            caption="Submit"
                            className="send_cancel-btn send-btn send gs-svc-btn-submit spacing-outer-left spacing-outer-right"
                            page="p.EmployeeSelfServices.Absence_AnnualLeave"
                            onClick={submit}
                          />
                          <MxButton
                            name="actionButton3"
                            caption="Cancel"
                            className="send_cancel-btn save-draf-button gs-svc-btn-cancel spacing-outer-left spacing-outer-right"
                            page="p.EmployeeSelfServices.Absence_AnnualLeave"
                            onClick={cancel}
                          />
                          <MxButton
                            name="actionButton1"
                            caption="Save as Draft"
                            className="send_cancel-btn cancel-btn gs-svc-btn-draft spacing-outer-left"
                            page="p.EmployeeSelfServices.Absence_AnnualLeave"
                            onClick={saveDraft}
                          />
                          {form.isDraft && (
                            <MxButton
                              name="actionButton9"
                              caption="Delete"
                              className="send_cancel-btn cancel-btn gs-svc-btn-delete spacing-outer-left-medium"
                              page="p.EmployeeSelfServices.Absence_AnnualLeave"
                              onClick={remove}
                            />
                          )}
                        </MxContainer>
                      </MxDataView>
                    </MxContainer>
                  </MxColumn>

                  {/* -------------------------------- SNIP_AbsenceReqDetails */}
                  <MxColumn lg={4}>
                    <AbsenceReqDetails
                      startDate={startDate}
                      endDate={endDate}
                      totalDuration={totalDuration}
                    />
                  </MxColumn>
                </MxRow>
              </MxLayoutGrid>
            </MxContainer>
          </MxContainer>
        </MxColumn>
      </MxRow>

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
