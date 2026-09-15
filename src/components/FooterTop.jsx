import React from 'react';
import { footer } from '../data/dashboardData.js';
import { MxStaticImage } from './MxWidgets.jsx';

/**
 * container14 (Class: 'b-footer-top')
 *   container55 (Class: 'left-f')
 *     container61 (Class: 'sm-top')   -> the six social staticImages
 *     container62 (Class: 'ft-b-txt') -> container90 (logo) + container103 (brand text)
 *   staticImage16                     -> chat-on-whatsapp, direct child of b-footer-top
 */
export default function FooterTop() {
  return (
    <div className="mx-name-container14 b-footer-top">
      <div className="mx-name-container55 left-f">

        <div className="mx-name-container61 sm-top">
          {footer.socials.map((s) => (
            <MxStaticImage key={s.name} name={s.name} src={s.img} />
          ))}
        </div>

        <div className="mx-name-container62 ft-b-txt">
          <div className="mx-name-container90">
            <MxStaticImage name="staticImage8" src="Main$Images$Container__MyBahri.svg" />
          </div>
          <div className="mx-name-container103">
            <span className="mx-text mx-name-text35 bahri-txt">{footer.brand}</span>
            <span className="mx-text mx-name-text36 s-bh-txt">{footer.tagline}</span>
          </div>
        </div>

      </div>

      <MxStaticImage name="staticImage16" src="Main$Images$chat_on_whatsapp.svg" />
    </div>
  );
}
