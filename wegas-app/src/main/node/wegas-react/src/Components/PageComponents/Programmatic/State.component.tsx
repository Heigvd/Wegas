import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { setPagesContextState } from '../../../data/Stores/pageContextStore';
import { createScript } from '../../../Helper/wegasEntites';
import { safeClientScriptEval } from '../../Hooks/useScript';
import {
  FlexItem,
  flexlayoutChoices,
  FlexListProps,
  isVertical,
} from '../../Layouts/FlexList';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import { EmptyComponentContainer } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
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
  initialState,
  localState,
}: ChildrenDeserializerProps<StateProps>) {
  const initRef = React.useRef<boolean>(false);
  const exposeAsRef = React.useRef<string>();

  const init = safeClientScriptEval(
    initialState,
    context,
    undefined,
    undefined,
    undefined,
  );

  const [state, setState] = React.useState(init);

  const newContext = React.useMemo(() => {
    if (localState && context) {
      return {
        ...context,
        [exposeAs]: {
          state,
          setState,
        },
      };
    } else {
      return context;
    }
  }, [context, exposeAs, localState, state]);

  React.useEffect(() => {
    if (
      !localState &&
      (initRef.current === false || exposeAsRef.current !== exposeAs)
    ) {
      initRef.current = true;
      exposeAsRef.current = exposeAs;
      setPagesContextState(exposeAs, init);
    }
  }, [exposeAs, init, localState]);

  if (initialState == null || exposeAs == null) {
    return <UncompleteCompMessage pageId={pageId} path={path} />;
  }

  return (
    <>
      {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer Container={FlexItem} path={path} />
      ) : (
        wegasChildren?.map((_c, i) => {
          return (
            <PageDeserializer
              key={
                JSON.stringify([...path, i])
                //JSON.stringify(newContext ? newContext[exposeAs] : 'undefined')
              }
              pageId={pageId}
              path={[...path, i]}
              uneditable={uneditable}
              context={newContext}
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

function State({ children }: StateProps) {
  return <>{children}</>;
}

registerComponent(
  pageComponentFactory({
    component: State,
    componentType: 'Programmatic',
    container: {
      isVertical,
      ChildrenDeserializer: ChildrenDeserializer,
      childrenLayoutOptionSchema: flexlayoutChoices,
    },
    id: 'State',
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
