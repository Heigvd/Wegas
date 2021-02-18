import { css, cx } from 'emotion';
import * as React from 'react';
import { flexRow } from '../../../css/classes';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Style/ThemeVars';
import { TranslatableText } from '../Text';

const choiceButtonStyle = css({
  backgroundColor: 'white',
  color: 'black',
  width: 'fit-content',
  padding: 0,
  overflow: 'hidden',
  margin: '5px',
});

const choiceButtonText = css({
  padding: '5px',
});

const choiceButtonIcon = css({
  display: 'flex',
  alignContent: 'center',
  justifyContent: 'center',
  backgroundColor: themeVar.Common.colors.ActiveColor,
  padding: '10px',
  height: '100%',
});

export function DialogueChoice({
  label,
  onClick,
}: {
  label: STranslatableContent;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} className={cx(flexRow, choiceButtonStyle)}>
      <TranslatableText className={choiceButtonText} content={label} />
      <div className={choiceButtonIcon}>
        <img src={require('../../../pictures/chat_button.svg').default} />
      </div>
    </Button>
  );
}
