import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { setPagesContextState } from '../../../data/Stores/pageContextStore';
import { createScript } from '../../../Helper/wegasEntites';
import { deepDifferent } from '../../Hooks/storeHookFactory';
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
  localState?: boolean;
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  inheritedOptionsState,
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
              inheritedOptionsState={inheritedOptionsState}
            />
          );
        })
      )}
    </>
  );
}

function State({
  children,
  context,
  exposeAs,
  initialState,
  localState,
}: StateProps) {
  const initRef = React.useRef<unknown>();
  const exposeAsRef = React.useRef<string>();

  const init = safeClientScriptEval(initialState, context);

  const [state, setState] = React.useState(init);

  if (localState && context) {
    context[exposeAs] = {
      state,
      setState,
    };
  }

  React.useEffect(() => {
    if (
      (!localState && deepDifferent(initRef.current, init)) ||
      exposeAsRef.current !== exposeAs
    ) {
      initRef.current = init;
      exposeAsRef.current = exposeAs;
      setPagesContextState(exposeAs, init);
    }
  }, [exposeAs, init, localState]);

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
    illustration: 'state',
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
      localState: schemaProps.boolean({ label: 'Local state', value: false }),
    },
    getComputedPropsFromVariable: () => ({
      initialState: createScript('({})', 'TypeScript'),
      exposeAs: 'state',
      localState: false,
      children: [],
    }),
  }),
);
