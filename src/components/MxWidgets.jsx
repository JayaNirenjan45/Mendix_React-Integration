import React from 'react';
import { IMG } from '../data/dashboardData.js';

/**
 * Primitives that emit the exact DOM the Mendix client produces for the
 * widgets used on Main.New_Dashboard / Main.NewLayout. Attribute sets were read
 * straight off the running app, including the ones Mendix adds that are not in
 * the page model (title, data-button-id, data-disabled, role, aria-hidden).
 *
 * Runtime-generated ids (mxui_widget_*, p.Main.New_Dashboard.textBox1_qai_16)
 * are omitted: they differ on every Mendix session and no stylesheet uses them.
 */

/** Mendix client wrapper: <div data-widget-wrapper style="display:contents"> */
export function WidgetWrapper({ mendixId, children }) {
  return (
    <div data-mendix-id={mendixId} data-widget-wrapper="true" className="" style={{ display: 'contents' }}>
      {children}
    </div>
  );
}

/**
 * image widget (image collection entry)
 *   <div class="mx-image-viewer mx-image-viewer-responsive mx-name-<name> <class>">
 *     <img class="" alt="" role="img" src="...">
 */
export function MxImage({ name, className, src }) {
  return (
    <div className={`mx-image-viewer mx-image-viewer-responsive mx-name-${name}${className ? ' ' + className : ''}`}>
      <img className="" alt="" role="img" src={`${IMG}/${src}`} />
    </div>
  );
}

/**
 * Forms$StaticImageViewer
 *   <img class="mx-image mx-name-<name> img-responsive" role="presentation" src="...">
 */
export function MxStaticImage({ name, src }) {
  return (
    <img className={`mx-image mx-name-${name} img-responsive`} role="presentation" src={`${IMG}/${src}`} />
  );
}

/**
 * actionbutton
 *   <button type="button" class="btn mx-button mx-name-<name> <class> btn-<style>"
 *           title="" data-button-id="p.Main.New_Dashboard.<name>" data-disabled="false">
 *     [<span class="mx-icon-lined mx-icon-<glyph>" aria-hidden="true"></span>] [<img alt="" src>] <caption>
 *
 * Mendix always emits a space between the icon slot and the caption, so a
 * caption-only button renders as " View" and an icon-only button as "<span/> ".
 *
 * `title` is the Tooltip property (empty unless set). Any other props, such as
 * ARIA attributes a Mendix snippet adds at runtime, are passed to the <button>.
 */
export function MxButton({ name, className, style = 'default', icon, iconImage, caption = '', page = 'p.Main.New_Dashboard', title = '', onClick, ...rest }) {
  return (
    <button
      type="button"
      className={`btn mx-button mx-name-${name}${className ? ' ' + className : ''} btn-${style}`}
      title={title}
      data-button-id={`${page}.${name}`}
      data-disabled="false"
      onClick={onClick}
      {...rest}
    >
      {icon && <span className={`mx-icon-lined mx-icon-${icon}`} aria-hidden="true" />}
      {iconImage && <img alt="" src={`${IMG}/${iconImage}`} />}
      {' '}
      {caption}
    </button>
  );
}

/**
 * linkbutton
 *   <a class="mx-link mx-name-<name> <class>" href="..." role="link" title=""
 *      target="_blank" data-button-id="..." data-disabled="false">
 *     [<img alt="" src>] [<span class="mx-icon-lined mx-icon-<glyph>" aria-hidden="true"/>] <caption>
 */
export function MxLinkButton({ name, className, href = '#', target, icon, iconImage, caption = '', page = 'p.Main.New_Dashboard', onClick }) {
  return (
    <a
      className={`mx-link mx-name-${name}${className ? ' ' + className : ''}`}
      href={href}
      role="link"
      title=""
      target={target}
      data-button-id={`${page}.${name}`}
      data-disabled="false"
      onClick={onClick}
    >
      {iconImage && <img alt="" src={`${IMG}/${iconImage}`} />}
      {icon && <span className={`mx-icon-lined mx-icon-${icon}`} aria-hidden="true" />}
      {' '}
      {caption}
    </a>
  );
}

/** listview "Load more..." button, emitted when the datasource has more rows than PageSize */
export function MxLoadMore({ onClick }) {
  return (
    <button type="button" className="btn mx-button mx-listview-loadMore" onClick={onClick}>
      <span className="mx-icon-filled mx-icon-repeat" /> Load more...
    </button>
  );
}
