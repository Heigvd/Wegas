import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { cx, css } from 'emotion';
import { OrientedLayoutProps } from '../../Layouts/List';
import {
  PageComponentMandatoryProps,
  childHighlightCSS,
  EditorHandleProps,
} from '../tools/EditableComponent';
import 'react-reflex/styles.css';

const componentType = 'LinearLayout';

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
  containersSizeRatio?: { [containerId: string]: number };
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
  const children: JSX.Element[] = [];

  // The mapping is done outside from the return to avoid grouping ReflexSplitter and ReflexElement in fragment (avoid bug)
  for (let i = 0; i < props.children.length; editMode ? (i += 2) : (i += 1)) {
    if (
      i > 0 &&
      ((editMode && i !== props.children.length - 1) ||
        (childProps.allowUserResize && !editMode))
    ) {
      children.push(
        <ReflexSplitter key={`SPLITTER${i / (editMode ? 2 : 1)}`} />,
      );
    }
    children.push(
      <ReflexElement
        key={`ELEMENT${i}`}
        flex={
          props.containersSizeRatio
            ? props.containersSizeRatio[Math.floor(i / (editMode ? 2 : 1))]
            : 1000
        }
        onStopResize={args => {
          editMode &&
            onUpdate(
              {
                type: componentType,
                props: {
                  flexValues: {
                    ...(props.containersSizeRatio
                      ? props.containersSizeRatio
                      : {}),
                    [Math.floor(i / 2)]: args.component.props.flex,
                  },
                },
              },
              path,
              true,
            );
        }}
        className={cx(showBorders && css(childHighlightCSS))}
        style={{ overflow: 'visible' }}
      >
        {/* We need to group every 2 elements in edit mode because drop zones are added */}
        {props.children[i]}
        {editMode && props.children[i + 1]}
        {editMode && i === props.children.length - 3 && props.children[i + 2]}
      </ReflexElement>,
    );
    if (i === props.children.length - 3) {
      i += 1;
    }
  }

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
      <ReflexContainer
        className={splitter}
        // Orientation is inverted to keep same logic in TabLayoutNode and ReflexLayoutNode (vertical==true : v, vertical==false : >)
        orientation={childProps.horizontal ? 'vertical' : 'horizontal'}
      >
        {/* {children} */}
        {props.children}
      </ReflexContainer>
    </ComponentContainer>
  );
}

const test = pageComponentFactory(
  PlayerLinearLayout,
  componentType,
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
