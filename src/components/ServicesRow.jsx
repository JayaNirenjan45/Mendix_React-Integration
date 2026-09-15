import React from 'react';
import { servicePanels } from '../data/dashboardData.js';
import { MxImage } from './MxWidgets.jsx';

/**
 * container1 > svcRow (Class: 'gs-services-row')
 *   svcPanelUsed   (Class: 'gs-services-panel gs-services-panel--used')
 *   svcPanelOffers (Class: 'gs-services-panel gs-services-panel--offers')
 *
 * Each gs-service-tile is an image viewer plus an unclassed container holding
 * the name and description texts.
 */
export default function ServicesRow() {
  return (
    <div className="mx-name-container1">
      <div className="mx-name-svcRow gs-services-row">
        {servicePanels.map((panel) => (
          <div key={panel.panel} className={`mx-name-${panel.panel} gs-services-panel ${panel.modifier}`}>
            <span className={`mx-text mx-name-${panel.titleName} gs-services-panel__title`}>
              {panel.title}
            </span>
            <div className={`mx-name-${panel.listName} gs-services-list`}>
              {panel.tiles.map((tile) => (
                <div key={tile.tile} className={`mx-name-${tile.tile} gs-service-tile`}>
                  <MxImage name={tile.iconName} className="gs-service-tile__icon" src={tile.icon} />
                  <div className={`mx-name-${tile.box}`}>
                    <span className={`mx-text mx-name-${tile.nameName} gs-service-tile__name`}>{tile.name}</span>
                    <span className={`mx-text mx-name-${tile.descName} gs-service-tile__desc`}>{tile.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
