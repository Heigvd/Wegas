import { css } from 'emotion';
import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { themeVar } from '../../Style/ThemeVars';

export const choiceContainerStyle = css({
  margin: '1em 0',
  padding: '15px',
  boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  backgroundColor: themeVar.Common.colors.HeaderColor,
  '&.disabled': {
    backgroundColor: themeVar.Common.colors.BackgroundColor,
    opacity: '0.7',
  },
});
export const choiceLabelStyle = css({
  borderBottom: '1px solid ' + themeVar.Common.colors.HeaderColor,
  color: themeVar.Common.colors.DarkTextColor,
  fontWeight: 'bold',
});
export const choiceDescriptionStyle = css({
  paddingTop: '5px',
});
export const choiceInputStyle = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  paddingTop: '5px',
});

export function ChoiceContainer({
  descriptor,
  active,
  canReply,
  children,
}: React.PropsWithChildren<{
  descriptor: {
    label?: ITranslatableContent;
    description?: ITranslatableContent;
  };
  active: boolean;
  canReply: boolean;
}>) {
  const { description, label } = descriptor;

  if (!active) {
    return null;
  }

  return (
    <div className={choiceContainerStyle + (canReply ? '' : ' disabled')}>
      {label && (
        <div className={choiceLabelStyle}>
          {TranslatableContent.toString(label)}
        </div>
      )}
      {description && (
        <div
          className={choiceDescriptionStyle}
          dangerouslySetInnerHTML={{
            __html: TranslatableContent.toString(description),
          }}
        />
      )}
      <div className={choiceInputStyle}>{children}</div>
    </div>
  );
}
