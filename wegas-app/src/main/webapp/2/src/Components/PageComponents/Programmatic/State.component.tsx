import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { setPagesContextState } from '../../../data/Stores/pageContextStore';
import { createScript } from '../../../Helper/wegasEntites';
import { wlog } from '../../../Helper/wegaslog';
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
  const initRef = React.useRef<unknown>();
  const exposeAsRef = React.useRef<string>();

  const init = safeClientScriptEval(initialState, context);

  React.useEffect(() => {
    if (
      deepDifferent(initRef.current, init) ||
      exposeAsRef.current !== exposeAs
    ) {
      initRef.current = init;
      exposeAsRef.current = exposeAs;
      wlog('setSTATE');
      setPagesContextState(exposeAs, init);
    }
  }, [exposeAs, init]);

  return <>{children}</>;
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
