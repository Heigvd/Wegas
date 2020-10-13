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
  FonkyFlexContainerProps,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from '../../Layouts/FonkyFlex';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { ChildrenDeserializerProps, WegasComponentProps } from '../tools/EditableComponent';
import { PageDeserializer } from '../tools/PageDeserializer';

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

function isVertical(props?: PlayerLinearLayoutProps) { return props?.vertical === true }

export function ChildrenDeserializer({ nbChildren, path, pageId, uneditable, context, noSplitter, noResize }: ChildrenDeserializerProps<PlayerLinearLayoutProps>) {

  const { editMode } = React.useContext(pageCTX);

  const showSplitter =
    (editMode || !noSplitter);
  const allowResize = (editMode || !noResize);

  const newChildren: JSX.Element[] = [];
  for (let i = 0; i < nbChildren; ++i) {
    newChildren.push(
      <PageDeserializer
        key={JSON.stringify([...(path ? path : []), i])}
        pageId={pageId}
        path={[...(path ? path : []), i]}
        uneditable={uneditable}
        childrenType="LINEAR"
        context={context}
        Container={FonkyFlexContent}
        containerPropsKeys={defaultFonkyFlexLayoutPropsKeys}
        dropzones={{ side: true }}
      />,
    );
    if (showSplitter && i !== nbChildren - 1) {
      newChildren.push(<FonkyFlexSplitter notDraggable={!allowResize} />)
    }
  }
  return <>{newChildren}</>;
}


const test = pageComponentFactory({
  component: PlayerLinearLayout,
  componentType: 'Layout',
  container: {
    type: 'LINEAR',
    isVertical,
    ChildrenDeserializer
  },
  name: CONTENT_TYPE,
  icon: 'columns',
  dropzones: {},
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
