import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { ConnectedQuestionDisplay } from '../../AutoImport/Question/List';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useComponentScript } from '../../Hooks/useComponentScript';
import { EntityChooser } from '../../EntityChooser';
import { TranslatableContent } from '../../../data/i18n';
import { isUnread } from '../../../data/proxyfy/methods/QuestionDescriptor';
import { getInstance } from '../../../data/methods/VariableDescriptorMethods';
import {
  flatten,
  findByName,
} from '../../../data/selectors/VariableDescriptorSelector';
import { cx, css } from 'emotion';
import { flex, itemCenter } from '../../../css/classes';
import { FontAwesome } from '../../../Editor/Components/Views/FontAwesome';
import { useScript, safeClientScriptEval } from '../../Hooks/useScript';
import { useStore } from '../../../data/store';
import { VariableDescriptor } from '../../../data/selectors';

const unreadSignalStyle = css({ margin: '3px' });

interface QuestionListDisplayProps extends WegasComponentProps {
  questionList?: IScript;
}

function QuestionListDisplay({ questionList }: QuestionListDisplayProps) {
  // const { content, descriptor } = useComponentScript<ISListDescriptor>(
  //   questionList,
  // );

  const entities = useStore(s => {
    const descriptor = safeClientScriptEval<ISListDescriptor>(
      questionList ? questionList.content : '',
    );

    if (descriptor == null || descriptor.name == null) {
      return [];
    }

    const unproxifiedDescriptor = findByName<IListDescriptor>(descriptor.name);

    return flatten<IQuestionDescriptor>(
      unproxifiedDescriptor,
      'QuestionDescriptor',
    ).filter(q => {
      const instance = getInstance(q);
      if (instance != null) {
        return instance.active;
      }
      return false;
    });
  });

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
  pageComponentFactory(
    QuestionListDisplay,
    'QuestionList',
    'bars',
    {
      questionList: schemaProps.scriptVariable('Question list', true, [
        'ISListDescriptor',
      ]),
    },
    ['string'],
    () => ({}),
  ),
);
