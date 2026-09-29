/**
 * Static content for the four employee service request pages.
 *
 * These pages have no published REST operation behind them: the Mendix model
 * fills them from microflows (DS_DigitalCardRequest_2, ACT_GetEmployee,
 * DS_ReplacedByValues, DS_ShowAbsenceBalance, DS_GetAbsenceHistory) and from
 * database retrieves (CorporateAdmin.FoodRequestType, the office-location
 * reference selector), all of which run server-side inside a Mendix session.
 *
 * Everything those datasources supply is captured here so the pages render and
 * behave identically with nothing behind them. The comment above each block
 * names the Mendix datasource it stands in for; the field names are the entity
 * attribute names, so the day a REST service is published each block becomes
 * one fetch rather than a rewrite.
 */

/* --- Main.Employee, as DS_RetriveCurrentEmployee returns it ---------------- */
export const currentEmployee = {
  EmployeeID: 'BH-10427',
  NameinEnglish: 'Ammar Al-Nahdi',
  NameInArabic: 'عمار النهدي',
  Email: 'ammar.alnahdi@bahri.sa',
  PositionTitle: 'Project Manager',
  PostionArabic: 'مدير مشروع',
  Department: 'Fleet Operations',
  Location: 'Riyadh Head Office',
  ExtentionNo: '4182',
  MobileNo: '966551002030',
  TelephoneNo: '966112750000',
  /* The two Arabic fields on the Digital Card page are gated on
     [toLowerCase(EmpCountry) != 'usa' and != 'india'], so the signed-in
     employee's country is what decides whether they appear. They are not on the
     Mendix screen, so the seeded record carries a country that closes that gate;
     the widgets stay on the page, exactly as they still do in the model. */
  EmpCountry: 'India',
  JoinDate: '2019-03-17',
  AbsenceBalance: 18.5,
  JoinDateStr: '17-03-2019'
};

/**
 * Main.RequestsList — one row per request type, read through the page
 * parameter $RequestsList. RequestTitle is what the page header prints;
 * SLA is the number of days ACT_*EstimatedDate adds to today.
 */
export const requestsList = {
  digitalCard: { RequestTitle: 'Digital Card Request', RequestCode: 1007, SLA: 5, prefix: 'DGC' },
  drivers: { RequestTitle: 'Drivers Request', RequestCode: 1012, SLA: 2, prefix: 'DRV' },
  food: { RequestTitle: 'Catering Request', RequestCode: 1014, SLA: 3, prefix: 'FOD' },
  absence: { RequestTitle: 'Annual Leave', RequestCode: 1001, SLA: 3, prefix: 'ABS' }
};

/* --- DigitalCard.ACT_GetEmployee — the "Choose Employee" combobox ---------- */
export const employees = [
  { id: 'emp-1', EmployeeID: 'BH-10318', Name: 'Layla Al-Otaibi', Email: 'layla.alotaibi@bahri.sa', PositionTitle: 'Procurement Analyst', PostionArabic: 'محلل مشتريات', NameInArabic: 'ليلى العتيبي', Department: 'Procurement', Location: 'Riyadh Head Office', ExtentionNo: '4310', MobileNo: '966553114477', TelephoneNo: '966112750112', EmpCountry: 'Saudi Arabia', JoinDate: '2021-01-10' },
  { id: 'emp-2', EmployeeID: 'BH-10925', Name: 'Khalid Al-Harbi', Email: 'khalid.alharbi@bahri.sa', PositionTitle: 'Marine Superintendent', PostionArabic: 'مشرف بحري', NameInArabic: 'خالد الحربي', Department: 'Fleet Operations', Location: 'Jeddah Office', ExtentionNo: '5120', MobileNo: '966556660012', TelephoneNo: '966126900020', EmpCountry: 'Saudi Arabia', JoinDate: '2018-09-02' },
  { id: 'emp-3', EmployeeID: 'BH-11044', Name: 'Sara Al-Qahtani', Email: 'sara.alqahtani@bahri.sa', PositionTitle: 'HR Business Partner', PostionArabic: 'شريك الموارد البشرية', NameInArabic: 'سارة القحطاني', Department: 'Human Resources', Location: 'Riyadh Head Office', ExtentionNo: '4025', MobileNo: '966558889001', TelephoneNo: '966112750044', EmpCountry: 'Saudi Arabia', JoinDate: '2022-06-19' },
  { id: 'emp-4', EmployeeID: 'BH-10761', Name: 'Omar Bin Salem', Email: 'omar.binsalem@bahri.sa', PositionTitle: 'IT Operations Support', PostionArabic: 'دعم عمليات تقنية المعلومات', NameInArabic: 'عمر بن سالم', Department: 'Information Technology', Location: 'Dammam Office', ExtentionNo: '6208', MobileNo: '966554447788', TelephoneNo: '966138300055', EmpCountry: 'Saudi Arabia', JoinDate: '2020-11-23' }
];

/**
 * The office-location reference selector on Drivers and Catering
 * (DriversRequest_City / FoodRequest_City).
 */
