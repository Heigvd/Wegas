import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { cx, css } from 'emotion';
import { layoutHighlightStyle, childHighlightCSS } from './List.component';
import { flex, grow } from '../../../css/classes';
import { OrientedLayoutProps } from '../../Layouts/List';

const componentType = 'LinearLayout';

type LinearLayoutProps = OrientedLayoutProps<WegasComponent> &
  PageComponentMandatoryProps;

interface PlayerLinearLayoutProps extends LinearLayoutProps {
  /**
   * keepSplitter - let the splitter for users to change the display
   */
  keepSplitter?: boolean;
  /**
   * flexValues - allows to fix a specific flex value for each element in the layout
   */
  flexValues?: { [containerId: string]: number };
}

function PlayerLinearLayout(props: PlayerLinearLayoutProps) {
  const { EditHandle, showBorders, path, keepSplitter } = props;
  const { editMode, onUpdate } = React.useContext(pageCTX);
  const children: JSX.Element[] = [];

  const [showLayout, setShowLayout] = React.useState(
    showBorders ? true : false,
  );

  React.useEffect(() => {
    if (showBorders !== undefined) {
      setShowLayout(showBorders);
    }
  }, [showBorders]);

  // The mapping is done outside from the return to avoid grouping ReflexSplitter and ReflexElement in fragment (avoid bug)
  for (let i = 0; i < props.children.length; editMode ? (i += 2) : (i += 1)) {
    if (
      i > 0 &&
      ((editMode && i !== props.children.length - 1) ||
        (keepSplitter && !editMode))
    ) {
      children.push(
        <ReflexSplitter key={`SPLITTER${i / (editMode ? 2 : 1)}`} />,
      );
    }
    children.push(
      <ReflexElement
        key={`ELEMENT${i}`}
        flex={
          props.flexValues
            ? props.flexValues[Math.floor(i / (editMode ? 2 : 1))]
            : 1000
        }
        onStopResize={args => {
          editMode &&
            onUpdate(
              {
                type: componentType,
                props: {
                  flexValues: {
                    ...(props.flexValues ? props.flexValues : {}),
                    [Math.floor(i / 2)]: args.component.props.flex,
                  },
                },
              },
              path,
              true,
            );
        }}
        className={cx(showBorders && css(childHighlightCSS))}
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

  return (
    <div
      className={cx(showLayout && layoutHighlightStyle, flex, grow)}
      style={{ width: '100%' }}
    >
      <div
        style={{
          display: props.horizontal ? 'block' : 'inline-flex',
          width: '100%',
          height: '100%',
        }}
      >
        <EditHandle
          togglerProps={{
            onChange: setShowLayout,
            value: showLayout,
            hint: 'Highlight list borders (only during edition mode)',
          }}
          vertical={!props.horizontal}
        />
        <ReflexContainer
          className={splitter}
          // Orientation is inverted to keep same logic in TabLayoutNode and ReflexLayoutNode (vertical==true : v, vertical==false : >)
          orientation={props.horizontal ? 'vertical' : 'horizontal'}
        >
          {children}
        </ReflexContainer>
      </div>
    </div>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerLinearLayout,
    componentType,
    'bars',
    {
      children: schemaProps.hidden(false),
      style: schemaProps.code('Style', false, 'JSON'),
      className: schemaProps.string('ClassName', false),
      horizontal: schemaProps.boolean('Horizontal', false),
      flexValues: schemaProps.hidden(false, 'object'),
      keepSplitter: schemaProps.boolean('Splitter', false),
    },
    [],
    () => ({ children: [] }),
  ),
);
