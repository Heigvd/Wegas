import { cx } from 'emotion';
import { cloneDeep } from 'lodash-es';
import * as React from 'react';
import {
  IWhQuestionInstance,
  IBooleanInstance,
  INumberInstance,
  INumberDescriptor,
  IStringInstance,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { halfOpacity } from '../../../css/classes';
import { TranslatableContent } from '../../../data/i18n';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import {
  validateQuestion,
  updateInstance,
} from '../../../data/Reducer/VariableInstanceReducer';
import {
  getChoices,
  IWhChoiceDescriptor,
  IWhChoiceInstance,
} from '../../../data/scriptable/impl/QuestionDescriptor';
import { select } from '../../../data/selectors/VariableDescriptorSelector';
import { StoreDispatch } from '../../../data/Stores/store';
import {
  translate,
  createTranslation,
} from '../../../Editor/Components/FormView/translatable';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import HTMLEditor from '../../HTMLEditor';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { autoMargin } from '../../../css/classes';
import {
  ChoiceContainer,
  choiceInputStyle,
} from './ChoiceContainer';
import { questionStyle } from './Question';

interface WhQuestionInfo {
  questionD: Readonly<IWhQuestionDescriptor>;
  questionI: Readonly<IWhQuestionInstance> | undefined;
  choicesD: Readonly<IWhChoiceDescriptor>[];
  choicesI: (Readonly<IWhChoiceInstance> | undefined)[];
}

export function whQuestionInfo(
  question: IWhQuestionDescriptor,
): WhQuestionInfo {
  const questionD = select<IWhQuestionDescriptor>(question.id)!;
  const choicesD = getChoices(question);
  const choicesI = choicesD.map(c => getInstance<IWhChoiceInstance>(c));
  return {
    questionD,
    questionI: getInstance(question),
    choicesD,
    choicesI,
  };
}

interface WhChoiceDisplayProps {
  choiceD: IWhChoiceDescriptor;
  choiceI: IWhChoiceInstance;
  questionI: IWhQuestionInstance;
  onChange: (choiceI: IWhChoiceInstance) => void;
}
function WhChoiceDisplay({
  choiceD,
  choiceI,
  questionI,
  onChange,
}: WhChoiceDisplayProps) {
  const { lang } = React.useContext(languagesCTX);
  return (
    <ChoiceContainer
      active
      descriptor={choiceD}
      canReply={!questionI.validated}
    >
      {choiceD['@class'] === 'BooleanDescriptor' ? (
        <CheckBox
          value={(choiceI as IBooleanInstance).value}
          onChange={v => {
            const newChoiceI = cloneDeep(choiceI as IBooleanInstance);
            newChoiceI.value = v;
            onChange(newChoiceI);
          }}
          disabled={questionI.validated}
        />
      ) : choiceD['@class'] === 'NumberDescriptor' ? (
        <NumberSlider
          value={(choiceI as INumberInstance).value}
          min={
            (choiceD as INumberDescriptor).minValue ||
            Math.min(0, (choiceI as INumberInstance).value)
          }
          max={
            (choiceD as INumberDescriptor).maxValue ||
            Math.max(100, (choiceI as INumberInstance).value)
          }
          onChange={v => {
            const newChoiceI = cloneDeep(choiceI as INumberInstance);
            newChoiceI.value = v;
            onChange(newChoiceI);
          }}
          disabled={questionI.validated}
          displayValues="NumberInput"
        />
      ) : choiceD['@class'] === 'StringDescriptor' ? (
        <SimpleInput
          value={translate((choiceI as IStringInstance).trValue, lang)}
          onChange={v => {
            const newChoiceI = cloneDeep(choiceI as IStringInstance);
            newChoiceI.trValue.translations[lang] = createTranslation(
              lang,
              String(v),
            );
            onChange(newChoiceI);
          }}
          disabled={questionI.validated}
        />
      ) : (
        <HTMLEditor
          value={translate((choiceI as IStringInstance).trValue, lang)}
          onChange={v => {
            const newChoiceI = cloneDeep(choiceI as IStringInstance);
            newChoiceI.trValue.translations[lang] = createTranslation(
              lang,
              String(v),
            );
            onChange(newChoiceI);
          }}
          disabled={questionI.validated}
          inline={false}
        />
      )}
    </ChoiceContainer>
  );
}

interface WhQuestionDisplayProps extends WhQuestionInfo {
  dispatch: StoreDispatch;
  disabled?: boolean;
}

export function WhQuestionDisplay({
  dispatch,
  questionD,
  questionI,
  choicesD,
  choicesI,
  disabled,
}: WhQuestionDisplayProps) {
  const [choicesValues, setChoicesValues] = React.useState<
    (IWhChoiceInstance | undefined)[]
  >(choicesI);

  if (questionI == null || !questionI.active) {
    return null;
  }

  return (
    <div className={cx(questionStyle, {[halfOpacity]: disabled})}>
      <div
        dangerouslySetInnerHTML={{
          __html: questionD.description
            ? TranslatableContent.toString(questionD.description)
            : '',
        }}
      />
      {choicesD.map((choiceD, i) => {
        const choiceI = choicesI[i];
        if (choiceI == null) {
          return <span key={choiceD.id} />;
        }

        return (
          <WhChoiceDisplay
            key={choiceD.id}
            onChange={newChoiceI =>
              setChoicesValues(oldValues => {
                const newValues = oldValues;
                newValues[i] = newChoiceI;
                return newValues;
              })
            }
            questionI={questionI}
            choiceD={choiceD}
            choiceI={choiceI}
          />
        );
      })}
      <div className={cx(choiceInputStyle)}>
        <Button
          className={autoMargin}
          label={questionI.validated ? 'Validated' : 'Validate'}
          onClick={() => {
            dispatch(validateQuestion(questionD));
            choicesValues.forEach(
              choiceI => choiceI != null && dispatch(updateInstance(choiceI)),
            );
          }}
          disabled={questionI.validated}
        />
      </div>
      {/* <RepliesDisplay replies={replies} /> */}
    </div>
  );
}
