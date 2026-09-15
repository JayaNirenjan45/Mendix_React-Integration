import React, { useState } from 'react';
import { celebrations, vivaEngage } from '../data/dashboardData.js';
import { MxImage, MxStaticImage, MxButton, MxLinkButton, MxLoadMore } from './MxWidgets.jsx';

/**
 * container79 > gsCelebrationsRow (Class: 'gs-celebrations-row')
 *
 *   dataview dataView1 (Dashboard.DS_NewSocilaInsightHelper, Class: 'gs-celebrations-card')
 *     container80 (Class: 'gs-celeb-body')
 *       container81  (Class: 'gs-celeb-head')
 *       container129 (Class: 'gs-celeb-people') > container130 (Class: 'gs-celeb-people-main') > listView4
 *       container132 (Class: 'gs-celeb-people') > container135 (Class: 'gs-celeb-people-main') > listView10
 *       container140 (Class: 'gs-celeb-wish')
 *     container149 (Class: 'gs-celeb-events')  <- sibling of container80, inside the dataview
 *   gsEngageCol (Class: 'gs-engage-col') > snippetcall Main.SNippet_Engage
 *
 * Both people listviews run Main.DS_GetBirthDays at PageSize 10 and the datasource
 * returns more rows, so Mendix appends a .mx-listview-loadMore button to each.
 *
 * container150..157 carry DynamicClasses:
 *   if $currentObject/Event = '<value>' then 'expand-part' else ''
 * and their linkbutton is Visible under the same condition. Clicking a tile runs
 * Main.ACT_SelectEvent, which is what the selectedEvent state stands in for here.
 * Mendix makes those tiles focusable (tabindex="0" role="button") because they
 * carry an action; container149 itself gets neither, so it is left plain.
 *
 * container158 / container159 are the preset wish blocks, visible only when the
 * selected Event is 'Birthday' / 'Wedding'. With no event selected neither
 * renders, which is what the live page shows.
 */

