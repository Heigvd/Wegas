import { css } from '@emotion/css';
import * as React from 'react';
import { TranslatableText } from '../HTMLText';
import { themeVar } from '../../Theme/ThemeVars';

export const choiceContainerStyle = css({
  margin: '1em 0',
  padding: '15px',
  boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.HeaderColor,
  '&.disabled': {
    backgroundColor: themeVar.colors.BackgroundColor,
    opacity: '0.7',
  },
});
export const choiceLabelStyle = css({
  borderBottom: '1px solid ' + themeVar.colors.HeaderColor,
  color: themeVar.colors.DarkTextColor,
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
        <TranslatableText className={choiceLabelStyle} content={label} />
      )}
      {description && (
        <TranslatableText
          className={choiceDescriptionStyle}
          content={description}
        />
      )}
      <div className={choiceInputStyle}>{children}</div>
    </div>
  );
}
