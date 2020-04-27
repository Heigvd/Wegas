import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { OrientedLayoutProps } from '../../Layouts/List';
import {
  PageComponentMandatoryProps,
  EditorHandleProps,
} from '../tools/EditableComponent';
import 'react-reflex/styles.css';
import { Container } from '../../Layouts/FonkyFlex';

const CONTENT_TYPE = 'LinearLayout';

type LinearLayoutProps = OrientedLayoutProps<WegasComponent> &
  PageComponentMandatoryProps;

interface PlayerLinearLayoutProps extends LinearLayoutProps {
  /**
   * allowResize - let the splitter for users to change the display
   */
  allowUserResize?: boolean;
  /**
   * containersSizeRatio - allows to fix a specific size ratio for each element in the layout
   */
  flexValues?: number[];
  /**
   * name - the name of the component
   */
  name?: string;
  /**
   * children - the array containing the child components
   */
  children: WegasComponent[];
}

function PlayerLinearLayout(props: PlayerLinearLayoutProps) {
  const {
    ComponentContainer,
    showBorders,
    childProps,
    containerProps,
    path,
  } = extractProps(props);

  const [showLayout, setShowLayout] = React.useState(
    showBorders ? true : false,
  );
  React.useEffect(() => {
    if (showBorders !== undefined) {
      setShowLayout(showBorders);
    }
  }, [showBorders]);
  const { editMode, onUpdate } = React.useContext(pageCTX);

  const handleProps: EditorHandleProps = {
    componentName: childProps.name,
    togglerProps: {
      onChange: setShowLayout,
      value: showLayout,
      hint: 'Highlight list borders (only during edition mode)',
    },
  };

  return (
    <ComponentContainer
      {...containerProps}
      showBorders={showLayout}
      handleProps={handleProps}
      vertical={!childProps.horizontal}
    >
      <Container
        className={splitter}
        vertical={!childProps.horizontal}
        flexValues={childProps.flexValues}
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
        {childProps.children}
      </Container>
    </ComponentContainer>
  );
}

const test = pageComponentFactory(
  PlayerLinearLayout,
  CONTENT_TYPE,
  'bars',
  {
    name: schemaProps.string('Name', false),
    className: schemaProps.string('ClassName', false),
    horizontal: schemaProps.boolean('Horizontal', false),
    containersSizeRatio: schemaProps.hidden(false, 'object'),
    allowUserResize: schemaProps.boolean('Splitter', false),
  },
  [],
  () => ({ children: [] }),
  'LINEAR',
);

registerComponent(test);
