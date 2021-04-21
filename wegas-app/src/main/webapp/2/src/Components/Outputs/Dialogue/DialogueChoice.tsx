import { css, cx } from 'emotion';
import * as React from 'react';
import { expandWidth, flexRow, stretch } from '../../../css/classes';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Style/ThemeVars';

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
});

const choiceButtonIcon = css({
  display: 'flex',
  alignContent: 'center',
  justifyContent: 'center',
  backgroundColor: themeVar.Common.colors.ActiveColor,
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
  const translation = useTranslate(label);
  return (
    <Button
      onClick={onClick}
      className={cx(flexRow, expandWidth, choiceButtonStyle, stretch)}
      disabled={disabled}
      readOnly={readOnly}
    >
      <div
        className={choiceButtonText}
        dangerouslySetInnerHTML={{
          __html: translation,
        }}
      ></div>
      <div className={choiceButtonIcon}>
        <img src={require('../../../pictures/chat_button.svg').default} />
      </div>
    </Button>
  );
}
