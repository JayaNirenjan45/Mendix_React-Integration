import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { MxContainer, MxDataView, MxListView, MxText } from '../MxForm.jsx';
import { absenceStatus } from '../../data/serviceData.js';
import { useServiceData } from '../../data/ServiceDataProvider.jsx';

/**
 * EmployeeSelfServices.SNIP_AbsenceReqDetails - the rail beside the Absence
 * form: the balance donut with its figures, and the history list.
 *
 *   dataview  DS_ShowAbsenceBalance   (Class 'absence-1-c')
 *     dynamictext 'Absence Balance'   (H3)
 *     container .ct-p > container .chart-cr > CustomHTMLSnippet(ChartCode)
 *     dataview DS_RetriveCurrentEmployee
 *       container .legend-container > two .legend-item rows
 *   container (Class 'absence-2-c')
 *     dynamictext 'Absence History'   (H3)
 *     listview DS_GetAbsenceHistory > .spread-tb rows
 *
 * `absence-2-c` is `display: none` at rest: gs-svc-clock.js adds a button to
 * the balance card, moves this very node into a dialog when it is pressed and
 * puts it back on close, so the list is never rebuilt. Nothing here has to
 * cooperate with that beyond rendering the two classes it looks for.
 *
 * ChartCode is a whole HTML document built in the microflow and injected by the
 * snippet widget. What it draws is reproduced here with the same Highcharts
 * options - a pie at innerSize 72%, no data labels, no tooltip, the centre
 * title showing the total - and the same legend markup it writes into
 * `#legend`: a bare label text node followed by one coloured span, which is the
 * shape the stylesheet tells the two legends apart by.
 */
