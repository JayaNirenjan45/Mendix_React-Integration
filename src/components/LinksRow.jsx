import React from 'react';
import { quickLinks, resources, employeeOfMonth } from '../data/dashboardData.js';
import { MxImage, MxStaticImage, MxButton } from './MxWidgets.jsx';
import MxComboBox from './MxComboBox.jsx';

/**
 * container9 > gsLinksRow (Class: 'gs-links-row')
 *
 *   gsQuickLinks (Class: 'gs-links-card gs-quicklinks')
 *   gsResources  (Class: 'gs-links-card gs-resources')
 *   container32  (Class: 'empofthe-mnth')
 *
 * Every tile icon is an image viewer from Main.gs_image. The Email tile's is
 * named gsTileDocsIcon1 on the page, hence tile.iconName.
 */
export default function LinksRow() {
  return (
    <div className="mx-name-container9">
      <div className="mx-name-gsLinksRow gs-links-row">

        {/* ------------------------------------------------------ Quick Links */}
        <div className="mx-name-gsQuickLinks gs-links-card gs-quicklinks">
          <div className="mx-name-gsQuickLinksHead gs-links-card__head">
            <span className="mx-text mx-name-gsQuickLinksTitle gs-links-card__title">Quick Links</span>
          </div>
          <div className="mx-name-gsQuickLinksTiles gs-links-card__body gs-quicklinks__tiles">
            {quickLinks.map((tile) => (
              <div key={tile.name} className={`mx-name-${tile.name} gs-link-tile`}>
                <MxImage name={tile.iconName || `${tile.name}Icon`} className="gs-link-tile__icon" src={tile.icon} />
                <div className={`mx-name-${tile.name}TitleBox gs-link-tile__titlebox`}>
                  <span className={`mx-text mx-name-${tile.name}Title gs-link-tile__title`}>{tile.title}</span>
                </div>
                <div className={`mx-name-${tile.name}DescBox gs-link-tile__descbox`}>
                  <span className={`mx-text mx-name-${tile.name}Desc gs-link-tile__desc`}>{tile.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------- Resources */}
        <div className="mx-name-gsResources gs-links-card gs-resources">
          <div className="mx-name-gsResourcesHead gs-links-card__head">
            <span className="mx-text mx-name-gsResourcesTitle gs-links-card__title">Resources</span>
            <MxStaticImage name="staticImage20" src="Main$gs_image$right_arrow.svg" />
          </div>
          <div className="mx-name-gsResourcesTiles gs-links-card__body gs-resources__tiles">
            {resources.map((tile) => (
              <div key={tile.name} className={`mx-name-${tile.name} gs-res-tile`}>
                <MxImage name={`${tile.name}Icon`} className="gs-res-tile__icon" src={tile.icon} />
                <span className={`mx-text mx-name-${tile.name}Title gs-res-tile__title`}>{tile.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --------------------------------------------- Employee of the Month */}
        <div className="mx-name-container32 empofthe-mnth">
          <span className="mx-text mx-name-text16">{employeeOfMonth.heading}</span>
          <span className="mx-text mx-name-text17">{employeeOfMonth.subheading}</span>

          <div className="mx-dataview mx-name-dataView6 form-horizontal">
            <div className="mx-dataview-content">
              <MxComboBox name="comboBox2" caption={employeeOfMonth.comboPlaceholder} />
            </div>
          </div>

          <div className="mx-name-container33 inner-mr">
            <div className="mx-name-container34 name-mr">
              <span className="mx-text mx-name-text19">{employeeOfMonth.initials}</span>
            </div>
            <span className="mx-text mx-name-text18 full-name">{employeeOfMonth.fullName}</span>
            <span className="mx-text mx-name-text20 role-oh">{employeeOfMonth.role}</span>
            <div className="mx-name-container35 imp-sc">
              <div className="mx-name-container36">
                <span className="mx-text mx-name-text21">{employeeOfMonth.scoreLabel}</span>
                <span className="mx-text mx-name-text22">{employeeOfMonth.scoreValue}</span>
              </div>
              <div className="mx-name-container45 prog" />
            </div>
          </div>

          <MxButton name="actionButton5" caption={employeeOfMonth.button} />
        </div>

      </div>
    </div>
  );
}
