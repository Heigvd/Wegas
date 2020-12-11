import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { createScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval } from '../../Hooks/useScript';
import {
  FlexListProps,
  isVertical,
  flexlayoutChoices,
  FlexItem,
} from '../../Layouts/FlexList';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

interface StateProps extends WegasComponentProps, FlexListProps {
  exposeAs: string;
  initialState: IScript;
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  containerPropsKeys,
  exposeAs,
}: ChildrenDeserializerProps<StateProps>) {
  return (
    <>
      {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer Container={FlexItem} path={path} />
      ) : (
        wegasChildren?.map((_c, i) => {
          return (
            <PageDeserializer
              key={
                JSON.stringify([...path, i]) +
                JSON.stringify(context ? context[exposeAs] : 'undefined')
              }
              pageId={pageId}
              path={[...path, i]}
              uneditable={uneditable}
              context={context}
              Container={FlexItem}
              containerPropsKeys={containerPropsKeys}
              dropzones={{
                side: true,
              }}
            />
          );
        })
      )}
    </>
  );
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
      ChildrenDeserializer: ChildrenDeserializer,
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
