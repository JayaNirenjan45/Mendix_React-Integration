import React from 'react';

import PromotionsCard from './PromotionsCard.jsx';
import CeoMessageSnippet from './CeoMessageSnippet.jsx';
import VacationCalendarSnippet from './VacationCalendarSnippet.jsx';
import { TodaysSchedule, EventsList } from './ScheduleAndEvents.jsx';
import LatestNews from './LatestNews.jsx';
import LinksRow from './LinksRow.jsx';
import AttendanceCarousel from './AttendanceCarousel.jsx';
import ApprovalsCard from './ApprovalsCard.jsx';
import ServicesRow from './ServicesRow.jsx';
import CelebrationsRow from './CelebrationsRow.jsx';
import OrganizationSection from './OrganizationSection.jsx';
import FooterTop from './FooterTop.jsx';
import { WidgetWrapper } from './MxWidgets.jsx';

/**
 * Main.New_Dashboard  (Url: THome, Layout: Main.NewLayout, Title: 'My Bahri')
 *
 * Top-level widget order, straight from the page model:
 *
 *   container2
 *     container76  (Class: 'black-card')
 *     container5   (Class: 'three-nine-lay')
 *       container10 (Class: 'left-lay')
 *         snippetCall13 -> Main.snip_ceomessage
 *         container241 (Class: 'calender-card common-section-gap')
 *           container243 + snippetCall14 + javascriptsnippet + container244 + container245
 *       container6  (Class: 'right-lay')
 *         container8 (Class: 'lates-newss')
 *         container9 -> gsLinksRow
 *         container16 -> dataView2 slick carousel
 *         container21 (Class: 'gs-approvals-card')
 *     container1  -> svcRow  (Class: 'gs-services-row')
 *     container79 -> gsCelebrationsRow
 *     container82 -> container900 (Class: 'organization-section')
 *     container14 (Class: 'b-footer-top')
 */
export default function NewDashboard() {
  return (
    <WidgetWrapper mendixId="p.Main.New_Dashboard.container2">
    <div className="mx-name-container2">

      <PromotionsCard />

      <div className="mx-name-container5 three-nine-lay">

        {/* ------------------------------------------------------------ left-lay */}
        <div className="mx-name-container10 left-lay">

          <CeoMessageSnippet />

          <div className="mx-name-container241 calender-card common-section-gap">
            <div className="mx-name-container243">
              <h2 className="mx-text mx-name-text107 text-employee dashboard-sub-headings border-bottom w-100 paddind-bottom spacing-outer-bottom-large">
                Calendar
              </h2>
            </div>

            <VacationCalendarSnippet />

            {/* javascriptsnippet gsSidebarToggleJs: trims the .vc-weekdays labels to
                one character. The weekday data is already single-character here, so
                only the mount point is reproduced. */}
            <div className="gsSidebarToggleJs" style={{ display: 'none' }} />

            <TodaysSchedule />
            <EventsList />
          </div>

        </div>

        {/* ----------------------------------------------------------- right-lay */}
        <div className="mx-name-container6 right-lay">
          <LatestNews />
          <LinksRow />
          <AttendanceCarousel />
          <ApprovalsCard />
        </div>

      </div>

      <ServicesRow />
      <CelebrationsRow />
      <OrganizationSection />
      <FooterTop />

    </div>
    </WidgetWrapper>
  );
}
