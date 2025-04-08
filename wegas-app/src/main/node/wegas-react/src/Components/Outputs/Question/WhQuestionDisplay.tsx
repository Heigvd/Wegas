import { css, cx } from '@emotion/css';
import { cloneDeep } from 'lodash-es';
import * as React from 'react';
import {
  IBooleanInstance,
  INumberDescriptor,
  INumberInstance,
  IStringInstance,
  IWhQuestionDescriptor,
  IWhQuestionInstance,
} from 'wegas-ts-api';
import { autoMargin, halfOpacity } from '../../../css/classes';
import { Actions } from '../../../data';
import { createTranslatableContent, translate } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { State } from '../../../data/Reducer/reducers';
import {
  updateInstance,
  validateQuestion,
} from '../../../data/Reducer/VariableInstanceReducer';
import {
  IWhChoiceDescriptor,
  IWhChoiceInstance,
} from '../../../data/scriptable/impl/QuestionDescriptor';
import { select } from '../../../data/selectors/VariableDescriptorSelector';
import {
  editingStore,
  EditingStoreDispatch,
} from '../../../data/Stores/editingStore';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTML/HTMLEditor';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberInput } from '../../Inputs/Number/NumberInput';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { isActionAllowed } from '../../PageComponents/tools/options';
import { AddMenu } from './AddMenu';
import { ChoiceContainer, choiceInputStyle } from './ChoiceContainer';
import { questionStyle } from './Question';
import { QuestionDescription } from './QuestionDescription';
import { makeMenuFromClass } from './QuestionList';

interface AddChoiceMenuProps {
  questionD: IWhQuestionDescriptor;
}

const choices = ['Text', 'String', 'StaticText', 'Number', 'Boolean'].map(
  makeMenuFromClass,
);

export function AddChoiceMenu({ questionD }: AddChoiceMenuProps) {
  const { lang } = React.useContext(languagesCTX);
  return (
    <AddMenu
      items={choices}
      onSelect={item => {
        editingStore.dispatch(
          Actions.VariableDescriptorActions.createDescriptor(
            {
              '@class': item.value.descriptor,
              label: createTranslatableContent(lang, 'Réponse'),
              defaultInstance: {
                '@class': item.value.instance,
              },
            } as unknown as IVariableDescriptor,
            questionD,
          ),
        );
      }}
    />
  );
}

interface WhQuestionInfo {
  questionD: Readonly<IWhQuestionDescriptor>;
  questionI: Readonly<IWhQuestionInstance> | undefined;
  choicesD: Readonly<IWhChoiceDescriptor>[];
  choicesI: (Readonly<IWhChoiceInstance> | undefined)[];
}

export function whQuestionInfo(question: IWhQuestionDescriptor) {
  return function (s: Readonly<State>): WhQuestionInfo {
    const questionD = select<IWhQuestionDescriptor>(question.id)!;
    const choicesD = questionD.itemsIds
      .map(id => s.variableDescriptors[id])
      .filter(function (
        entity: IWhChoiceDescriptor | undefined,
      ): entity is IWhChoiceDescriptor {
        return entity != null;
      });
    const choicesI = choicesD.map(c => getInstance<IWhChoiceInstance>(c));
    return {
      questionD,
      questionI: getInstance(question),
      choicesD,
      choicesI,
    };
  };
}

interface WhChoiceDisplayProps extends DisabledReadonly {
  choiceD: IWhChoiceDescriptor;
  choiceI: IWhChoiceInstance;
  questionI: IWhQuestionInstance;
  onChange: (choiceI: IWhChoiceInstance) => void;
  editMode?: boolean;
}

