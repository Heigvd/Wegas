import { css } from 'emotion';
import * as React from 'react';
import { TranslatableContent } from '../../../data/i18n';
import { themeVar } from '../../Style/ThemeVars';

export const choiceContainerStyle = css({
  margin: '1em 2em',
  boxShadow: '0 0 5px grey',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  '&.disabled': {
    backgroundColor: themeVar.Common.colors.DisabledColor,
  },
});
export const choiceLabelStyle = css({
  borderBottom: '1px solid',
  color: themeVar.Common.colors.TextColor,
  padding: '5px',
});
export const choiceDescriptionStyle = css({
  padding: '5px',
});
export const choiceInputStyle = css({
  display: 'flex',
  justifyContent: 'center',
  padding: '10px',
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
