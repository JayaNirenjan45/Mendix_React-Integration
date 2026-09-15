/**
 * Static content for the New_Dashboard replication.
 *
 * Every value below is the literal text the Mendix page renders at
 * https://mxinterface.rapidhr.com/link/THome?profile=Responsive. Values that
 * come from a Mendix datasource (microflow / database retrieve) are captured
 * here so the React page renders identically without a Mendix runtime behind
 * it.
 *
 * The comment above each block names the Mendix datasource it stands in for.
 */
import { MENDIX_APP_URL } from '../services/mendixConfig.js';

/* Main.gs_image + Main.Images collections, served from /public/img */
export const IMG = '/img';

/* --- Layout: Main.NewLayout (static captions authored in the layout) ------- */
export const layout = {
  wordmark: 'MyBahri',
  weatherTemp: '28°C',
  weatherCity: 'Riyadh',
  bellCount: '3',
  userInitials: 'AA',
  userName: 'Ammar Al-Nahdi',
  userRole: 'Project Manager',
  /* gsUserMenuSignOut runs Mendix's Sign out action, which ends the session and
     reloads into the login page. The button in NewLayout.jsx calls the real
     logout endpoint instead; this is the address Mendix itself would land on. */
  signOutUrl: MENDIX_APP_URL,
  tickerText: 'Welcome Back! Ammar Al-Nahdi',
  nav: [
    { name: 'gsNavHome', icon: 'one', title: 'MyBahri', sub: 'Homepage', active: true },
    { name: 'gsNavServices', icon: 'two', title: 'Services', sub: 'Self Service', active: false },
    { name: 'gsNavResources', icon: 'three', title: 'Resources', sub: 'Files', active: false },
    { name: 'gsNavEngagement', icon: 'four', title: 'Engagement Hub', sub: 'Employee Engagement', active: false },
    { name: 'gsNavMultimedia', icon: 'five', title: 'Multimedia', sub: 'Insight', active: false }
  ]
};

/* --- black-card promotions banner (static on the page) -------------------- */
export const promotions = {
  title: 'Promotions',
  body: 'Join us for a chance to connect with your colleagues, share ideas, and enjoy some refreshments. Stay tuned for more details on dates and activities!',
  button: 'View'
};

/* --- Main.snip_ceomessage: Dashboard.ACT_CEOMessageDetails + Main.DS_CEO --- */
export const ceoMessage = {
  heading: 'SpotLight',
  body: 'Dear OneBahri Team, I am happy to share that Bahri has delivered a resilient performance in the first half of 2025.',
  name: 'AHMED ALSUBAEY',
  position: 'Chief Executive Officer',
  date: '11 Aug 2025',
  button: 'Read Full Message'
};

/* --- Main.snip_vacationcalendar_New: Dashboard.DS_GetVacationDetails ------ */
/* The month grid itself is computed live in VacationCalendarSnippet.jsx. The
   datasource returned no days off for this employee, so the list is empty. */
export const calendar = {
  daysOff: [],
  emptyLegend: 'No days off configured for this period.'
};

/* --- listView9: Main.DS_TodaysSchedule ------------------------------------ */
export const todaysSchedule = [
  { title: 'Team Standup', date: '10:00 AM - 10:30 AM' },
  { title: 'Team Presentation', date: '12:00 PM - 02:00 PM' },
  { title: 'Sync', date: '03:00 PM - 03:30 PM' }
];

/* --- listView2: database from Dashboard.Event where EndDate >= today ------ */
export const events = [
  { title: 'National Day Celebration', date: '02-04-2026' }
];

/* --- lates-newss (static on the page) ------------------------------------- */
export const latestNews = {
  header: 'Latest News',
  subheader: 'Recent updates from across Bahri',
  readMoreHref: MENDIX_APP_URL,
  items: [
    {
      outer: 'container11', inner: 'container12', badgeRow: 'container13', dateRow: 'container27',
      staticImage: 'staticImage9', badgeText: 'text3', dateText: 'text6', titleText: 'text7', link: 'actionButton2',
      badge: 'social media', date: ' Jun 24, 2026',
      title: 'Safety and sustainability update: Q2 2026 milestones reached'
    },
    {
      outer: 'container15', inner: 'container20', badgeRow: 'container30', dateRow: 'container22',
      staticImage: 'staticImage10', badgeText: 'text10', dateText: 'text11', titleText: 'text12', link: 'actionButton3',
      badge: 'internal announcements', date: ' Jun 24, 2026',
      title: 'Safety and sustainability update: Q2 2026 milestones reached'
    },
    {
      outer: 'container23', inner: 'container24', badgeRow: 'container31', dateRow: 'container25',
      staticImage: 'staticImage11', badgeText: 'text13', dateText: 'text14', titleText: 'text15', link: 'actionButton4',
      badge: 'News', date: ' Jun 24, 2026',
      title: 'Safety and sustainability update: Q2 2026 milestones reached'
    }
  ]
};

