import { css, cx } from '@emotion/css';
import produce from 'immer';
import * as React from 'react';
import { IQuestionDescriptor, IWhQuestionDescriptor } from 'wegas-ts-api';
import { Actions } from '../../../data';
import { TranslatableContent } from '../../../data/i18n';
import { store } from '../../../data/Stores/store';
import { createTranslatableContent } from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTML/HTMLEditor';
import { Validate } from '../../Inputs/Validate';
import { themeVar } from '../../Theme/ThemeVars';
import { HTMLText } from '../HTMLText';
import { buttonFactory } from './QuestionList';

const descriptionStyle = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

const clickableDescriptionStyle = css({
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.colors.HoverColor,
  },
});

const editButtonStyle = css({
  position: 'absolute',
  right: '-35px',
  border: 'solid 2px black',
  borderRadius: '50%',
});

interface QuestionDescriptionProps {
  questionD: IQuestionDescriptor | IWhQuestionDescriptor;
  editMode?: boolean;
}

export function QuestionDescription({
  questionD,
  editMode,
}: QuestionDescriptionProps) {
  const { lang } = React.useContext(languagesCTX);
  const [isEditing, setEditing] = React.useState(false);

  const textValue = TranslatableContent.toString(questionD.description);

  const onValidate = React.useCallback(
    (value: string) => {
      const newQuestion = produce(
        (question: IQuestionDescriptor | IWhQuestionDescriptor) => {
          question.description = createTranslatableContent(
            lang,
            value,
            question.description,
          );
        },
      )(questionD);

      store.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newQuestion),
      );
      setEditing(false);
    },
    [lang, questionD],
  );

  const Edit = buttonFactory('pen');

  return isEditing && editMode ? (
    <Validate
      value={textValue}
      onValidate={onValidate}
      onCancel={() => setEditing(false)}
      vertical
      validatorClassName={'none'}
    >
      {(value, onChange) => <HTMLEditor value={value} onChange={onChange} />}
    </Validate>
  ) : (
    <div
      className={cx(descriptionStyle, {
        [clickableDescriptionStyle]: editMode,
      })}
      onClick={() => setEditing(true)}
    >
      <HTMLText text={textValue} />
      {editMode && (
        <Edit className={editButtonStyle} onClick={() => setEditing(true)} />
      )}
    </div>
  );
}
