import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { EntityChooser } from '../../EntityChooser';
import { TranslatableContent } from '../../../data/i18n';
import { isUnread } from '../../../data/scriptable/impl/QuestionDescriptor';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import { flatten } from '../../../data/selectors/VariableDescriptorSelector';
import { cx, css } from 'emotion';
import { flex, itemCenter } from '../../../css/classes';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { safeClientScriptEval } from '../../Hooks/useScript';
import { useStore } from '../../../data/store';
import { shallowDifferent } from '../../Hooks/storeHookFactory';
import { ConnectedQuestionDisplay } from '../../Outputs/Question';
import { IScript, IQuestionDescriptor, SListDescriptor } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';

const unreadSignalStyle = css({ margin: '3px' });

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: IScript;
}

export default function QuestionListDisplay({
  questionList,
}: QuestionListDisplayProps) {
  const entities = useStore(() => {
    // TODO add support for arrays of list/question
    const descriptor = safeClientScriptEval<SListDescriptor>(questionList);

    if (descriptor == null || descriptor.getName() == null) {
      return [];
    }
    return flatten<IQuestionDescriptor>(
      descriptor.getEntity(),
      'QuestionDescriptor',
    ).filter(q => {
      const instance = getInstance(q);
      if (instance != null) {
        return instance.active;
      }
      return false;
    });
  }, shallowDifferent);

  if (questionList === undefined) {
    return <pre>No selected list</pre>;
  }

  return (
    <EntityChooser
      entities={entities}
      entityLabel={e => {
        return (
          <div className={cx(flex, itemCenter)}>
            <div className={flex}>{TranslatableContent.toString(e.label)}</div>
            {isUnread(e)() && (
              <FontAwesome className={unreadSignalStyle} icon="exclamation" />
            )}
          </div>
        );
      }}
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