/* --- gs-quicklinks tiles (static on the page) ----------------------------- */
/* gsTileEmail's image widget is named gsTileDocsIcon1 on the page (it was
   copied from the Documents icon), so that tile carries an explicit iconName. */
export const quickLinks = [
  { name: 'gsTileErp', icon: 'Main$gs_image$erp_system.svg', title: 'ERP System', desc: 'Core business management' },
  { name: 'gsTileHr', icon: 'Main$gs_image$hrportal.svg', title: 'HR Portal', desc: 'Employee management' },
  { name: 'gsTileEmail', iconName: 'gsTileDocsIcon1', icon: 'Main$gs_image$email.svg', title: 'Email', desc: 'Corporate email' },
  { name: 'gsTileDocs', icon: 'Main$gs_image$documents.svg', title: 'Documents', desc: 'Document management' }
];

/* --- gs-resources tiles (static on the page) ------------------------------ */
export const resources = [
  { name: 'gsResTemplates', icon: 'Main$gs_image$templateandforms.svg', title: 'Tempelates and Forms' },
  { name: 'gsResGuide', icon: 'Main$gs_image$mybahri.svg', title: 'MyBahri Guide Book' },
  { name: 'gsResHandbook', icon: 'Main$gs_image$employeehandbook.svg', title: 'Employee Handbook' },
  { name: 'gsResOrgChart', icon: 'Main$gs_image$organisationalchart.svg', title: 'Organizational Chart' }
];

/* --- empofthe-mnth: Dashboard.DS_GetSearchData + static captions ---------- */
export const employeeOfMonth = {
  heading: 'Employee of the Month',
  subheading: 'May 2026 Recognition',
  comboPlaceholder: 'Marketing Department',
  initials: 'MR',
  fullName: 'Mohammed Al-Rashid',
  role: 'Fleet Optimization Specialist',
  scoreLabel: 'Impact Score',
  scoreValue: '92.8%',
  button: 'Congratulate Mohammed 🎉'
};

/* --- dataView2: Employee_Attendance_System.DS_TodayAttendanceData_2 ------- */
export const attendance = {
  title: 'Daily Attendance',
  dateLabel: "Today's Date",
  dateValue: 'Saturday, September 12, 2026',
  balanceLabel: 'Leave Balance',
  balanceValue: '10',
  timerValue: '00:00',
  timerSub: "You haven't checked in today",
  punchIn: '--:-- AM',
  punchOut: '--:-- PM',
  btnIn: 'Punch In',
  btnOut: 'Punch Out'
};

/* --- gs-approvals-card: tabContainer1 over the four request microflows ---- */
/*
 * Main.RequestDetails rows for the signed-in employee. The request types and
 * state captions are the real Main.ENUM_CommonRequestTypes / Main.ENUM_State
 * captions from the Mendix model.
 *
 * Deadlines and creation dates are stored as day offsets from today, so the
 * "Today" / "Tomorrow" wording produced by the page's date expression stays
 * meaningful whenever the dashboard is opened. `deadline: null` stands for an
 * empty Main.Request/EstimatedDeadline.
 *
 * Each tab mirrors its datasource microflow:
 *   All       DS_GetRequestDetailsList_ExeuctiveTemplate   every request
 *   Pending   DS_PendingRequests    State = InProgress   ('In Progress')
 *   Approved  DS_ApproveRequests    State = Completed    ('Completed')
 *   Reject    DS_RejectedRequests   State = Rejected     ('Rejected')
 * all sorted by CreationDate descending, shown PageSize 2 at a time.
 */
