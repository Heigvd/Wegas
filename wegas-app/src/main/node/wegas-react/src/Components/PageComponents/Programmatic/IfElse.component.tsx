import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { store } from '../../../data/Stores/store';
import {
  computeProps,
  createComponent,
  moveComponent,
  pageCTX,
  patchPage,
} from '../../../Editor/Components/Page/PageEditor';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { useScript } from '../../Hooks/useScript';
import { Button } from '../../Inputs/Buttons/Button';
import { defaultFlexLayoutOptionsKeys, FlexItem } from '../../Layouts/FlexList';
import { UncompleteCompMessage } from '../../UncompleteCompMessage';
import { emptyLayoutItemStyle } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
  usePageComponentStore,
} from '../tools/componentFactory';
import {
  ComponentDropZone,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { schemaProps } from '../tools/schemaProps';

function IfElse({ children }: IfElseProps) {
  return <>{children}</>;
}

function PlayerIf({ children }: IfElseProps) {
  return <>{children}</>;
}
const PlayerIfName = 'PlayerIf';

function PlayerElse({ children }: WegasComponentProps) {
  return <>{children}</>;
}
const PlayerElseName = 'PlayerElse';

registerComponent(
  pageComponentFactory({
    component: PlayerIf,
    componentType: 'Utility',
    container: {},
    name: PlayerIfName,
    icon: 'code',
    illustration: 'ifElse',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowChildren: wegasComponent =>
        wegasComponent.props.children == null ||
        wegasComponent.props.children.length === 0,
      allowEdit: () => false,
    },
  }),
);

registerComponent(
  pageComponentFactory({
    component: PlayerElse,
    componentType: 'Utility',
    container: {},
    name: PlayerElseName,
    icon: 'code',
    illustration: 'ifElse',
    schema: {},
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      allowDelete: () => false,
      allowMove: () => false,
      allowChildren: wegasComponent =>
        wegasComponent.props.children == null ||
        wegasComponent.props.children.length === 0,
      allowEdit: () => false,
    },
  }),
);

interface EmptyCompoentContainerProps {
  path: number[];
  condition: 'IF' | 'ELSE';
}

export function EmptyComponentContainer({
  path,
  condition,
}: EmptyCompoentContainerProps) {
  // const { isOver, ref } = useDndComponentIsOverFactory();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <FlexItem /*ref={ref}*/ className={emptyLayoutItemStyle}>
      <ComponentDropZone
        onDrop={dndComponent => {
          onDrop(
            dndComponent,
            [...path, condition === 'IF' ? 0 : 1],
            0,
            undefined,
            true,
          );
        }}
        show
        noFocus
        dropPosition="INTO"
      />
      {condition === 'IF'
        ? 'Drop the component to display when the condition is true'
        : 'Drop the component to display when the condition is false'}
    </FlexItem>
  );
}

function RepearIfElse({
  wegasChildren,
  pageId,
  path,
}: {
  wegasChildren: WegasComponent[] | undefined;
  pageId: string;
  path: number[];
}) {
  const components = usePageComponentStore(s => s);
  const pages = store.getState().pages;
  const currentPage = pages[pageId!];

  const repearFN = React.useCallback(() => {
    let newComponent: WegasComponent = currentPage;
    if (wegasChildren == null || wegasChildren[0] == null) {
      newComponent =
        createComponent(
          currentPage,
          path,
          PlayerIfName,
          computeProps(components[PlayerIfName], undefined, undefined),
          0,
        )?.newPage || newComponent;
    } else if (wegasChildren[0].type !== PlayerIfName) {
      newComponent =
        createComponent(
          newComponent,
          path,
          PlayerIfName,
          computeProps(components[PlayerIfName], undefined, undefined),
          0,
        )?.newPage || newComponent;

      newComponent =
        moveComponent(
          pageId!,
          pageId!,
          newComponent,
          newComponent,
          [...path, 1],
          [...path, 0],
          0,
        )?.newDestPage || newComponent;
    }

    if (wegasChildren == null || wegasChildren[1] == null) {
      newComponent =
        createComponent(
          newComponent,
          path,
          PlayerElseName,
          computeProps(components[PlayerIfName], undefined, undefined),
          1,
        )?.newPage || newComponent;
    } else if (wegasChildren[1].type !== PlayerElseName) {
      newComponent =
        createComponent(
          newComponent,
          path,
          PlayerElseName,
          computeProps(components[PlayerElseName], undefined, undefined),
          1,
        )?.newPage || newComponent;

      newComponent =
        moveComponent(
          pageId!,
          pageId!,
          newComponent,
          newComponent,
          [...path, 2],
          [...path, 1],
          1,
        )?.newDestPage || newComponent;
    }

    patchPage(pageId, newComponent);
  }, [components, currentPage, pageId, path, wegasChildren]);
  return <Button label="Repear" onClick={repearFN} />;
}

