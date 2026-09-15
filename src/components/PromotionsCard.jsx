import React from 'react';
import { promotions } from '../data/dashboardData.js';
import { MxStaticImage, MxButton } from './MxWidgets.jsx';

/** container76 (Class: 'black-card') */
export default function PromotionsCard() {
  return (
    <div className="mx-name-container76 black-card">
      <MxStaticImage name="staticImage1" src="Main$gs_image$promotions_img.svg" />
      <div className="mx-name-container3">
        <div className="mx-name-container4">
          <span className="mx-text mx-name-text1">{promotions.title}</span>
        </div>
        <span className="mx-text mx-name-text2">{promotions.body}</span>
      </div>
      <MxButton name="actionButton1" caption={promotions.button} />
    </div>
  );
}
