import { css, cx } from 'emotion';
import * as React from 'react';
import { flexRow } from '../../../css/classes';
import { useTranslate } from '../../../Editor/Components/FormView/translatable';
import { Button } from '../../Inputs/Buttons/Button';
import { themeVar } from '../../Style/ThemeVars';

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
      className={cx(flexRow, choiceButtonStyle)}
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
