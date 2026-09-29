import React, { useCallback, useRef } from 'react';
import Datetime from 'react-datetime';
import moment from 'moment';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DatePicker } from 'antd';
import PhoneInput from 'react-phone-input-2';
import { MxFormGroup } from '../MxForm.jsx';

dayjs.extend(customParseFormat);

/**
 * The three pluggable widgets the service pages use, each rendered by the very
 * library the Mendix widget is built on, inside the DOM the widget produces.
 * Using the real libraries is what makes the 110 KB of atom-service-gs.scss
 * land: it is written against `.rdtCounter` / `.rdtCount`, `.ant-picker-*` and
 * `.react-tel-input`, and gs-svc-clock.js reads the counters' text to drive the
 * analog clock face.
 *
 * Their stylesheets are NOT imported here. widgets.css - copied out of the
 * Mendix deployment and loaded by index.html ahead of everything - already
 * carries react-datetime's and react-phone-input-2's CSS, exactly as the Mendix
 * client loads it. antd v5 injects its own styles at runtime, which is why
 * widgets.css has none of them and why nothing needs importing for it either.
 */

const { RangePicker } = DatePicker;

/* ------------------------------------------- itvisors ReactDateTimePicker */

/**
 * The widget renders `.rdt` (react-datetime) and its own trigger button as
 * siblings inside `.reactDateTimePicker.mx-compound-control`, which the
 * stylesheet draws as the single bordered field:
 *
 *   div.form-group.mx-name-<name>.<class>
 *     label.control-label
 *     div.reactDateTimePicker.mx-compound-control
 *       div.rdt > input.form-control [+ div.rdtPicker while open]
 *       button.btn.mx-button > span.glyphicon
 *
 * `picker` is the widget's own property: 'datepicker' shows a calendar,
 * 'timepicker' the counters that gs-svc-clock.js hangs the clock above.
 *
 * Values are held as plain strings in page state - 'YYYY-MM-DD' for a date and
 * 'HH:mm' for a time - so the pages stay serialisable and nothing has to carry
 * a moment around.
 */
export function MxDateTimePicker({
  name,
  label,
  className,
  value,
  onChange,
  picker = 'datepicker',
  disablePast = false,
  minDate,
  readOnly = false,
  error,
  placeholder
}) {
  const isTime = picker === 'timepicker';
  const format = isTime ? 'HH:mm' : 'DD-MM-YYYY';
  const wrapperRef = useRef(null);

  const parsed = value ? moment(value, isTime ? 'HH:mm' : 'YYYY-MM-DD') : '';

  const handleChange = useCallback(
    (next) => {
      if (!onChange) return;
      if (!next || typeof next === 'string') {
        /* react-datetime hands back the raw string while it is unparseable. */
        onChange(next ? next : '');
        return;
      }
      onChange(next.format(isTime ? 'HH:mm' : 'YYYY-MM-DD'));
    },
    [onChange, isTime]
  );

  /*
   * `disablePast` and `minDateAttribute` on the widget become react-datetime's
   * isValidDate, which is asked about each day in the calendar.
   */
  const isValidDate = useCallback(
    (current) => {
      if (isTime) return true;
      if (minDate && current.isBefore(moment(minDate, 'YYYY-MM-DD'), 'day')) return false;
      if (disablePast && current.isBefore(moment().startOf('day'), 'day')) return false;
      return true;
    },
    [isTime, disablePast, minDate]
  );

  /* The widget's trigger opens the picker; react-datetime opens on focus. */
  const openPicker = useCallback(() => {
    const input = wrapperRef.current && wrapperRef.current.querySelector('input');
    if (input && !readOnly) input.focus();
  }, [readOnly]);

  return (
    <MxFormGroup name={name} label={label} className={className} error={error}>
      <div className="reactDateTimePicker mx-compound-control" ref={wrapperRef}>
        <Datetime
          value={parsed}
          onChange={handleChange}
          dateFormat={isTime ? false : format}
          timeFormat={isTime ? format : false}
          closeOnSelect
          isValidDate={isValidDate}
          inputProps={{
            className: 'form-control',
            placeholder: placeholder ?? (isTime ? '--:--' : 'dd-mm-yyyy'),
            readOnly: true,
            disabled: readOnly
          }}
        />
        <button
          type="button"
          className="btn mx-button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={openPicker}
        >
          <span className="glyphicon glyphicon-calendar" />
        </button>
      </div>
    </MxFormGroup>
  );
}