export const approvals = {
  title: 'Approvals & My Requests',
  sub: 'Employee services',
  /* No longer rendered: the card's badge counts the records the open tab's
     microflow returned. Kept as the caption the static page carried. */
  count: '5',
  emptyLabel: 'No items found',
  pageSize: 2,
  /* The rows themselves are no longer static: ApprovalsCard fetches each tab
     from its own DashboardService resource. Kept as a record of the shape the
     card renders - requestType, state and a deadline - and as sample data if
     the card is ever exercised without a Mendix runtime behind it. */
  requests: [
    { requestType: 'Letter Request', state: 'Rejected', created: -1, deadline: 3 },
    { requestType: 'Leave Request', state: 'In Progress', created: -2, deadline: 0 },
    { requestType: 'Employee Parking', state: 'Completed', created: -3, deadline: -2 },
    { requestType: 'Access Card Request', state: 'In Progress', created: -5, deadline: 1 },
    { requestType: 'Business Card Request', state: 'Completed', created: -8, deadline: -6 }
  ],
  /* The four listviews are identical templates; only their widget names differ. */
  tabs: [
    {
      name: 'tabPage1', caption: 'All', container: 'container121', listView: 'listView3', state: null,
      row: { outer: 'container28', inner: 'container37', type: 'text9', clock: 'container46', icon: 'staticImage12', date: 'text69', status: 'text59' }
    },
    {
      name: 'tabPage2', caption: 'Pending', container: 'container122', listView: 'listView6', state: 'In Progress',
      row: { outer: 'container38', inner: 'container39', type: 'text23', clock: 'container47', icon: 'staticImage13', date: 'text70', status: 'text61' }
    },
    {
      name: 'tabPage3', caption: 'Approved', container: 'container123', listView: 'listView7', state: 'Completed',
      row: { outer: 'container40', inner: 'container41', type: 'text24', clock: 'container48', icon: 'staticImage14', date: 'text71', status: 'text62' }
    },
    {
      /* Caption is 'Rejected', matching the RejectedRequests resource on
         DashboardService and the Main.ENUM_State value behind it. The caption
         is also the key ApprovalsCard uses to pick the tab's endpoint. */
      name: 'tabPage4', caption: 'Rejected', container: 'container124', listView: 'listView8', state: 'Rejected',
      row: { outer: 'container42', inner: 'container43', type: 'text25', clock: 'container49', icon: 'staticImage15', date: 'text72', status: 'text63' }
    }
  ]
};

/* --- gs-services-row (static on the page) --------------------------------- */
export const servicePanels = [
  {
    panel: 'svcPanelUsed', modifier: 'gs-services-panel--used',
    titleName: 'svcUsedTitle', listName: 'svcUsedList', title: 'Most Used Services',
    tiles: [
      {
        tile: 'svcUsedTile1', iconName: 'svcUsedIcon1', box: 'container51',
        nameName: 'svcUsedName1', descName: 'svcUsedDesc1',
        icon: 'Main$gs_image$leaverequest.svg', name: 'Leave Request', desc: 'Submit vacation requests'
      },
      {
        tile: 'svcUsedTile2', iconName: 'svcUsedIcon2', box: 'container50',
        nameName: 'svcUsedName2', descName: 'svcUsedDesc2',
        icon: 'Main$gs_image$meetingroom.svg', name: 'Meeting Room Booking', desc: 'Book conference rooms'
      }
    ]
  },
  {
    panel: 'svcPanelOffers', modifier: 'gs-services-panel--offers',
    titleName: 'svcOffersTitle', listName: 'svcOffersList', title: 'Offers',
    tiles: [
      {
        tile: 'svcOffersTile1', iconName: 'svcUsedIcon3', box: 'container52',
        nameName: 'svcOffersName1', descName: 'svcOffersDesc1',
        icon: 'Main$gs_image$leaverequest.svg', name: 'Leave Request', desc: 'Submit vacation requests'
      },
      {
        tile: 'svcOffersTile2', iconName: 'svcUsedIcon4', box: 'container53',
        nameName: 'svcOffersName2', descName: 'svcOffersDesc2',
        icon: 'Main$gs_image$meetingroom.svg', name: 'Meeting Room Booking', desc: 'Book conference rooms'
      }
    ]
  }
];

