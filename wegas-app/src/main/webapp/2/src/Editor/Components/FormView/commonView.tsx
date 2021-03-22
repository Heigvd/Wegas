import * as React from 'react';
import { css, cx } from 'emotion';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';

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
const borderBottom = css({
  borderBottom: '4px solid',
  marginBottom: '2px',
});
const shortInline = css({
  display: 'inline-block',
  marginRight: '2em',
  verticalAlign: 'bottom',
  maxWidth: '11em',
});
const LAYOUTS = {
  shortInline: shortInline,
  inline: css({
    display: 'inline-block',
    verticalAlign: 'bottom',
  }),
  extraShortInline: css(shortInline, {
    maxWidth: '5em',
  }),
};

export interface CommonView {
  borderTop?: boolean;
  borderBottom?: boolean;
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
    isFeatureEnabled(currentFeatures, view.featureLevel)
  ) {
    return (
      <div
        className={cx(containerStyle, layout, {
          [`${borderTop}`]: Boolean(view.borderTop),
          [`${borderBottom}`]: Boolean(view.borderBottom),
        })}
      >
        {children}
        <div className={errorStyle}>{error}</div>
      </div>
    );
  }
  return null;
}
