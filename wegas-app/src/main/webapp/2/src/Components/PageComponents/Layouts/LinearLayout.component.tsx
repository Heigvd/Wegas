import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import 'react-reflex/styles.css';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import {
  ComponentDropZone,
  useDndComponentDrop,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { classNameOrEmpty } from '../../../Helper/className';
import { emptyLayoutItemStyle } from './FlexList.component';
import {
  FonkyFlexContainer,
  FonkyFlexContainerProps,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from '../../Layouts/FonkyFlex';
import { expandBoth } from '../../../css/classes';
import { themeCTX } from '../../Theme/Theme';

const CONTENT_TYPE = 'LinearLayout';

export interface PlayerLinearLayoutChildrenProps {
  noSplitter?: boolean;
}

export interface PlayerLinearLayoutProps
  extends WegasComponentProps,
    FonkyFlexContainerProps,
    PlayerLinearLayoutChildrenProps {
  noPlayerResize?: boolean;
  children: React.ReactNode[];
}

function PlayerLinearLayout({
  vertical,
  children,
  className,
  style,
  editMode,
  path,
  flexValues,
  noPlayerResize,
}: PlayerLinearLayoutProps) {
  const { currentContext } = React.useContext(themeCTX);
  const { onUpdate } = React.useContext(pageCTX);
  return (
    <FonkyFlexContainer
      lockSplitters={
        !editMode || (currentContext === 'player' && noPlayerResize)
      }
      flexValues={flexValues}
      className={expandBoth + classNameOrEmpty(className)}
      style={style}
      vertical={vertical}
      onStopResize={(_splitterNumber, flexValues) => {
        editMode &&
          onUpdate(
            {
              type: CONTENT_TYPE,
              props: {
                flexValues: flexValues,
              },
            },
            path,
            true,
          );
      }}
    >
      {children}
    </FonkyFlexContainer>
  );
}

function isVertical(props?: PlayerLinearLayoutProps) {
  return props?.vertical === true;
}

export function EmptyComponentContainer({ path }: { path: number[] }) {
  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <FonkyFlexContent>
      <div ref={dropZone} className={emptyLayoutItemStyle}>
        <ComponentDropZone
          onDrop={dndComponent => {
            onDrop(dndComponent, path);
          }}
          show={isOver}
          dropPosition="INTO"
        />
        The layout is empty, drop components in to fill it!
      </div>
    </FonkyFlexContent>
  );
}

export function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  inheritedOptionsState,
  noSplitter,
  containerPropsKeys,
  dropzones,
  noPlayerResize,
}: ChildrenDeserializerProps<PlayerLinearLayoutProps>) {
  const { currentContext } = React.useContext(themeCTX);
  const { editMode /*, onUpdate*/ } = React.useContext(pageCTX);

  const showSplitter = editMode || !noSplitter;

  const test =
    !wegasChildren || wegasChildren.length === 0 ? (
      <EmptyComponentContainer path={path} />
    ) : (
      wegasChildren?.reduce<JSX.Element[]>((old, _component, i, arr) => {
        const content = (
          <PageDeserializer
            key={JSON.stringify([...path, i])}
            pageId={pageId}
            path={[...path, i]}
            uneditable={uneditable}
            Container={FonkyFlexContent}
            context={context}
            containerPropsKeys={containerPropsKeys}
            dropzones={dropzones}
            inheritedOptionsState={inheritedOptionsState}
          />
        );

        if (showSplitter && i < arr.length - 1) {
          const splitter = (
            <FonkyFlexSplitter
              notDraggable={
                !editMode || (currentContext === 'player' && noPlayerResize)
              }
              key={'SPLITTER' + JSON.stringify([...path, i])}
            />
          );
          return [...old, content, splitter];
        } else {
          return [...old, content];
        }
      }, [])
    );

  // debugger;
  return <>{test}</>;
}

const test = pageComponentFactory({
  component: PlayerLinearLayout,
  componentType: 'Layout',
  container: {
    isVertical,
    ChildrenDeserializer,
    childrenSchema: [],
    childrenLayoutKeys: [],
  },
  name: CONTENT_TYPE,
  icon: 'columns',
  illustration: 'linearLayout',
  schema: {
    vertical: schemaProps.boolean({ label: 'Vertical' }),
    noPlayerResize: schemaProps.boolean({ label: 'No player resize' }),
    // noSplitter: schemaProps.boolean({ label: 'No splitter' }),
    // flexValues: schemaProps.hidden({ type: 'array' }),
    flexValues: schemaProps.array({
      itemSchema: {
        statement: schemaProps.number({}),
      },
    }),
  },
  getComputedPropsFromVariable: () => ({
    children: [],
  }),
});

registerComponent(test);
