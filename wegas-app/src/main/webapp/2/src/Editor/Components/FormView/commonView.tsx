import * as React from 'react';
import { css } from 'glamor';
import * as className from 'classnames';

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
    maxWidth: '11em',
  }),
};
export type CommonView = {
  borderTop?: boolean;
  layout?: keyof typeof LAYOUTS;
};
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
  const layout = view.layout ? String(LAYOUTS[view.layout]) : '';
  return (
    <div
      {...containerStyle}
      className={className({
        [`${borderTop}`]: view.borderTop,
        [`${layout}`]: Boolean(layout),
      })}
    >
      {children}
      <div {...errorStyle}>{error}</div>
    </div>
  );
}
