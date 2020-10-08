import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import 'react-reflex/styles.css';
import {
  FonkyFlexContainer,
  FonkyFlexContainerProps,
} from '../../Layouts/FonkyFlex';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { WegasComponentProps } from '../tools/EditableComponent';

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

const test = pageComponentFactory({
  component: PlayerLinearLayout,
  componentType: 'Layout',
  containerType: 'LINEAR',
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