/* --- gs-celebrations-row: Dashboard.DS_NewSocilaInsightHelper ------------- */
export const celebrations = {
  headTitle: 'Celebrations',
  /* listView4 and listView10 both run Main.DS_GetBirthDays, PageSize 10 */
  avatarCount: 10,
  writeWithAi: 'Write with AI',
  wishPlaceholder: 'Write your personalized message here...',
  /* container149 > the eight gs-celeb-event tiles, in page order */
  events: [
    { container: 'container150', img: 'gsImg12', text: 'text42', label: 'New Born', value: 'Newborn', button: 'actionButton32' },
    { container: 'container157', img: 'gsImg21', text: 'text51', label: 'Graduation', value: 'Graduation', button: 'actionButton33' },
    { container: 'container156', img: 'gsImg20', text: 'text50', label: "Father's Day", value: 'Fathers day', button: 'actionButton34' },
    { container: 'container154', img: 'gsImg18', text: 'text48', label: "Mother's Day", value: 'Mothers day', button: 'actionButton35' },
    { container: 'container155', img: 'gsImg19', text: 'text49', label: 'Farewell', value: 'Farewell', button: 'actionButton36' },
    { container: 'container153', img: 'gsImg17', text: 'text46', label: 'Retirement', value: 'Retirement', button: 'actionButton37' },
    { container: 'container152', img: 'gsImg16', text: 'text45', label: 'Birthday', value: 'Birthday', button: 'actionButton39' },
    { container: 'container151', img: 'gsImg15', text: 'text43', label: 'Wedding Card', value: 'Wedding', button: 'actionButton38' }
  ],
  /* container158 / container159, shown by the Visible expression on dataView1/Event */
  birthdayPresets: [
    { name: 'actionButton40', caption: 'Happy Birthday 🎉' },
    { name: 'actionButton41', caption: 'Cheers to your special day! 🥳' },
    { name: 'actionButton42', caption: 'Have a good one! 🥳' },
    { name: 'actionButton43', caption: 'Wishing joy & success! 🎉' },
    { name: 'actionButton44', caption: 'Happy Birthday! Make it amazing! 🎂' }
  ],
  weddingPresets: [
    { name: 'actionButton21', caption: 'Happy Work Anniversary! 🎉' },
    { name: 'actionButton28', caption: 'Well Deserved! 👏✨' },
    { name: 'actionButton29', caption: 'Congratulations on another milestone! 🥳' },
    { name: 'actionButton30', caption: '✨ Wishing you continued growth and happiness in your career!' },
    { name: 'actionButton31', caption: 'Best Wishes for the Journey Ahead! ✨' }
  ]
};

/* --- Main.SNippet_Engage (static in the snippet) -------------------------- */
export const vivaEngage = {
  title: 'Viva Engage',
  body:
    '“🎒 School Support Benefit\n\n' +
    'At Bahri, we’re committed to supporting our employees and their families. ' +
    'The School Support Benefit is designed to help cover eligible school-related expenses for employees’ children.\n\n' +
    'To learn more about the benefit and how to apply, please refer to the attached guide.” -Haya Aljamil',
  button: 'Head to Community'
};

/* --- organization-section: Dashboard.DS_GetSearchData + static tiles ------ */
export const organization = {
  heading: 'Organization Structure',
  searchPlaceholder: 'Search Employee',
  departments: [
    { container: 'container83', text: 'text31', button: 'actionButton15', label: 'HR Department.' },
    { container: 'container87', text: 'text32', button: 'actionButton16', label: 'Product Department.' },
    { container: 'container88', text: 'text33', button: 'actionButton17', label: 'Design Department.' },
    { container: 'container89', text: 'text34', button: 'actionButton18', label: 'Logistics Department.' }
  ]
};

/* --- b-footer-top (static on the page) ------------------------------------ */
export const footer = {
  socials: [
    { name: 'staticImage2', img: 'Main$Images$social_instagram.svg' },
    { name: 'staticImage3', img: 'Main$Images$social_linkedin.svg' },
    { name: 'staticImage4', img: 'Main$Images$social_youtube.svg' },
    { name: 'staticImage5', img: 'Main$Images$social_tiktok.svg' },
    { name: 'staticImage6', img: 'Main$Images$social_snap.svg' },
    { name: 'staticImage7', img: 'Main$Images$social_bahri.svg' }
  ],
  brand: 'Bahri',
  tagline: 'Global logistics & shipping'
};