function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  editMode,
  inheritedOptionsState,
  ifCondition,
}: ChildrenDeserializerProps<IfElseProps>) {
  const { obsoleteComponent } = useInternalTranslate(pagesTranslations);

  const condition = useScript<boolean>(ifCondition, context);

  if (
    wegasChildren == null ||
    wegasChildren[0] == null ||
    wegasChildren[1] == null ||
    wegasChildren[0].type !== PlayerIfName ||
    wegasChildren[1].type !== PlayerElseName
  ) {
    if (API_VIEW === 'Editor') {
      return (
        <RepearIfElse
          pageId={pageId!}
          path={path}
          wegasChildren={wegasChildren}
        />
      );
    } else {
      return <pre>{obsoleteComponent}</pre>;
    }
  } else {
    const children1 = wegasChildren[0].props.children![0];
    const children2 = wegasChildren[1].props.children![0];

    if (condition == null) {
      return <UncompleteCompMessage pageId={pageId} path={path} />;
    } else if (editMode) {
      return (
        <>
          {children1 == null ? (
            <EmptyComponentContainer path={path} condition="IF" />
          ) : (
            <PageDeserializer
              key={JSON.stringify([...path, 0, 0]) + JSON.stringify(context)}
              pageId={pageId}
              path={[...path, 0, 0]}
              uneditable={uneditable}
              context={context}
              Container={FlexItem}
              containerPropsKeys={defaultFlexLayoutOptionsKeys}
              dropzones={{}}
              inheritedOptionsState={inheritedOptionsState}
            />
          )}
          {children2 == null ? (
            <EmptyComponentContainer path={path} condition="ELSE" />
          ) : (
            <PageDeserializer
              key={JSON.stringify([...path, 1, 0]) + JSON.stringify(context)}
              pageId={pageId}
              path={[...path, 1, 0]}
              uneditable={uneditable}
              context={context}
              Container={FlexItem}
              containerPropsKeys={defaultFlexLayoutOptionsKeys}
              dropzones={{}}
              inheritedOptionsState={inheritedOptionsState}
            />
          )}
        </>
      );
    } else {
      const newPath = [...path, condition ? 0 : 1, 0];
      // const emptyChildren =
      //   wegasChildren == null ||
      //   wegasChildren[condition ? 0 : 1].type === PlayerIfName ||
      //   wegasChildren[condition ? 0 : 1].type === PlayerElseName;
      return (
        /*emptyChildren ? null :*/ <PageDeserializer
          key={JSON.stringify(newPath)}
          pageId={pageId}
          path={newPath}
          uneditable={uneditable}
          context={context}
          Container={FlexItem}
          containerPropsKeys={defaultFlexLayoutOptionsKeys}
          dropzones={{}}
          inheritedOptionsState={inheritedOptionsState}
        />
      );
    }
  }
}

interface IfElseProps extends WegasComponentProps {
  ifCondition?: IScript;
}

registerComponent(
  pageComponentFactory({
    component: IfElse,
    componentType: 'Programmatic',
    container: {
      isVertical: () => false,
      ChildrenDeserializer,
    },
    name: 'If Else',
    icon: 'code',
    illustration: 'ifElse',
    schema: {
      ifCondition: schemaProps.script({
        label: 'If condition',
        value: 'true',
        mode: 'GET_CLIENT',
      }),
    },
    getComputedPropsFromVariable: () => ({
      children: [
        { type: PlayerIfName, props: { children: [] } },
        { type: PlayerElseName, props: { children: [] } },
      ],
    }),
  }),
);