function WhChoiceDisplay({
  choiceD,
  choiceI,
  questionI,
  onChange,
  disabled,
  readOnly,
  editMode,
}: WhChoiceDisplayProps) {
  const { lang } = React.useContext(languagesCTX);
  return (
    <ChoiceContainer
      active
      descriptor={choiceD}
      canReply={!questionI.validated && isActionAllowed({ disabled, readOnly })}
      hasBeenSelected={false}
      editMode={editMode}
      validateButton={false}
      className={'wegas-question__choice'}
    >
      <div className={css({ padding: '15px' })}>
        {choiceD['@class'] === 'BooleanDescriptor' ? (
          <CheckBox
            value={(choiceI as IBooleanInstance).value}
            onChange={v => {
              const newChoiceI = cloneDeep(choiceI as IBooleanInstance);
              newChoiceI.value = v;
              onChange(newChoiceI);
            }}
            disabled={questionI.validated || disabled}
            readOnly={readOnly}
          />
        ) : choiceD['@class'] === 'NumberDescriptor' ? (
          <NumberInput
            value={(choiceI as INumberInstance).value}
            min={(choiceD as INumberDescriptor).minValue ?? undefined}
            max={(choiceD as INumberDescriptor).maxValue ?? undefined}
            onChange={v => {
              const newChoiceI = cloneDeep(choiceI as INumberInstance);
              newChoiceI.value = v;
              onChange(newChoiceI);
            }}
            disabled={questionI.validated || disabled}
            readOnly={readOnly}
          />
        ) : choiceD['@class'] === 'StringDescriptor' ? (
          <SimpleInput
            value={translate((choiceI as IStringInstance).trValue, lang)}
            onChange={v => {
              const newChoiceI = cloneDeep(choiceI as IStringInstance);
              newChoiceI.trValue = createTranslatableContent(
                lang,
                String(v),
                newChoiceI.trValue,
              );

              onChange(newChoiceI);
            }}
            disabled={questionI.validated || disabled}
            readOnly={readOnly}
          />
        ) : (
          <HTMLEditor
            value={translate((choiceI as IStringInstance).trValue, lang)}
            onChange={v => {
              const newChoiceI = cloneDeep(choiceI as IStringInstance);
              newChoiceI.trValue = createTranslatableContent(
                lang,
                String(v),
                newChoiceI.trValue,
              );

              onChange(newChoiceI);
            }}
            disabled={questionI.validated || disabled}
            readOnly={readOnly}
          />
        )}
      </div>
    </ChoiceContainer>
  );
}

interface WhQuestionDisplayProps extends WhQuestionInfo, DisabledReadonly {
  dispatch: EditingStoreDispatch;
  editMode?: boolean;
}

export function WhQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  disabled,
  readOnly,
  editMode,
}: WhQuestionDisplayProps) {
  const [choicesValues, setChoicesValues] =
    React.useState<(IWhChoiceInstance | undefined)[]>(choicesI);

  React.useEffect(() => {
    setChoicesValues(choicesI);
  }, [choicesI]);

  if (questionI == null || !questionI.active) {
    return null;
  }

  return (
    <div
      className={cx(questionStyle, {
        [halfOpacity]: disabled,
      })}
    >
      <QuestionDescription questionD={questionD} editMode={editMode} />
      {choicesD.map((choiceD, i) => {
        // const choiceI = choicesI[i];
        const choiceI = choicesValues[i];
        if (choiceI == null) {
          return <span key={choiceD.id} />;
        }

        return (
          <WhChoiceDisplay
            key={choiceD.id}
            onChange={newChoiceI =>
              setChoicesValues(oldValues => {
                const newValues = cloneDeep(oldValues);
                newValues[i] = newChoiceI;
                return newValues;
              })
            }
            questionI={questionI}
            choiceD={choiceD}
            choiceI={choiceI}
            disabled={disabled}
            readOnly={readOnly}
            editMode={editMode}
          />
        );
      })}
      {editMode && <AddChoiceMenu questionD={questionD} />}
      <div className={cx(choiceInputStyle, 'wegas-question__choice-button')}>
        <Button
          className={autoMargin}
          label={questionI.validated ? 'Validated' : 'Validate'}
          onClick={() => {
            dispatch(validateQuestion(questionD));
            choicesValues.forEach(
              choiceI => choiceI && dispatch(updateInstance(choiceI)),
            );
          }}
          disabled={questionI.validated || disabled}
          readOnly={readOnly}
        />
      </div>
      {/* <RepliesDisplay replies={replies} /> */}
    </div>
  );
}
