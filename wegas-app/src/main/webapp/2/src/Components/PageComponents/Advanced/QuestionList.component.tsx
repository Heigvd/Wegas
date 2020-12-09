import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { EntityChooser } from '../../EntityChooser';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { safeClientScriptEval } from '../../Hooks/useScript';
import { useStore } from '../../../data/store';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import {
  ConnectedQuestionDisplay,
  QuestionLabel,
} from '../../Outputs/Question';
import {
  IScript,
  IQuestionDescriptor,
  SListDescriptor,
  IWhQuestionDescriptor,
  IQuestionInstance,
  IWhQuestionInstance,
} from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { Player } from '../../../data/selectors';

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: IScript;
}

export default function QuestionListDisplay({
  questionList,
  context,
}: QuestionListDisplayProps) {
  const entities = useStore(() => {
    // TODO add support for arrays of list/question
    const descriptor = safeClientScriptEval<SListDescriptor>(
      questionList,
      context,
    );

    const player = Player.selectCurrent();

    if (descriptor == null || descriptor.getName() == null) {
      return { questions: [], player };
    }
    return {
      questions: flatten<IQuestionDescriptor | IWhQuestionDescriptor>(
        descriptor.getEntity(),
        'QuestionDescriptor',
        'WhQuestionDescriptor',
      ).filter(q => {
        const instance = getInstance<IQuestionInstance | IWhQuestionInstance>(
          q,
        );
        if (instance != null) {
          return instance.active;
        }
        return false;
      }),
      player,
    };
  }, deepDifferent);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  }

  return (
    <EntityChooser
      entities={entities.questions}
      entityLabel={e => <QuestionLabel questionD={e} />}
    >
      {ConnectedQuestionDisplay}
    </EntityChooser>
  );
}

registerComponent(
  pageComponentFactory({
    component: QuestionListDisplay,
    componentType: 'Advanced',
    name: 'QuestionList',
    icon: 'bars',
    schema: {
      questionList: schemaProps.scriptVariable({
        label: 'Question list',
        required: true,
        returnType: [
          'SListDescriptor',
          'SQuestionDescriptor',
          'SListDescriptor[]',
          'SQuestionDescriptor[]',
        ],
      }),
    },
    allowedVariables: ['ListDescriptor', 'QuestionDescriptor'],
    getComputedPropsFromVariable: v => ({
      questionList: createFindVariableScript(v),
      style: {
        overflow: 'auto',
      },
    }),
  }),
);
