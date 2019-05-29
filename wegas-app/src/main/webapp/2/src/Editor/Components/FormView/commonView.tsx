import * as React from 'react';
import { css, cx } from 'emotion';

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
const LAYOUTS = {
  shortInline: css({
    display: 'inline-block',
    marginRight: '2em',
    verticalAlign: 'top',
    maxWidth: '11em',
  }),
  inline: css({
    display: 'inline-block',
    verticalAlign: 'top',
  }),
};
export interface CommonView {
  borderTop?: boolean;
  layout?: keyof typeof LAYOUTS;
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
  const error = errorMessage && errorMessage.join(', ');
  const layout = view.layout ? LAYOUTS[view.layout] : '';
  return (
    <div
      className={cx(containerStyle, layout, {
        [`${borderTop}`]: Boolean(view.borderTop),
      })}
    >
      {children}
      <div className={errorStyle}>{error}</div>
    </div>
  );
}
