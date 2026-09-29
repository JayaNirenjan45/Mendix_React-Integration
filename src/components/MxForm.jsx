import React, { useCallback, useId, useRef, useState } from 'react';

/**
 * The form widgets the four employee service request pages use, emitting the
 * DOM the Mendix client produces for each.
 *
 * Every page here declares `FormOrientation: Vertical` on its data view, which
 * is what drops Bootstrap's `col-sm-3` / `col-sm-9` pair: the label and the
 * control become siblings inside the `.form-group`. That is exactly what
 * atom-service-gs.scss is written against - it lays `.form-group` out as a flex
 * column and gives the control `flex: none` "because the control is a flex item
 * of the column .form-group above".
 *
 * Validation follows the client too: the group takes `.has-error` and a
 * `.alert.mx-validation-message` is appended after the control, which the
 * stylesheet strips back to a plain red line of hint text.
 *
 * Runtime-generated ids (mxui_widget_*, p.Module.Page.textBox1_qai_16) are
 * omitted, as they are everywhere else in this app: they differ per session and
 * no stylesheet uses them.
 */

/* --------------------------------------------------------------- foundation */

/** Joins class names, dropping the empty ones, without collapsing Mendix's own
 *  double spaces - several page classes carry them and they are harmless. */
function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * The wrapper every labelled control shares.
 *
 *   <div class="form-group mx-name-<name> <class>[ has-error]">
 *     <label class="control-label">Caption</label>
 *     {control}
 *     [<div class="alert alert-danger mx-validation-message">…</div>]
 */
export function MxFormGroup({ name, label, className, error, style, widget, children }) {
  return (
    <div
      className={cx(
        'form-group',
        widget,
        /*
         * `no-columns` is what a NON-horizontal form emits, and it is not
         * cosmetic: without it Bootstrap's horizontal-form rules take over at
         * >=768px and float the label into a grid column, which is what pushed
         * the sign-in labels out of flow between 768 and 1024. Every data view
         * on these pages is FormOrientation: Vertical, so every group gets it.
         */
        'no-columns',
        `mx-name-${name}`,
        className,
        error && 'has-error'
      )}
      style={style}
    >
      {label !== undefined && label !== '' && <label className="control-label">{label}</label>}
      {children}
      {error && <div className="alert alert-danger mx-validation-message">{error}</div>}
    </div>
  );
}

/** dynamictext -> <span class="mx-text mx-name-<name> <class>"> */
export function MxText({ name, className, renderMode = 'span', children, ...rest }) {
  const Tag = renderMode === 'span' ? 'span' : renderMode;
  return (
    <Tag className={cx('mx-text', name && `mx-name-${name}`, className)} {...rest}>
      {children}
    </Tag>
  );
}

/** statictext -> <span class="mx-text"> with no name of its own */
export function MxStaticText({ className, children }) {
  return <span className={cx('mx-text', className)}>{children}</span>;
}