/* -------------------------------------------- mendix AntdDateRangePicker */

/**
 * Absence's "Start to End Date". The page does NOT give this widget a Mendix
 * label - it puts a dynamic text carrying `control-label` above it inside a
 * plain container that carries `form-group` - so this renders only the widget
 * root and the page supplies the rest.
 *
 * antd mounts the calendar on <body>, which is why the stylesheet styles
 * `.ant-picker-dropdown` at top level rather than inside the page scope. That
 * default is left alone here so the two agree.
 */
export function MxDateRangePicker({ name, className, start, end, onChange, format = 'DD/MM/YYYY' }) {
  const value = [
    start ? dayjs(start, 'YYYY-MM-DD') : null,
    end ? dayjs(end, 'YYYY-MM-DD') : null
  ];

  return (
    <div className={['mx-name-' + name, className].filter(Boolean).join(' ')}>
      <RangePicker
        value={value[0] || value[1] ? value : null}
        format={format}
        allowClear
        inputReadOnly
        placeholder={['dd/mm/yyyy - ', 'dd/mm/yyyy']}
        placement="bottomLeft"
        size="middle"
        onChange={(range) =>
          onChange &&
          onChange(
            range && range[0] ? range[0].format('YYYY-MM-DD') : '',
            range && range[1] ? range[1].format('YYYY-MM-DD') : ''
          )
        }
      />
    </div>
  );
}

/* ------------------------------------------------ educonnex EduconnexPhone */

/**
 * react-phone-input-2 inside the widget's own `educ-phone-input` wrapper. The
 * stylesheet pins the flag into a 46px box at the left edge of the field and
 * pads the input clear of it, and restyles the country list the flag opens.
 *
 * `enableSearch` is the widget property of the same name: Digital Card turns it
 * on for the mobile field and off for the telephone one.
 *
 * The widget renders its own caption - it has no Mendix Label system property -
 * as `<label class="educ-phone-input-label control-label col-sm-3">` followed by
 * a `col-sm-9` wrapper round the control, both of which the theme widens to the
 * full column so the caption sits above the field like every other label. That
 * markup is reproduced here; react-phone-input-2's own floating `specialLabel`
 * is switched off, since Mendix never renders it.
 */
export function MxPhoneInput({
  name,
  label,
  className,
  value,
  onChange,
  showLabel = true,
  enableSearch = false,
  disableDropdown = false,
  disabled = false,
  error
}) {
  return (
    <div
      className={['mx-name-' + name, 'form-group', 'educ-phone-input', className, error && 'has-error']
        .filter(Boolean)
        .join(' ')}
    >
      <label
        className="educ-phone-input-label control-label col-sm-3"
        style={{ display: showLabel ? 'block' : 'none' }}
      >
        {label}
      </label>
      <div className={showLabel ? 'col-sm-9' : 'col-sm-12'}>
        <PhoneInput
          country="sa"
          value={value || ''}
          onChange={(phone) => onChange && onChange(phone)}
          enableSearch={enableSearch}
          disableSearchIcon={false}
          disableDropdown={disableDropdown}
          disabled={disabled}
          countryCodeEditable
          autoFormat
          enableAreaCodes={false}
          specialLabel=""
          inputClass="form-control"
          searchPlaceholder="Search"
        />
      </div>
      {error && <div className="alert alert-danger mx-validation-message">{error}</div>}
    </div>
  );
}
