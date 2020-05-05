import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import 'react-reflex/styles.css';
import { Container, ContainerProps } from '../../Layouts/FonkyFlex';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { WegasComponentProps } from '../tools/EditableComponent';

const CONTENT_TYPE = 'LinearLayout';

interface PlayerLinearLayoutProps extends WegasComponentProps, ContainerProps {
  /**
   * allowResize - let the splitter for users to change the display
   */
  allowUserResize?: boolean;
}

function PlayerLinearLayout({
  vertical,
  flexValues,
  children,
  path,
}: PlayerLinearLayoutProps) {
  const { editMode, onUpdate } = React.useContext(pageCTX);

  return (
    <Container
      className={splitter}
      vertical={vertical}
      flexValues={flexValues}
      noCheck
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
    </Container>
  );
}

const test = pageComponentFactory(
  PlayerLinearLayout,
  CONTENT_TYPE,
  'bars',
  {
    vertical: schemaProps.boolean('Vertical', false),
    allowUserResize: schemaProps.boolean('Splitter', false),
    flexValues: schemaProps.hidden(false, 'object'),
  },
  [],
  () => ({}),
  'LINEAR',
);

registerComponent(test);
