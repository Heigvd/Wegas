import * as React from 'react';
import { css, cx } from 'emotion';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';
import { flex, flexRow, itemCenter } from '../../../css/classes';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { classNameOrEmpty } from '../../../Helper/className';

const containerStyle = css({
  position: 'relative',
});
const marginTopStyle = css({
  marginTop: '9px',
});
const errorStyle = css({
  color: themeVar.colors.WarningColor,
  fontSize: '75%',
  fontStyle: 'italic',
});
export const borderTop = css({
  borderTop: '1px solid ' + themeVar.colors.DisabledColor,
  paddingTop: '10px',
});
export const borderBottom = css({
  borderBottom: '1px solid ' + themeVar.colors.DisabledColor,
  paddingBottom: '5px',
  marginBottom: '5px',
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
  flexInline: cx(flex, flexRow, itemCenter),
};

export interface CommonView {
  borderTop?: boolean;
  borderBottom?: boolean;
  layout?: keyof typeof LAYOUTS;
  index?: number;
  readOnly?: boolean;
  featureLevel?: FeatureLevel;
  noMarginTop?: boolean;
}
interface CommonViewProps {
  children: React.ReactNode;
  errorMessage?: string[];
  view: CommonView;
  className?: string;
}
/**
 * Handle errorMessage, layout.
 * @param param0 Props
 */
export function CommonViewContainer({
  children,
  errorMessage,
  view,
  className,
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
        className={cx(containerStyle, layout, classNameOrEmpty(className), {
          [`${borderTop}`]: Boolean(view.borderTop),
          [`${borderBottom}`]: Boolean(view.borderBottom),
          [marginTopStyle]: !view.noMarginTop,
        })}
      >
        {children}
        <div className={errorStyle}>{error}</div>
      </div>
    );
  }
  return null;
}
