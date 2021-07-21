import { css, cx } from 'emotion';
import * as React from 'react';
import { Button } from '../../Inputs/Buttons/Button';
import { TranslatableText } from '../HTMLText';
import { expandWidth, flexRow, stretch } from '../../../css/classes';
import { themeVar } from '../../Theme/ThemeVars';

const choiceButtonStyle = css({
  backgroundColor: 'white',
  color: 'black',
  padding: 0,
  overflow: 'hidden',
  margin: '5px',
});

const choiceButtonText = css({
  padding: '5px',
  textAlign: 'left',
  flex: '1 1 auto',
  '&:hover': {
    color: themeVar.colors.LightTextColor,
  }
});

const choiceButtonIcon = css({
  display: 'flex',
  alignContent: 'center',
  justifyContent: 'center',
  backgroundColor: themeVar.colors.ActiveColor,
  padding: '10px',
});

interface DialogueChoiceProps extends DisabledReadonly {
  label: STranslatableContent;
  onClick: () => void;
}

export function DialogueChoice({
  label,
  onClick,
  disabled,
  readOnly,
}: DialogueChoiceProps) {
  return (
    <Button
      onClick={onClick}
      className={cx(flexRow, expandWidth, choiceButtonStyle, stretch)}
      disabled={disabled}
      readOnly={readOnly}
    >

      <TranslatableText className={choiceButtonText} content={label} />
      <div className={choiceButtonIcon}>
        <img src={require('../../../pictures/chat_button.svg').default} />
      </div>
    </Button>
  );
}