/* listView4 / listView10: Main.DS_GetBirthDays, PageSize 10 */
function CelebPeople({ container, innerContainer, bgImgName, bgImg, listView, avatarContainer, avatarImgName, selectedIndex = null }) {
  return (
    <div className={`mx-name-${container} gs-celeb-people`}>
      <div className={`mx-name-${innerContainer} gs-celeb-people-main`}>
        <MxImage name={bgImgName} className="gs-celeb-people-main-bg" src={bgImg} />
        <div className={`mx-listview mx-name-${listView} gs-celeb-people-list`}>
          <ul>
            {Array.from({ length: celebrations.avatarCount }).map((_, i) => (
              <li key={i} className={`mx-name-index-${i}${i === selectedIndex ? ' selected' : ''}`}>
                <div className="mx-dataview">
                  <div className="mx-dataview-content">
                    <div className={`mx-name-${avatarContainer} gs-celeb-avatar`}>
                      <MxImage name={avatarImgName} className="gs-celeb-avatar-img" src="Main$Images$CelebProf.svg" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <MxLoadMore />
        </div>
      </div>
    </div>
  );
}

/* container158 / container159: gs-wish-presets */
function WishPresets({ container, modifier, presets }) {
  return (
    <div className={`mx-name-${container} gs-wish-presets ${modifier}`}>
      {presets.map((p) => (
        <MxButton key={p.name} name={p.name} caption={p.caption} />
      ))}
    </div>
  );
}

export default function CelebrationsRow() {
  /* nanoflow Main.ACT_SelectEvent("Event": <value>) */
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <div className="mx-name-container79">
      <div className="mx-name-gsCelebrationsRow gs-celebrations-row">

        <div className="mx-dataview mx-name-dataView1 gs-celebrations-card form-horizontal">
          <div className="mx-dataview-content">

            <div className="mx-name-container80 gs-celeb-body">

              <div className="mx-name-container81 gs-celeb-head">
                <MxImage name="gsImg9" className="gs-celeb-head-icon" src="Main$Images$celebration.svg" />
                <span className="mx-text mx-name-text38 gs-celeb-head-title">{celebrations.headTitle}</span>
              </div>

              <CelebPeople
                container="container129"
                innerContainer="container130"
                bgImgName="gsImg10"
                bgImg="Main$Images$Celeb1.svg"
                listView="listView4"
                avatarContainer="container147"
                avatarImgName="gsImg11"
                /* dataView13 takes its data from `selection listView4`, so only this
                   listview marks a selected row */
                selectedIndex={0}
              />

              <CelebPeople
                container="container132"
                innerContainer="container135"
                bgImgName="gsImg22"
                bgImg="Main$Images$Pops.svg"
                listView="listView10"
                avatarContainer="container160"
                avatarImgName="gsImg23"
              />

              <div className="mx-name-container140 gs-celeb-wish">
                <div className="mx-dataview mx-name-dataView13 gs-celeb-wish-view form-horizontal">
                  <div className="mx-dataview-content">
                    <div className="mx-name-container161 gs-wish-details">
                      <div className="mx-name-container166 gs-wish-content">
                        <div className="mx-dataview mx-name-dataView11 gs-wish-employee form-horizontal">
                          <div className="mx-dataview-content">
                            <div className="mx-name-container141 gs-wish-list">
                              <div className="mx-dataview mx-name-dataView9 gs-wish-form form-horizontal">
                                <div className="mx-dataview-content">

                                  {selectedEvent === 'Birthday' && (
                                    <WishPresets
                                      container="container158"
                                      modifier="gs-wish-presets-birthday"
                                      presets={celebrations.birthdayPresets}
                                    />
                                  )}
                                  {selectedEvent === 'Wedding' && (
                                    <WishPresets
                                      container="container159"
                                      modifier="gs-wish-presets-wedding"
                                      presets={celebrations.weddingPresets}
                                    />
                                  )}

                                  <div className="mx-name-container142 gs-wish-input">
                                    <div className="mx-name-container58 d-flex">
                                      <span className="mx-text mx-name-text26">{celebrations.writeWithAi}</span>
                                      <MxStaticImage name="staticImage23" src="Main$gs_image$write_with_ai.svg" />
                                    </div>
                                    <div className="mx-name-textBox1 gs-wish-textbox mx-textbox form-group no-columns">
                                      <input
                                        className="form-control"
                                        maxLength={500}
                                        placeholder={celebrations.wishPlaceholder}
                                        autoComplete="on"
                                        type="text"
                                        defaultValue=""
                                      />
                                    </div>
                                  </div>

                                  <div className="mx-name-container143 gs-wish-actions">
                                    <MxButton
                                      name="actionButton19"
                                      className="gs-wish-send"
                                      style="primary"
                                      icon="paper-plane"
                                      caption="Send"
                                    />
                                  </div>

                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* container149: Action nanoflow Main.ACT_SelectEvent("Event": empty) */}
            <div className="mx-name-container149 gs-celeb-events" onClick={() => setSelectedEvent(null)}>
              {celebrations.events.map((ev) => (
                <div
                  key={ev.container}
                  className={
                    `mx-name-${ev.container} gs-celeb-event` +
                    (selectedEvent === ev.value ? ' expand-part' : '')
                  }
                  tabIndex={0}
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(ev.value);
                  }}
                >
                  <MxImage name={ev.img} className="gs-celeb-event-icon" src="Main$Images$Cake.svg" />
                  <span className={`mx-text mx-name-${ev.text} gs-celeb-event-label`}>{ev.label}</span>
                  {selectedEvent === ev.value && (
                    <MxLinkButton
                      name={ev.button}
                      className="gs-celeb-event-send"
                      icon="paper-plane"
                      onClick={(e) => e.preventDefault()}
                    />
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* gsEngageCol > snippetcall snippetCall1 -> Main.SNippet_Engage */}
        <div className="mx-name-gsEngageCol gs-engage-col">
          <div className="mx-name-container1 ve-container">
            <div className="mx-name-container2 header-ve">
              <MxStaticImage name="staticImage1" src="Main$Images$image_7.svg" />
              <span className="mx-text mx-name-text1">{vivaEngage.title}</span>
            </div>
            <div className="mx-name-container3">
              <span className="mx-text mx-name-text2">{vivaEngage.body}</span>
            </div>
            <MxButton
              name="actionButton1"
              caption={vivaEngage.button}
              page="p.Main.SNippet_Engage"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
