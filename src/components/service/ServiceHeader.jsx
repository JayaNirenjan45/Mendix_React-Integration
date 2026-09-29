import React from 'react';
import { MxContainer, MxText } from '../MxForm.jsx';
import { IMG } from '../../data/dashboardData.js';

/**
 * The page head the four request pages share.
 *
 * All four build it the same way, inside a data view on $RequestsList so the
 * title is that row's RequestTitle:
 *
 *   container (Class: 'pageheader gs-svc-head')
 *     container (Class: 'd-flex align-items-center common-mini_header')
 *       dynamictext  RequestTitle            (RenderMode H2, Class 'font-bold')
 *       dynamictext  <the page's subtitle>   (Class 'gs-svc-head-sub')
 *       container    (Class: 'employee-circle')  -> the request type's image
 *     container (Class: 'gs-svc-chip')  'New request'   when NOT IsDraftRecord
 *     container (Class: 'gs-svc-chip')  'Draft'         when     IsDraftRecord
 *
 * The 52px gradient tile at the left is the stylesheet's `.gs-svc-head::before`,
 * which takes its glyph from the page class (gs-svc-idcard / -car / -food /
 * -calendar), so nothing is rendered for it here.
 *
 * `employee-circle` holds two image viewers in the model - one per theme, only
 * one of which is visible at a time. The cyan theme is the one this app runs,
 * so its image is the one rendered.
 */
export default function ServiceHeader({
  names,
  title,
  subtitle,
  icon,
  isDraft
}) {
  return (
    <MxContainer
      name={names.head}
      className="pageheader gs-svc-head spacing-outer-bottom-small spacing-outer-top-small"
    >
      <MxContainer
        name={names.inner}
        className="d-flex align-items-center common-mini_header spacing-outer-bottom-small"
      >
        <MxText name={names.title} renderMode="h2" className="font-bold">
          {title}
        </MxText>
        <MxText name={names.sub} className="gs-svc-head-sub">
          {subtitle}
        </MxText>
        <MxContainer name={names.circle} className="employee-circle spacing-outer-left-large">
          <div className="mx-image-viewer mx-image-viewer-responsive mx-name-dynamicImage3">
            <img className="" alt="" role="img" src={`${IMG}/${icon}`} />
          </div>
        </MxContainer>
      </MxContainer>

      {!isDraft && (
        <MxContainer name={names.chip} className="gs-svc-chip">
          <MxText name={names.chipText}>New request</MxText>
        </MxContainer>
      )}
      {isDraft && (
        <MxContainer name={names.chipDraft} className="gs-svc-chip">
          <MxText name={names.chipDraftText}>Draft</MxText>
        </MxContainer>
      )}
    </MxContainer>
  );
}
