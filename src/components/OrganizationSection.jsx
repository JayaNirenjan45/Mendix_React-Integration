import React from 'react';
import { organization } from '../data/dashboardData.js';
import { MxStaticImage, MxButton } from './MxWidgets.jsx';
import MxComboBox from './MxComboBox.jsx';

/**
 * container82 > container900 (Class: 'organization-section')
 *   container84 (Spacing margin-bottom L -> spacing-outer-bottom-large)
 *     container54 (Class: 'flex-sb')
 *       container56 (Class: 'os-cont')
 *       dataview dataView4 (Dashboard.DS_GetSearchData)
 *         container86 (Class: 'organization-search') > staticImage17 + comboBox1
 *   container85 (Class: 'organization-carousel')
 *     four x container (Class: 'organization-structure common-section-gap')
 *
 * The department buttons are actionbuttons whose Icon is an image
 * (Main.Images.Button_), so Mendix renders <button ...><img alt="" src></button>.
 */
export default function OrganizationSection() {
  return (
    <div className="mx-name-container82">
      <div className="mx-name-container900 organization-section">

        <div className="mx-name-container84 spacing-outer-bottom-large">
          <div className="mx-name-container54 flex-sb">

            <div className="mx-name-container56 os-cont">
              <MxStaticImage name="staticImage18" src="Main$Images$organisational_structure.svg" />
              <div className="mx-name-container57">
                <h2 className="mx-text mx-name-text420 text-employee dashboard-sub-headings spacing-outer-bottom-large">
                  {organization.heading}
                </h2>
                <MxStaticImage name="staticImage21" src="Main$gs_image$right_arrow.svg" />
              </div>
            </div>

            <div className="mx-dataview mx-name-dataView4 form-horizontal">
              <div className="mx-dataview-content">
                <div className="mx-name-container86 organization-search">
                  <MxStaticImage name="staticImage17" src="PhoneWeb$BM_image_collection$search_icn.svg" />
                  <MxComboBox name="comboBox1" caption={organization.searchPlaceholder} />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mx-name-container85 organization-carousel">
          {organization.departments.map((dep) => (
            <div key={dep.container} className={`mx-name-${dep.container} organization-structure common-section-gap`}>
              <span className={`mx-text mx-name-${dep.text}`}>{dep.label}</span>
              <MxButton name={dep.button} iconImage="Main$Images$Button_.svg" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
