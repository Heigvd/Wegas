import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { flex, flexRow, itemCenter } from '../../../css/classes';
import { classNameOrEmpty } from '../../../Helper/className';

const containerStyle = css({
  position: 'relative',
  width: '100%',
});
const marginTopStyle = css({
  marginTop: '10px',
});
const marginBottomStyle = css({
  marginBottom: '5px',
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

const inline = css({
  display: 'inline-block',
  verticalAlign: 'bottom',
  width: 'unset',
  marginRight: '1em',
});

const shortInline = css({
  display: 'inline-block',
  marginRight: '1em',
  verticalAlign: 'bottom',
  maxWidth: '11em',
});

const longInline = css({
  display: 'inline-block',
  marginRight: '1em',
  verticalAlign: 'bottom',
  minWidth: '11em',
  maxWidth: '21em',
});

const fullWidth = css({
  minWidth: '25em',
  flexGrow: 1,
});

export const LAYOUTS: { [key in SchemaLayout]: string } = {
  shortInline: shortInline,
  inline: inline,
  extraShortInline: css(shortInline, {
    maxWidth: '5em',
  }),
  longInline: longInline,
  flexInline: cx(flex, flexRow, itemCenter),
  fullWidth: fullWidth,
};

export type LayoutType = keyof typeof LAYOUTS;

export interface CommonView {
  borderTop?: boolean;
  borderBottom?: boolean;
  layout?: LayoutType;
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
        className={cx(
          containerStyle,
          layout,
          marginBottomStyle,
          classNameOrEmpty(className),
          {
            [`${borderTop}`]: Boolean(view.borderTop),
            [`${borderBottom}`]: Boolean(view.borderBottom),
            [marginTopStyle]: !view.noMarginTop,
          },
        )}
      >
        {children}
        <div className={errorStyle}>{error}</div>
      </div>
    );
  }
  return null;
}
