import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import 'react-reflex/styles.css';
import {
  defaultFonkyFlexLayoutPropsKeys,
  FonkyFlexContainer,
  fonkyFlexContainerChoices,
  FonkyFlexContainerProps,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from '../../Layouts/FonkyFlex';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  ChildrenDeserializerProps,
  PageDeserializer,
} from '../tools/PageDeserializer';
import { EmptyComponentContainer } from './FlexList.component';

const CONTENT_TYPE = 'LinearLayout';

export interface PlayerLinearLayoutChildrenProps {
  noSplitter?: boolean;
  noResize?: boolean;
}

export interface PlayerLinearLayoutProps
  extends WegasComponentProps,
    FonkyFlexContainerProps,
    PlayerLinearLayoutChildrenProps {
  children: React.ReactNode[];
}

function PlayerLinearLayout({
  vertical,
  flexValues,
  children,
  path,
}: PlayerLinearLayoutProps) {
  const { editMode, onUpdate } = React.useContext(pageCTX);

  return (
    <FonkyFlexContainer
      className={splitter}
      vertical={vertical}
      flexValues={flexValues}
      onStopResize={(_splitterId, flexValues) => {
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

export function ChildrenDeserializer({
  wegasChildren,
  path,
  pageId,
  uneditable,
  context,
  noSplitter,
  noResize,
}: ChildrenDeserializerProps<PlayerLinearLayoutProps>) {
  const { editMode } = React.useContext(pageCTX);

  const showSplitter = editMode || !noSplitter;
  const allowResize = editMode || !noResize;

  return (
    <>
      {editMode && (!wegasChildren || wegasChildren.length === 0) ? (
        <EmptyComponentContainer Container={FonkyFlexContent} path={path} />
      ) : (
        showSplitter &&
        wegasChildren?.map((_c, i, arr) => {
          return (
            <>
              <PageDeserializer
                key={JSON.stringify([...(path ? path : []), i])}
                pageId={pageId}
                path={[...(path ? path : []), i]}
                uneditable={uneditable}
                context={context}
                Container={FonkyFlexContent}
                containerPropsKeys={defaultFonkyFlexLayoutPropsKeys}
                dropzones={{ side: true }}
              />
              {showSplitter && i < arr.length - 1 && (
                <FonkyFlexSplitter notDraggable={!allowResize} />
              )}
            </>
          );
        })
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
    childrenSchema: fonkyFlexContainerChoices,
    childrenLayoutKeys: defaultFonkyFlexLayoutPropsKeys,
  },
  name: CONTENT_TYPE,
  icon: 'columns',
  schema: {
    vertical: schemaProps.boolean({ label: 'Vertical' }),
    noSplitter: schemaProps.boolean({ label: 'No splitter' }),
    noResize: schemaProps.boolean({ label: 'No resize' }),
    flexValues: schemaProps.hidden({ type: 'array' }),
  },
  getComputedPropsFromVariable: () => ({
    children: [],
  }),
});

registerComponent(test);