/** container -> <div class="mx-name-<name> <class>"> */
export function MxContainer({ name, className, children, ...rest }) {
  return (
    <div className={cx(name && `mx-name-${name}`, className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- layout grid */

/*
 * Read off the running Mendix client - the Absence page's layoutGrid5, measured
 * in the app itself rather than inferred from the model:
 *
 *   div.mx-layoutgrid.mx-layoutgrid-fluid.mx-name-<name>.<class>
 *     div.row
 *       div.col-lg-8.col-md.col        <- an explicit desktop width
 *       div.col-lg-4.col-md.col
 *
 * Two things the sign-in page misled me about. `container-fluid` and
 * `no-gutters` are NOT universal - that grid happens to carry them, this one
 * does not - so they belong on the page that has them, not in this primitive.
 *
 * And the column width matters more than it looks: with a plain `col`, the
 * theme's `flex: 1.55 / 0.95` split wins and the balance rail comes out wider
 * than the form. With `col-lg-8` / `col-lg-4` Bootstrap's 66.7/33.3 wins
 * instead, which is what Mendix actually renders. The page model reports both
 * columns as "AutoFill", so the live DOM is the only place this is visible.
 */
export function MxLayoutGrid({ name, className, children }) {
  return (
    <div className={cx('mx-layoutgrid mx-layoutgrid-fluid', name && `mx-name-${name}`, className)}>
      {children}
    </div>
  );
}

export function MxRow({ className, children }) {
  return <div className={cx('row', className)}>{children}</div>;
}

/**
 * A layout-grid column. `lg` is the explicit desktop width in Bootstrap's
 * twelfths; without it the column is auto-fill, which is what most of these
 * pages use.
 */
export function MxColumn({ lg, className, children }) {
  return (
    <div className={cx(lg ? `col-lg-${lg}` : 'col-lg', 'col-md col', className)}>{children}</div>
  );
}

/* ------------------------------------------------------------------ inputs */

/**
 * textbox
 *   <input class="form-control" type="text">
 * `Editable: Never` compiles to a readonly input, which the stylesheet greys.
 */
export function MxTextBox({
  name,
  label,
  className,
  value = '',
  onChange,
  placeholder,
  readOnly = false,
  error,
  type = 'text'
}) {
  return (
    <MxFormGroup name={name} label={label} className={className} error={error} widget="mx-textbox">
      <input
        className="form-control"
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </MxFormGroup>
  );
}

/**
 * textarea -> <textarea class="form-control">
 *
 * `style` is the widget's Style property, and Mendix renders that on the
 * widget's ROOT node - the .form-group - not on the control inside it.
 * Absence's Comments box is the case that matters: `Style: 'width:100%'` is
 * what makes it fill its container rather than sitting narrow inside it.
 */
export function MxTextArea({ name, label, className, value = '', onChange, placeholder, readOnly = false, error, style }) {
  return (
    <MxFormGroup name={name} label={label} className={className} error={error} style={style} widget="mx-textarea">
      <textarea
        className="form-control"
        value={value ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      />
    </MxFormGroup>
  );
}

/**
 * radiobuttons
 *   <div class="mx-radiobuttons mx-radiogroup" role="radiogroup">
 *     <div class="radio"><label><input type="radio">Caption</label></div>
 *
 * The input sits INSIDE its label, which is the shape atom-service-gs.scss
 * matches with `.radio > label:has(> input[type='radio'])`.
 *
 * A Boolean attribute renders as Yes / No; an enumeration renders its captions.
 */
export function MxRadioButtons({ name, label, className, options, value, onChange, error, disabled = false }) {
  const group = useId();

  return (
    <MxFormGroup name={name} label={label} className={className} error={error}>
      <div className="mx-radiobuttons mx-radiogroup" role="radiogroup">
        {options.map((option) => (
          <div className="radio" key={String(option.value)}>
            <label>
              <input
                type="radio"
                name={group}
                disabled={disabled}
                checked={value === option.value}
                onChange={() => onChange && onChange(option.value)}
              />
              {option.caption}
            </label>
          </div>
        ))}
      </div>
    </MxFormGroup>
  );
}

/** The Yes / No pair Mendix renders for a Boolean radio-button group. */
export const BOOLEAN_OPTIONS = [
  { value: true, caption: 'Yes' },
  { value: false, caption: 'No' }
];

/**
 * combobox (com.mendix.widget.web.combobox), reproduced from the live DOM and
 * made to work: the menu opens on click, closes on Escape, on a choice and on a
 * click outside, and the list carries the highlighted / selected classes the
 * stylesheet colours.
 *
 *   div.mx-name-<name>.form-group
 *     [label.control-label]
 *     div.widget-combobox
 *       div.widget-combobox-input-container.form-control
 *         div.widget-combobox-selected-items
 *           input.widget-combobox-input
 *           div.widget-combobox-placeholder-text[.widget-combobox-placeholder-empty]
 *             span.widget-combobox-caption-text
 *         div.widget-combobox-down-arrow > span > svg.widget-combobox-down-arrow-icon
 *       div.widget-combobox-menu[.widget-combobox-menu-hidden] > ul.widget-combobox-menu-list
 */
export function MxComboBox({ name, label, className, options, value, onChange, placeholder = '', error, emptyOption = true }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);

  const selected = options.find((option) => option.value === value);
  const items = emptyOption ? [{ value: '', caption: '' }, ...options] : options;

  const close = useCallback(() => {
    setOpen(false);
    setHighlighted(-1);
  }, []);

  /* A click anywhere else closes the menu, as the widget's own does. */
  React.useEffect(() => {
    if (!open) return undefined;

    function onDocumentDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) close();
    }

    document.addEventListener('mousedown', onDocumentDown);
    return () => document.removeEventListener('mousedown', onDocumentDown);
  }, [open, close]);

  function choose(option) {
    if (onChange) onChange(option.value);
    close();
  }

  return (
    <MxFormGroup name={name} label={label} className={className} error={error}>
      <div className="widget-combobox" ref={rootRef}>
        <div
          className="widget-combobox-input-container form-control"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="widget-combobox-selected-items">
            <input
              type="text"
              className="widget-combobox-input"
              role="combobox"
              aria-label={label || 'Combo box'}
              aria-autocomplete="list"
              aria-expanded={open ? 'true' : 'false'}
              aria-required="false"
              autoComplete="off"
              placeholder=" "
              readOnly
              value=""
              onKeyDown={(event) => {
                if (event.key === 'Escape') close();
                if (event.key === 'Enter' && highlighted >= 0) choose(items[highlighted]);
              }}
              onChange={() => {}}
            />
            <div
              className={cx(
                'widget-combobox-placeholder-text',
                !selected && 'widget-combobox-placeholder-empty'
              )}
            >
              <span className="widget-combobox-caption-text">
                {selected ? selected.caption : placeholder}
              </span>
            </div>
          </div>
          <div className="widget-combobox-down-arrow">
            <span className="widget-combobox-icon-container">
              <svg
                className="widget-combobox-down-arrow-icon mx-icon-lined mx-icon-chevron-down"
                width="16"
                height="16"
                viewBox="0 0 32 32"
              >
                <path d="M16 23.41L4.29004 11.71L5.71004 10.29L16 20.59L26.29 10.29L27.71 11.71L16 23.41Z" />
              </svg>
            </span>
          </div>
        </div>
        <div className={cx('widget-combobox-menu', !open && 'widget-combobox-menu-hidden')}>
          <ul className="widget-combobox-menu-list" role="listbox">
            {items.map((option, index) => (
              <li
                key={option.value === '' ? '__empty' : option.value}
                role="option"
                aria-selected={option.value === value}
                className={cx(
                  'widget-combobox-menu-item',
                  index === highlighted && 'widget-combobox-menu-item-highlighted',
                  option.value === value && 'widget-combobox-menu-item-selected'
                )}
                onMouseEnter={() => setHighlighted(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.caption || ' '}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MxFormGroup>
  );
}

/**
 * Forms$ReferenceSelector in its default drop-down form: a plain
 * `<select class="form-control">`, which the stylesheet gives the chevron and
 * the 46px control height.
 *
 * On these pages the caption is NOT the widget's own label - the page puts a
 * static text above it inside a `.common-select.items-row` container - so this
 * renders no label of its own.
 */
export function MxReferenceSelector({
  name,
  label,
  className,
  options,
  value,
  onChange,
  error,
  placeholder = ''
}) {
  return (
    <MxFormGroup
      name={name}
      label={label}
      widget="mx-referenceselector"
      className={className}
      error={error}
    >
      <select
        className="form-control"
        value={value ?? ''}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.caption}
          </option>
        ))}
      </select>
    </MxFormGroup>
  );
}

/* ----------------------------------------------------------------- listview */

/**
 * listview
 *   <div class="mx-listview mx-name-<name> <class>">
 *     <ul><li class="mx-listview-item">…</li></ul>
 *
 * An empty data source renders the client's own empty row, whose label carries
 * the system text "No items found". atom-service-gs.scss collapses that label
 * to zero and writes its own sentence on it, so the label is reproduced with
 * the system text intact.
 */
export function MxListView({ name, className, items, renderItem, keyOf }) {
  return (
    <div className={cx('mx-listview', name && `mx-name-${name}`, className)}>
      <ul>
        {items.length === 0 ? (
          <li className="mx-listview-empty">
            <label>No items found</label>
          </li>
        ) : (
          items.map((item, index) => (
            <li className="mx-listview-item" key={keyOf ? keyOf(item) : index}>
              {renderItem(item, index)}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------- data view */

/**
 * dataview
 *   <div class="mx-dataview mx-name-<name> <class>">
 *     <div class="mx-dataview-content">…</div>
 *
 * `.absence-1-c > .mx-dataview-content` is positioned by the stylesheet so the
 * history button can be pinned inside it, so the content wrapper is not
 * optional.
 */
export function MxDataView({ name, className, children }) {
  return (
    <div className={cx('mx-dataview', name && `mx-name-${name}`, className)}>
      <div className="mx-dataview-content">{children}</div>
    </div>
  );
}

/* ------------------------------------------ itvisors DynamicEnumPicker */

/**
 * `itvisors.dynamicenumpicker.DynamicEnumPicker` with dropdownRadio set to
 * 'radiobuttonlist', which is how Drivers renders Driver Type. The picker
 * delegates to com.tgict's radio-button list, whose own stylesheet
 * (RadiobuttonList.css, loaded by index.html) is written against:
 *
 *   div.widget-radiobuttonlist.widget-radiobuttonlist-<direction>
 *     label.radio-option > input[type=radio] + span.radio-label
 *
 * The widget's `enumvalue` children are the values it offers, so the caller
 * passes exactly those rather than the whole enumeration.
 */
export function MxRadiobuttonList({
  name,
  label,
  className,
  options,
  value,
  onChange,
  direction = 'horizontal',
  disabled = false,
  error
}) {
  const group = useId();

  return (
    <MxFormGroup name={name} label={label} className={className} error={error}>
      <div
        className={cx(
          'widget-radiobuttonlist',
          `widget-radiobuttonlist-${direction}`,
          disabled && 'widget-radiobuttonlist-disabled'
        )}
        role="radiogroup"
      >
        {options.map((option) => (
          <label className="radio-option" key={option.value}>
            <input
              type="radio"
              name={group}
              disabled={disabled}
              checked={value === option.value}
              onChange={() => onChange && onChange(option.value)}
            />
            <span className="radio-label">{option.caption}</span>
          </label>
        ))}
      </div>
    </MxFormGroup>
  );
}
