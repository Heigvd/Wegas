import { css, cx } from '@emotion/css';
import produce from 'immer';
import * as React from 'react';
import { IQuestionDescriptor, IWhQuestionDescriptor } from 'wegas-ts-api';
import { Actions } from '../../../data';
import { editingStore } from '../../../data/Stores/editingStore';
import { createTranslatableContent } from '../../../data/i18n';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTML/HTMLEditor';
import { Validate } from '../../Inputs/Validate';
import { themeVar } from '../../Theme/ThemeVars';
import { HTMLText } from '../HTMLText';
import { buttonFactory } from './QuestionList';
import { useTranslate } from '../../Hooks/useTranslate';
import {
  bolder,
  expandWidth,
  flex,
  flexColumn,
  toolboxHeaderStyle,
} from '../../../css/classes';

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

const Edit = buttonFactory('pen');

export function QuestionDescription({
  questionD,
  editMode,
}: QuestionDescriptionProps) {
  const { lang } = React.useContext(languagesCTX);
  const [isEditing, setEditing] = React.useState(false);

  const labelValue = useTranslate(questionD.label);
  const descriptionValue = useTranslate(questionD.description);

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

      editingStore.dispatch(
        Actions.VariableDescriptorActions.updateDescriptor(newQuestion),
      );
      setEditing(false);
    },
    [lang, questionD],
  );

  // return <HTMLEditor value={textValue} onChange={onValidate} />;

  return isEditing && editMode ? (
    <Validate
      value={descriptionValue}
      onValidate={onValidate}
      onCancel={() => setEditing(false)}
      vertical
      validatorClassName={'none'}
    >
      {(value, onChange) => (
        <HTMLEditor
          value={value}
          onChange={onChange}
          toolbarLayout="player"
          // customToolbar="bold italic underline"
        />
      )}
    </Validate>
  ) : (
    <div
      className={cx(descriptionStyle, {
        [clickableDescriptionStyle]: editMode,
      }, 'wegas-question__header')}
      onClick={() => setEditing(true)}
    >
      <div className={cx(toolboxHeaderStyle, expandWidth)}>
        <div className={cx(flex, flexColumn)}>
          {labelValue && (
            <div className={cx(bolder, 'wegas-question__label')}>
              {labelValue}
            </div>
          )}
          <HTMLText
            text={descriptionValue}
            className="wegas-question__description"
          />
        </div>
      </div>

      {editMode && (
        <Edit className={editButtonStyle} onClick={() => setEditing(true)} />
      )}
    </div>
  );
}
