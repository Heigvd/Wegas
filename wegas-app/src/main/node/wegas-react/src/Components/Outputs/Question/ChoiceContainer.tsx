import { css, cx } from '@emotion/css';
import * as React from 'react';
import { TranslatableText } from '../HTMLText';
import { themeVar } from '../../Theme/ThemeVars';
import { classNameOrEmpty } from '../../../Helper/className';

export const choiceContainerStyle = css({
  margin: '1em 0',
  boxShadow: '2px 2px 6px rgba(0, 0, 0, 0.2)',
  borderRadius: themeVar.dimensions.BorderRadius,
  backgroundColor: themeVar.colors.HeaderColor,
  '&.selected': {
    backgroundColor: themeVar.colors.PrimaryColor,
    color: themeVar.colors.LightTextColor,
  },
  '&.disabled': {
    backgroundColor: themeVar.colors.BackgroundColor,
    opacity: '0.7',
    cursor: 'default',
    pointerEvents: 'none',
    '&:hover': {
      backgroundColor: themeVar.colors.BackgroundColor,
      color: themeVar.colors.DarkTextColor,
    },
    '&.selected': {
      backgroundColor: themeVar.colors.PrimaryColor,
      color: themeVar.colors.LightTextColor,
      '&:hover': {
        backgroundColor: themeVar.colors.PrimaryColor,
      },
    },
  },
});
const choiceContentStyle = css({
  padding: '15px',
})
export const choiceLabelStyle = css({
  fontWeight: 'bold',
});
export const choiceDescriptionStyle = css({
  paddingTop: '5px',
});
export const choiceInputStyle = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '5px',
});

export function ChoiceContainer({
  descriptor,
  active,
  canReply,
  children,
  className,
  inputClassName,
  onClick,
  hasBeenSelected,
}: React.PropsWithChildren<{
  descriptor: {
    label?: ITranslatableContent;
    description?: ITranslatableContent;
  };
  active: boolean;
  canReply: boolean;
  className?: string;
  inputClassName?: string;
  onClick?: ()=>void;
  hasBeenSelected: boolean;
}>) {
  const { description, label } = descriptor;

  if (!active) {
    return null;
  }

  return (
    <div className={cx(choiceContainerStyle,
          classNameOrEmpty(className),)
          + (hasBeenSelected ? ' selected' : '')
          + (canReply ? '' : ' disabled')}
      onClick={onClick}>
      <div className={choiceContentStyle}>
        {label && (
          <TranslatableText className={choiceLabelStyle} content={label} />
        )}
        {description && (
          <TranslatableText
            className={choiceDescriptionStyle}
            content={description}
          />
        )}
      </div>
      <div className={choiceInputStyle + classNameOrEmpty(inputClassName)}>{children}</div>
    </div>
  );
}
