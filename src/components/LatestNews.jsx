import React from 'react';
import { latestNews } from '../data/dashboardData.js';
import { MxStaticImage, MxLinkButton } from './MxWidgets.jsx';

/**
 * container8 (Class: 'lates-newss')
 *   container7 (Class: 'new-top')
 *     three x container (Class: 'in-ln') > container (Class: 'cup-ln')
 *
 * The "Read more" widget is a linkbutton with Action open_link and an Icon, so
 * Mendix renders <a class="mx-link mx-name-actionButtonN" ...><img/> Read more</a>.
 */
export default function LatestNews() {
  return (
    <div className="mx-name-container8 lates-newss">
      <span className="mx-text mx-name-text4 ln--header-txt">{latestNews.header}</span>
      <span className="mx-text mx-name-text5 ln--subheader-txt">{latestNews.subheader}</span>

      <div className="mx-name-container7 new-top">
        {latestNews.items.map((item) => (
          <div key={item.outer} className={`mx-name-${item.outer} in-ln`}>
            <div className={`mx-name-${item.inner} cup-ln`}>

              <div className={`mx-name-${item.badgeRow} d-flex gap-8`}>
                <span className={`mx-text mx-name-${item.badgeText} badge-x`}>{item.badge}</span>
                <div className={`mx-name-${item.dateRow} d-flex gap-4`}>
                  <MxStaticImage name={item.staticImage} src="Main$gs_image$gs_clock.svg" />
                  <span className={`mx-text mx-name-${item.dateText}`}>{item.date}</span>
                </div>
              </div>

              <span className={`mx-text mx-name-${item.titleText}`}>{item.title}</span>

              <MxLinkButton
                name={item.link}
                href={latestNews.readMoreHref}
                target="_blank"
                iconImage="Main$gs_image$blue_icn.svg"
                caption="Read more"
              />

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