export const officeLocations = [
  { id: 'loc-1', caption: 'Riyadh Head Office' },
  { id: 'loc-2', caption: 'Jeddah Office' },
  { id: 'loc-3', caption: 'Dammam Office' },
  { id: 'loc-4', caption: 'Yanbu Terminal' },
  { id: 'loc-5', caption: 'Dubai Branch' }
];

/* --- CorporateAdmin.FoodRequestType, sorted by FoodRequestType asc --------- */
export const foodRequestTypes = [
  { id: 'frt-1', FoodRequestType: 'Breakfast' },
  { id: 'frt-2', FoodRequestType: 'Coffee Break' },
  { id: 'frt-3', FoodRequestType: 'Dinner' },
  { id: 'frt-4', FoodRequestType: 'Lunch' },
  { id: 'frt-5', FoodRequestType: 'Refreshments' }
];

/* --- CorporateAdmin.ENUM_DriverTypes -------------------------------------- */
export const driverTypes = [
  { key: 'Business', caption: 'Business' },
  { key: 'Personal', caption: 'Personal' }
];

/* --- EmployeeSelfServices.DS_ReplacedByValues — the "Replaced by" combobox - */
export const replacedByOptions = [
  { id: 'rb-1', caption: 'Khalid Al-Harbi', personNumber: 'BH-10925' },
  { id: 'rb-2', caption: 'Layla Al-Otaibi', personNumber: 'BH-10318' },
  { id: 'rb-3', caption: 'Sara Al-Qahtani', personNumber: 'BH-11044' },
  { id: 'rb-4', caption: 'Omar Bin Salem', personNumber: 'BH-10761' }
];

/**
 * EmployeeSelfServices.DS_ShowAbsenceBalance — the figures the donut and the
 * two legend rows read. AbsenceBalance is what is left; PlannedLeave is what is
 * already booked.
 */
export const absenceBalance = {
  AbsenceBalance: 18.5,
  PlannedLeave: 4,
  Entitlement: 30
};

/**
 * EmployeeSelfServices.DS_GetAbsenceHistory — EmployeeSelfServices.Item rows.
 * ApprovalStatusCd drives the row's status chip through the same mapping the
 * snippet's dynamic class expression uses.
 */
export const absenceHistory = [
  { id: 'h-1', AbsenceType: 'Annual Leave', Duration: '5', StartDate: '12-05-2026', EndDate: '16-05-2026', ApprovalStatusCd: 'APPROVED', AbsenceStatusCd: 'ORA_APPROVED' },
  { id: 'h-2', AbsenceType: 'Sick Leave', Duration: '2', StartDate: '03-04-2026', EndDate: '04-04-2026', ApprovalStatusCd: 'APPROVED', AbsenceStatusCd: 'ORA_APPROVED' },
  { id: 'h-3', AbsenceType: 'Annual Leave', Duration: '3', StartDate: '18-02-2026', EndDate: '20-02-2026', ApprovalStatusCd: 'AWAITING', AbsenceStatusCd: 'ORA_SUBMITTED' },
  { id: 'h-4', AbsenceType: 'Attendance Confirmation', Duration: '4', StartDate: '09-01-2026', EndDate: '09-01-2026', ApprovalStatusCd: 'APPROVED', AbsenceStatusCd: 'ORA_APPROVED' },
  { id: 'h-5', AbsenceType: 'Unpaid Leave', Duration: '1', StartDate: '22-12-2025', EndDate: '22-12-2025', ApprovalStatusCd: 'DENIED', AbsenceStatusCd: 'ORA_DENIED' },
  { id: 'h-6', AbsenceType: 'Annual Leave', Duration: '7', StartDate: '01-11-2025', EndDate: '07-11-2025', ApprovalStatusCd: 'WITHDRAWN', AbsenceStatusCd: 'ORA_WITHDRAWN' }
];

/* --- Main.Attachments_AttachmentType/TypeofAttachment --------------------- */
export const attachmentTypes = ['Supporting document', 'Approval', 'Medical report', 'Other'];

/**
 * The status chip and its caption, exactly as the snippet's expression builds
 * them: ApprovalStatusCd first, then the withdrawn case on AbsenceStatusCd.
 */
export function absenceStatus(item) {
  if (item.ApprovalStatusCd === 'AWAITING') return { caption: 'Awaiting Approval', className: 'cr-pending' };
  if (item.ApprovalStatusCd === 'DENIED') return { caption: 'Denied', className: 'cr-rejected' };
  if (item.AbsenceStatusCd === 'ORA_WITHDRAWN') return { caption: 'Withdrawn', className: 'cr-rejected' };
  if (item.ApprovalStatusCd === 'APPROVED') return { caption: item.ApprovalStatusCd, className: 'cr-approve' };
  return { caption: item.ApprovalStatusCd, className: 'cr-pending' };
}

/**
 * OCH_DigitalCardEstimatedDate and its siblings put the deadline SLA days out
 * from today. Returned as yyyy-mm-dd, which is what the pickers read.
 */
export function slaDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * The running request number. Mendix's RequsetID is an AutoNumber, so every
 * page opened gets the next one; this keeps the same shape for the reference
 * number the success pop-up prints.
 */
let sequence = 4417;
export function nextRequestId() {
  sequence += 1;
  return sequence;
}
