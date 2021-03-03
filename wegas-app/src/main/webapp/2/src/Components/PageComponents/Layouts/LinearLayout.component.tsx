import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
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
import { classStyleIdShema } from '../tools/options';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { omit } from 'lodash-es';
import { emptyLayoutItemStyle } from './FlexList.component';

const CONTENT_TYPE = 'LinearLayout';

export interface PlayerLinearLayoutChildrenProps {
  noSplitter?: boolean;
}

export interface PlayerLinearLayoutProps
  extends WegasComponentProps,
    PlayerLinearLayoutChildrenProps {
  flexValues?: number[];
  children: React.ReactNode[];
}

function PlayerLinearLayout({
  vertical,
  children,
  className,
  style,
}: PlayerLinearLayoutProps) {
  return (
    <ReflexContainer
      className={splitter + classNameOrEmpty(className)}
      style={style}
      orientation={vertical ? 'horizontal' : 'vertical'}
    >
      {children}
    </ReflexContainer>
  );
}

function isVertical(props?: PlayerLinearLayoutProps) {
  return props?.vertical === true;
}

export function EmptyComponentContainer({ path }: { path: number[] }) {
  const [{ isOver }, dropZone] = useDndComponentDrop();

  const { onDrop } = React.useContext(pageCTX);

  return (
    <ReflexElement>
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
    </ReflexElement>
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
  flexValues,
}: ChildrenDeserializerProps<PlayerLinearLayoutProps>) {
  const { editMode /*, onUpdate*/ } = React.useContext(pageCTX);

  const showSplitter = editMode || !noSplitter;

  return (
    <>
      {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer path={path} />
      ) : (
        wegasChildren?.reduce<JSX.Element[]>((old, _component, i, arr) => {
          const content = (
            <ReflexElement flex={flexValues && flexValues[i]}>
              <PageDeserializer
                key={JSON.stringify([...(path ? path : []), i])}
                pageId={pageId}
                path={[...(path ? path : []), i]}
                uneditable={uneditable}
                context={context}
                dropzones={{ side: true }}
                inheritedOptionsState={inheritedOptionsState}
              />
            </ReflexElement>
          );

          if (showSplitter && i < arr.length - 1) {
            const splitter = (
              <ReflexSplitter
              // onStopResize={handleProps => {
              //   editMode &&
              //     onUpdate(
              //       {
              //         type: CONTENT_TYPE,
              //         props: {
              //           flexValues: [...(flexValues?.slice(0,i) || []), ],
              //         },
              //       },
              //       path,
              //       true,
              //     );
              // }}
              />
            );
            return [...old, content, splitter];
          } else {
            return [...old, content];
          }
        }, [])
      )}
    </>
  );
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
  schema: {
    vertical: schemaProps.boolean({ label: 'Vertical' }),
    // noSplitter: schemaProps.boolean({ label: 'No splitter' }),
    flexValues: schemaProps.hidden({ type: 'array' }),
    ...omit(classStyleIdShema, ['id']),
  },
  getComputedPropsFromVariable: () => ({
    children: [],
  }),
});

registerComponent(test);
