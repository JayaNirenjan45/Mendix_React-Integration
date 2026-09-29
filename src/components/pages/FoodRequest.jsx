import React, { useMemo, useState } from 'react';
import {
  MxContainer,
  MxDataView,
  MxLayoutGrid,
  MxRow,
  MxColumn,
  MxTextBox,
  MxTextArea,
  MxRadioButtons,
  MxComboBox,
  MxReferenceSelector,
  BOOLEAN_OPTIONS
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
 * CorporateAdmin.FoodRequest
 *   Title  'Employee Services'
 *   Layout Main.NewLayout
 *   Class  'gs-service-page gs-svc-food'
 *   Params $FoodRequest, $RequestsList
 *
 * Same two-form shape as Drivers: container4 hidden on phone, container6 hidden
 * on tablet and desktop. Its action bar is split across two containers
 * (Submit / Cancel / Delete in one, Save as Draft in the other), which is why
 * the stylesheet gives `.gs-svc-actions > div` `display: contents` and orders
 * the buttons itself.
 */
export default function FoodRequest() {
  const { openScreen, finishRequest } = useScreen();
  const form = useRequestForm('food');

  /* Food request types and office locations come from Mendix once GET
     /food-types and GET /offices exist; until then these are the seeded lists. */
  const { me, offices, foodTypes } = useServiceData();
  const currentEmployee = me.data;
  const officeLocations = offices.data;
  const foodRequestTypes = foodTypes.data;

  const [onbehalf, setOnbehalf] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentEmployee.Email);
  const [foodRequestType, setFoodRequestType] = useState('');
  const [foodType, setFoodType] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [guests, setGuests] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const request = form.request;
  const identityLocked = employeeId.trim() !== '';

  const typeOptions = useMemo(
    () => foodRequestTypes.map((type) => ({ value: type.id, caption: type.FoodRequestType })),
    [foodRequestTypes]
  );

  const rules = useMemo(
    () => [
      ['Email', email],
      ['FoodRequestType', foodRequestType],
      ['FoodType', foodType],
      ['City', officeLocation],
      ['Number_of_Guests', guests],
      ['RequestDate', requestDate],
      ['Budget', budget],
      ['Description', description]
    ],
    [email, foodRequestType, foodType, officeLocation, guests, requestDate, budget, description]
  );

  /** The attribute names ACT_SendFoodRequest writes, as the entity spells them. */
  const fields = {
    Onbehalf: onbehalf,
    EmployeeID: employeeId,
    Name: name,
    Email: email,
    FoodRequest_FoodRequestType: foodRequestType,
    FoodType: foodType,
    City: officeLocation,
    Number_of_Guests: guests,
    RequestDate: requestDate,
    Budget: budget,
    Description: description
  };

  /* ACT_SendFoodRequest -> Main.RequestSuccessPopup */
  async function submit() {
    const local = validate(rules);
    if (onbehalf && !name.trim()) local.Name = 'This field is required.';

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

  /* ACT_SaveFoodRequest ends on `show message … type Information`. */
  function saveDraft() {
    form.saveDraft(fields, () =>
      form.setPopup({ kind: 'message', text: 'Your request is successfully saved!' })
    );
  }

  function cancel() {
    openScreen('home');
  }

  function remove() {
    form.setPopup({ kind: 'delete' });
  }

  const snippet = (
    <RequestCommentsAndAttachments
      comments={form.comments}
      attachments={form.attachments}
      onAddComment={form.addComment}
      onChangeComment={form.changeComment}
      onDeleteComment={form.deleteComment}
      onAddAttachment={form.addAttachment}
      onDeleteAttachment={form.deleteAttachment}
    />
  );

  return (
    <MxLayoutGrid name="layoutGrid1" className="padding-top-zero ">
      <MxRow>
        <MxColumn>
          <MxContainer
            name="container2"
            className="employees-layout spacing-outer-bottom-large spacing-inner-top spacing-inner-left-medium"
          >
            <MxContainer
              name="container1"
              className="font-bold spacing-inner-left-medium spacing-inner-right-medium"
            >
              <MxDataView name="dataView2">
                <MxDataView name="dataView3">
                  <ServiceHeader
                    names={{
                      head: 'container42',
                      inner: 'container43',
                      title: 'text44',
                      sub: 'gsSubFood',
                      circle: 'container34',
                      chip: 'gsChipFood',
                      chipText: 'gsChipTextFood',
                      chipDraft: 'gsChipDraftFood',
                      chipDraftText: 'gsChipDraftTextFood'
                    }}
                    title={request.requestTitle}
                    subtitle="Order food and refreshments for a meeting or event"
                    icon="Main$gs_image$four.svg"
                    isDraft={form.isDraft}
                  />
                </MxDataView>
              </MxDataView>

              <MxContainer
                name="container32"
                className="pageheader d-none spacing-outer-bottom-small spacing-outer-top-small"
              >
                <MxContainer
                  name="container33"
                  className="d-flex align-items-center common-mini_header spacing-outer-bottom-small"
                >
                  <h2 className="mx-text mx-name-text42 font-bold">Catering Request</h2>
                </MxContainer>
              </MxContainer>

              {/* ------------------------------------- container4: tablet + desktop */}
              <MxContainer name="container4" className="form-container gs-svc-form hide-phone">
                <MxDataView name="dataView5" className="commercial-box">
                  <MxContainer name="container3" className="forminput-scroll gs-svc-body">
                    <MxContainer name="gsSectFdRequester" className="gs-svc-sect gs-svc-sect-user">
                      <span className="mx-text mx-name-gsSectFdRequesterTitle gs-svc-sect-title">
                        Requester
                      </span>
                    </MxContainer>

                    <MxContainer name="container9" className="items-row">
                      <MxRadioButtons
                        name="radioButtons1"
                        label="Onbehalf of Employee"
                        className="common-form_group form-radio-btn"
                        options={BOOLEAN_OPTIONS}
                        value={onbehalf}
                        onChange={(next) => {
                          /* ACT_OnBehalfFoodRequest */
                          setOnbehalf(next);
                          setEmployeeId('');
                          setName('');
                          setEmail(next ? '' : currentEmployee.Email);
                        }}
                      />
                    </MxContainer>

                    <MxContainer name="container7" className="commersial-box gs-svc-fields">
                      {onbehalf && (
                        <MxContainer name="container10" className="items-row hide-phone">
                          <MxTextBox
                            name="textBox6"
                            label="Employee ID"
                            className="common-form_group"
                            placeholder="Enter employee id here"
                            value={employeeId}
                            onChange={setEmployeeId}
                          />
                        </MxContainer>
                      )}
                      {onbehalf && (
                        <MxContainer name="container13" className="items-row hide-phone">
                          <MxTextBox
                            name="textBox7"
                            label="Name"
                            className="common-form_group   required-form-group"
                            placeholder="Enter name here"
                            value={name}
                            onChange={setName}
                            readOnly={identityLocked}
                            error={errors.Name}
                          />
                        </MxContainer>
                      )}

                      <MxContainer name="container14" className="items-row">
                        <MxTextBox
                          name="textBox8"
                          label="Email"
                          className="common-form_group   required-form-group"
                          placeholder="Enter email here"
                          value={email}
                          onChange={setEmail}
                          readOnly={identityLocked}
                          error={errors.Email}
                        />
                      </MxContainer>

                      <MxContainer name="gsSectFdOrder" className="gs-svc-sect gs-svc-sect-food">
                        <span className="mx-text mx-name-gsSectFdOrderTitle gs-svc-sect-title">
                          Order details
                        </span>
                      </MxContainer>

                      <MxContainer name="container20" className="common-select items-row   required-form-group">
                        <MxComboBox
                          name="comboBox1"
                          label="Food Request Type"
                          options={typeOptions}
                          value={foodRequestType}
                          onChange={setFoodRequestType}
                          error={errors.FoodRequestType}
                        />
                      </MxContainer>

                      <MxContainer name="container12" className=" common-select items-row  common-form_group">
                        <MxTextBox
                          name="textBox2"
                          label="Food Type"
                          className="required-form-group"
                          placeholder="Enter food type here"
                          value={foodType}
                          onChange={setFoodType}
                          error={errors.FoodType}
                        />
                      </MxContainer>

                      <MxContainer name="container37" className="common-select items-row   required-form-group">
                        <MxReferenceSelector
                          name="referenceSelector3"
                          label="Office Location"
                          options={officeLocations}
                          value={officeLocation}
                          onChange={setOfficeLocation}
                          error={errors.City}
                        />
                      </MxContainer>

                      <MxContainer name="container17" className="items-row">
                        <MxTextBox
                          name="textBox4"
                          label="Number of Guests"
                          className="common-form_group required-form-group"
                          placeholder="Enter number of guests here"
                          value={guests}
                          onChange={setGuests}
                          error={errors.Number_of_Guests}
                        />
                      </MxContainer>

                      <MxContainer name="container5" className="items-row calender-container">
                        <MxDateTimePicker
                          name="reactDateTimePicker1"
                          label="Request Date"
                          className="common-form_group common-calender required-form-group"
                          picker="datepicker"
                          value={requestDate}
                          onChange={setRequestDate}
                          error={errors.RequestDate}
                        />
                      </MxContainer>

                      <MxContainer name="container18" className="items-row">
                        <MxTextBox
                          name="textBox1"
                          label="Budget (in SAR)"
                          className="common-form_group required-form-group"
                          placeholder="Enter budget here"
                          value={budget}
                          onChange={setBudget}
                          error={errors.Budget}
                        />
                      </MxContainer>

                      <MxContainer name="gsSectFdNotes" className="gs-svc-sect gs-svc-sect-note">
                        <span className="mx-text mx-name-gsSectFdNotesTitle gs-svc-sect-title">Notes</span>
                      </MxContainer>

                      <MxContainer name="container19" className="items-row gs-svc-field-wide">
                        <MxTextArea
                          name="textArea1"
                          label="Brief Description"
                          className="common-form_group required-form-group"
                          value={description}
                          onChange={setDescription}
                          error={errors.Description}
                        />
                      </MxContainer>
                    </MxContainer>

                    <MxContainer name="container8">{snippet}</MxContainer>
                  </MxContainer>

                  <MxContainer
                    name="container16"
                    className="request-pages-buttons gs-svc-actions spacing-outer-top-large"
                  >
                    <MxContainer name="container24">
                      <MxButton
                        name="actionButton1"
                        caption="Submit"
                        style="success"
                        className="send_cancel-btn send-btn gs-svc-btn-submit spacing-outer-top-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={submit}
                      />
                      <MxButton
                        name="actionButton2"
                        caption="Cancel"
                        className="send_cancel-btn cancel-btn gs-svc-btn-cancel spacing-outer-left-medium spacing-outer-top-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={cancel}
                      />
                      {form.isDraft && (
                        <MxButton
                          name="actionButton9"
                          caption="Delete"
                          className="send_cancel-btn cancel-btn gs-svc-btn-delete spacing-outer-top-medium spacing-outer-left-medium"
                          page="p.CorporateAdmin.FoodRequest"
                          onClick={remove}
                        />
                      )}
                    </MxContainer>
                    <MxContainer name="container26">
                      <MxButton
                        name="actionButton6"
                        caption="Save as Draft"
                        className="send_cancel-btn save-draf-button gs-svc-btn-draft spacing-outer-top-medium spacing-outer-left-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={saveDraft}
                      />
                    </MxContainer>
                  </MxContainer>
                </MxDataView>
              </MxContainer>

              {/* -------------------------------------------- container6: phone */}
              <MxContainer name="container6" className="form-container gs-svc-form hide-tablet hide-desktop">
                <MxDataView name="dataView6" className="commercial-box spacing-outer-bottom-large">
                  <MxContainer name="container21" className="commersial-box gs-svc-fields">
                    <MxContainer
                      name="container23"
                      className="common-select items-row   required-form-group common-form_group"
                    >
                      <MxComboBox
                        name="comboBox2"
                        label="Food Request Type"
                        options={typeOptions}
                        value={foodRequestType}
                        onChange={setFoodRequestType}
                      />
                    </MxContainer>
                    <MxContainer name="container25" className=" common-select items-row  common-form_group">
                      <MxTextBox
                        name="textBox3"
                        label="Food Type"
                        className="required-form-group"
                        placeholder="Enter food type here"
                        value={foodType}
                        onChange={setFoodType}
                      />
                    </MxContainer>
                    <MxContainer name="container38" className="common-select items-row   required-form-group">
                      <MxReferenceSelector
                        name="referenceSelector4"
                        label="Office Location"
                        options={officeLocations}
                        value={officeLocation}
                        onChange={setOfficeLocation}
                      />
                    </MxContainer>
                    <MxContainer name="container28" className="items-row">
                      <MxTextBox
                        name="textBox5"
                        label="Number of Guests"
                        className="common-form_group required-form-group"
                        placeholder="Enter number of guests here"
                        value={guests}
                        onChange={setGuests}
                      />
                    </MxContainer>
                    <MxContainer name="container27" className="items-row calender-container">
                      <MxDateTimePicker
                        name="reactDateTimePicker2"
                        label="Request Date"
                        className="common-form_group common-calender required-form-group"
                        picker="datepicker"
                        value={requestDate}
                        onChange={setRequestDate}
                      />
                    </MxContainer>
                    <MxContainer name="container29" className="items-row">
                      <MxTextBox
                        name="textBox12"
                        label="Budget"
                        className="common-form_group required-form-group"
                        placeholder="Enter budget here"
                        value={budget}
                        onChange={setBudget}
                      />
                    </MxContainer>
                    <MxContainer name="container30" className="items-row gs-svc-field-wide">
                      <MxTextArea
                        name="textArea2"
                        label="Brief Description"
                        className="common-form_group required-form-group"
                        value={description}
                        onChange={setDescription}
                      />
                    </MxContainer>
                  </MxContainer>

                  {snippet}

                  <MxContainer
                    name="container31"
                    className="request-pages-buttons gs-svc-actions spacing-outer-top-large"
                  >
                    <MxContainer name="container39">
                      <MxButton
                        name="actionButton4"
                        caption="Submit"
                        style="success"
                        className="send_cancel-btn send-btn gs-svc-btn-submit spacing-outer-top-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={submit}
                      />
                      <MxButton
                        name="actionButton5"
                        caption="Cancel"
                        className="send_cancel-btn cancel-btn gs-svc-btn-cancel spacing-outer-left-medium spacing-outer-top-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={cancel}
                      />
                    </MxContainer>
                    <MxContainer name="container40">
                      <MxButton
                        name="actionButton7"
                        caption="Save as Draft"
                        className="send_cancel-btn save-draf-button gs-svc-btn-draft spacing-outer-top-medium spacing-outer-left-medium"
                        page="p.CorporateAdmin.FoodRequest"
                        onClick={saveDraft}
                      />
                    </MxContainer>
                  </MxContainer>
                </MxDataView>
              </MxContainer>
            </MxContainer>
          </MxContainer>
        </MxColumn>
      </MxRow>

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
