import * as React from 'react';
import { css, cx } from 'emotion';
import { featuresCTX } from '../../../Components/FeatureProvider';

const containerStyle = css({
  position: 'relative',
  marginTop: '0.8em',
});
const errorStyle = css({
  color: 'darkorange',
  fontSize: '75%',
  fontStyle: 'italic',
});
const borderTop = css({
  borderTop: '4px solid',
  paddingTop: '2px',
});
const shortInline = css({
  display: 'inline-block',
  marginRight: '2em',
  verticalAlign: 'top',
  maxWidth: '11em',
});
const LAYOUTS = {
  shortInline: shortInline,
  inline: css({
    display: 'inline-block',
    verticalAlign: 'top',
  }),
  extraShortInline: css(shortInline, {
    maxWidth: '5em',
  }),
};

export type FeatureLevel = 'ADVANCED' | 'INTERNAL' | 'DEFAULT';

export interface CommonView {
  borderTop?: boolean;
  layout?: keyof typeof LAYOUTS;
  index?: number;
  readOnly?: boolean;
  featureLevel?: FeatureLevel;
}
interface CommonViewProps {
  children: React.ReactNode;
  errorMessage?: string[];
  view: CommonView;
}
/**
 * Handle errorMessage, layout.
 * @param param0 Props
 */
export function CommonViewContainer({
  children,
  errorMessage,
  view,
}: CommonViewProps) {
  const { currentFeatures } = React.useContext(featuresCTX);
  const error = errorMessage && errorMessage.join(', ');
  const layout = view.layout ? LAYOUTS[view.layout] : '';

  if (
    view.featureLevel === undefined ||
    currentFeatures.includes(view.featureLevel)
  ) {
    return (
      <div
        className={cx(containerStyle, layout, {
          [`${borderTop}`]: Boolean(view.borderTop),
        })}
      >
        {/* <span>Index: {view.index}: </span> */}
        {children}
        <div className={errorStyle}>{error}</div>
      </div>
    );
  }
  return null;
}
