import React from 'react';
import { MxButton } from './MxWidgets.jsx';
import { useDashboardData } from '../data/DashboardDataProvider.jsx';

/**
 * snippetcall snippetCall13 -> Main.snip_ceomessage
 *
 * container15 (Class: 'common-section-gap')
 *   dataview dataView3 (Dashboard.ACT_CEOMessageDetails)
 *     container79 (Class: 'ceo-messagecard')
 *       ...
 *       listview listView8 (Main.DS_CEO, Class: 'profile-name')
 *
 * Mendix design properties resolve to these classes:
 *   Spacing padding-bottom M -> spacing-inner-bottom-medium
 *   Spacing margin-left   S  -> spacing-outer-left
 *   Spacing margin-bottom S  -> spacing-outer-bottom
 *   Spacing margin-top    S  -> spacing-outer-top
 *   Weight  Gotham-Bold      -> GothamBold
 *   Weight  Gotham-Medium    -> GothamMedium
 *
 * The datasource is live: POST /rest/myservice/v1/CEOMessage runs
 * Main.DS_PublishCeoMeassage inside the authenticated Mendix session. Until it
 * resolves - or if it fails, or if no message is currently published - the
 * static replication in dashboardData.js is rendered instead, so the card
 * never collapses.
 */
export default function CeoMessageSnippet() {
  const { data: ceoMessage } = useDashboardData('ceoMessage');

  return (
    <div className="mx-name-container15 common-section-gap">
      <div className="mx-dataview mx-name-dataView3 form-horizontal">
        <div className="mx-dataview-content">
          <div className="mx-name-container79 ceo-messagecard">

            <div className="mx-name-co42">
              <h2 className="mx-text mx-name-text13 dashboard-sub-headings ceo-subheading">
                {ceoMessage.heading}
              </h2>
            </div>

            <div className="mx-name-container80">
              <div className="mx-name-container81 ceo-msg-height spacing-inner-bottom-medium">
                <span className="mx-text mx-name-text38 message-content common-scroll-bar">
                  {ceoMessage.body}
                </span>
              </div>
            </div>

            <div className="mx-name-container82 profile-name-container">
              <div className="mx-listview mx-name-listView8 profile-name">
                <ul>
                  <li className="mx-name-index-0">
                    <div className="mx-dataview">
                      <div className="mx-dataview-content">
                        <div className="mx-name-container210 d-flex align-items-center ceo-designation-container">
                          <div className="mx-name-container211" />
                          <div className="mx-name-container212 spacing-outer-left">
                            <div className="mx-name-container213">
                              <h4 className="mx-text mx-name-text90 GothamBold">{ceoMessage.name}</h4>
                            </div>
                            <div className="mx-name-container214">
                              <h6 className="mx-text mx-name-text91 GothamMedium">{ceoMessage.position}</h6>
                            </div>
                            <div className="mx-name-container60 spacing-outer-bottom spacing-outer-top">
                              <span className="mx-text mx-name-text29 date-btn GothamBold">{ceoMessage.date}</span>
                            </div>
                            <MxButton
                              name="actionButton9"
                              className="spacing-outer-top"
                              caption={ceoMessage.button}
                              page="p.Main.snip_ceomessage"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
