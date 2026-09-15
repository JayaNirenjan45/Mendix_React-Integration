import React from 'react';

/**
 * combobox widget (com.mendix.widget.web.combobox), reproduced from the live DOM.
 *
 *   div.mx-name-<name>.form-group.no-columns
 *     div.widget-combobox
 *       div.widget-combobox-input-container.form-control
 *         div.widget-combobox-selected-items
 *           input.widget-combobox-input
 *           div.widget-combobox-placeholder-text.widget-combobox-placeholder-empty
 *             span.widget-combobox-caption-text
 *         div.widget-combobox-down-arrow > span > svg.widget-combobox-down-arrow-icon
 *     div.widget-combobox-menu.widget-combobox-menu-hidden > ul.widget-combobox-menu-list
 *
 * atom-gs.scss targets .widget-combobox-caption-text and
 * .widget-combobox-down-arrow-icon, so both are present verbatim.
 */
export default function MxComboBox({ name, caption }) {
  return (
    <div className={`mx-name-${name} form-group no-columns`}>
      <div className="widget-combobox">
        <div className="widget-combobox-input-container form-control">
          <div className="widget-combobox-selected-items">
            <input
              type="text"
              className="widget-combobox-input"
              role="combobox"
              aria-label="Combo box"
              aria-autocomplete="list"
              aria-expanded="false"
              aria-required="false"
              autoComplete="off"
              placeholder=" "
              defaultValue=""
            />
            <div className="widget-combobox-placeholder-text widget-combobox-placeholder-empty">
              <span className="widget-combobox-caption-text">{caption}</span>
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
        <div className="widget-combobox-menu widget-combobox-menu-hidden">
          <ul className="widget-combobox-menu-list" />
        </div>
      </div>
    </div>
  );
}
