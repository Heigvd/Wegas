import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { createScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval } from '../../Hooks/useScript';
import {
  FlexListProps,
  isVertical,
  flexlayoutChoices,
} from '../../Layouts/FlexList';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface StateProps extends WegasComponentProps, FlexListProps {
  exposeAs: string;
  initialState: IScript;
}

function State({ children, context, exposeAs, initialState }: StateProps) {
  const init = safeClientScriptEval(initialState, context);
  const [state, setState] = React.useState(init);

  if (context) {
    context[exposeAs] = {
      state,
      setState,
    };
  }

  return (
    <React.Fragment key={JSON.stringify(state)}>{children}</React.Fragment>
  );
}

registerComponent(
  pageComponentFactory({
    component: State,
    componentType: 'Programmatic',
    container: {
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(),
      childrenSchema: flexlayoutChoices,
    },
    name: 'State',
    icon: 'code',
    schema: {
      initialState: schemaProps.customScript({
        label: 'Initial state',
        returnType: ['object'],
        value: '({})',
        language: 'TypeScript',
      }),
      exposeAs: schemaProps.string({
        label: 'Expose as',
        required: true,
        value: 'state',
      }),
    },
    getComputedPropsFromVariable: () => ({
      initialState: createScript('({})', 'TypeScript'),
      exposeAs: 'state',
      children: [],
    }),
  }),
);