export default function AbsenceReqDetails({ startDate, endDate, totalDuration }) {
  /* DS_ShowAbsenceBalance and DS_GetAbsenceHistory, once GET /absence/balance
     and GET /absence/history exist; the seeded figures until then. */
  const { absenceBalance: balanceSet, absenceHistory: historySet } = useServiceData();
  const absenceBalance = balanceSet.data;
  const absenceHistory = historySet.data;

  /*
   * DS_ShowAbsenceBalance, in order:
   *   ProjectedBalance = balance - duration, once both dates are set and valid
   *                      (0 otherwise; and 25 - balance when balance < 25)
   *   TotalBalance     = AbsenceBalance + PlannedLeave
   */
  const { currentBalance, projectedBalance, totalDays } = useMemo(() => {
    const balance = absenceBalance.AbsenceBalance;
    const duration = Number(totalDuration || 0);

    let projected = 0;
    if (startDate && endDate && duration > 0 && startDate <= endDate) {
      projected = Math.max(balance - duration, 0);
    }
    if (projected === 0 && balance < 25) projected = 25 - balance;

    return {
      currentBalance: balance,
      projectedBalance: projected,
      totalDays: balance + absenceBalance.PlannedLeave
    };
  }, [startDate, endDate, totalDuration]);

  const options = useMemo(() => {
    const value = projectedBalance > 0 ? projectedBalance : currentBalance;

    const data =
      projectedBalance >= 25
        ? [{ name: 'Balance', y: totalDays, color: '#ec7237' }]
        : [
            { name: 'Balance', y: value, color: '#ec7237' },
            { name: 'Remaining', y: totalDays - value, color: '#e6eff5' }
          ];

    return {
      chart: { type: 'pie', backgroundColor: null, spacing: [0, 0, 0, 0], height: 300, width: 300 },
      title: {
        text:
          '<div class="chart-center-text">' +
          `<div class="chart-center-value">${totalDays}</div>` +
          '<div class="chart-center-label">Days</div>' +
          '</div>',
        align: 'center',
        verticalAlign: 'middle',
        y: 5,
        useHTML: true
      },
      plotOptions: {
        pie: {
          innerSize: '72%',
          dataLabels: { enabled: false },
          borderWidth: 0,
          states: { hover: { enabled: false }, inactive: { enabled: false } }
        }
      },
      tooltip: { enabled: false },
      series: [{ name: 'Days', data }],
      credits: { enabled: false }
    };
  }, [currentBalance, projectedBalance, totalDays]);

  return (
    <>
      <MxDataView name="dataView1" className="absence-1-c">
        <MxText name="text26" renderMode="h3">
          Absence Balance
        </MxText>

        <MxContainer name="container4" className="ct-p">
          <MxContainer name="container23" className="chart-cr">
            <div className="widget-custom-html-snippet mx-name-customHTMLSnippet1">
              {/*
                ChartCode is a whole HTML document, and CustomHTMLSnippet injects
                its <style> along with its markup - so these rules are part of
                the page in Mendix. Without them the centre figure renders at the
                browser's default size instead of 36px, which is the difference
                between the big "39 Days" Mendix shows and a small one here.
                Copied verbatim from DS_ShowAbsenceBalance.
              */}
              <style>{`
                #container { width: 300px; height: 300px; margin: 0 auto; }
                .highcharts-title { text-align: center !important; }
                .chart-center-text {
                  text-align: center;
                  font-family: Arial, sans-serif;
                  color: #343a40;
                  line-height: 1;
                  width: 100%;
                }
                .chart-center-value { font-size: 36px !important; font-weight: 700 !important; line-height: 1 !important; }
                .chart-center-label { font-size: 20px !important; font-weight: 600 !important; margin-top: 5px; line-height: 1.1 !important; }
                .legend-container { text-align: center; margin-top: -20px; font-family: Arial, sans-serif; }
                .legend-item { font-size: 14px; margin: 5px 0; }
                .green { color: #2ca02c; font-weight: bold; }
                .orange { color: #ec7237; font-weight: bold; }
              `}</style>
              <div id="container">
                <HighchartsReact highcharts={Highcharts} options={options} />
              </div>
              {/* the legend the snippet writes into #legend: label, then one span */}
              <div className="legend-container" id="legend">
                <div className="legend-item">
                  {'Current Balance '}
                  <span className="orange">{currentBalance} Days</span>
                </div>
                <div className="legend-item">
                  {'Projected Balance '}
                  <span className="green">{projectedBalance} Days</span>
                </div>
              </div>
            </div>
          </MxContainer>
        </MxContainer>

        <MxDataView name="dataView2">
          <MxContainer name="container5" className="legend-container">
            <MxContainer name="container7" className="legend-item">
              <MxText name="text1">Actual Remaining</MxText>
              <MxText name="text8" className="green">
                {currentBalance}
              </MxText>
            </MxContainer>
            <MxContainer name="container6" className="legend-item">
              <MxText name="text2">Planned Leave</MxText>
              <MxText name="text9" className="orange">
                {projectedBalance > 0
                  ? Number(totalDuration || 0) + absenceBalance.PlannedLeave
                  : absenceBalance.PlannedLeave}
              </MxText>
            </MxContainer>
          </MxContainer>
        </MxDataView>
      </MxDataView>

      <MxContainer name="container1" className="absence-2-c">
        <MxText name="text3" renderMode="h3">
          Absence History
        </MxText>
        <MxListView
          name="listView1"
          items={absenceHistory}
          keyOf={(item) => item.id}
          renderItem={(item) => {
            const attendance = item.AbsenceType.toLowerCase().includes('attendance confirmation');
            const status = absenceStatus(item);

            return (
              <MxContainer name="container2" className="spread-tb">
                <MxContainer name="container3">
                  <MxText name={attendance ? 'text7' : 'text4'} className="text-large">
                    {attendance
                      ? `${item.AbsenceType} - ${item.Duration} Hours`
                      : `${item.AbsenceType} - ${item.Duration} days`}
                  </MxText>
                  <MxText name="text6" className="text-light">
                    {`${item.StartDate} - ${item.EndDate}`}
                  </MxText>
                </MxContainer>
                <MxText name="text5" className={`cr-status ${status.className}`}>
                  {status.caption}
                </MxText>
              </MxContainer>
            );
          }}
        />
      </MxContainer>
    </>
  );
}
