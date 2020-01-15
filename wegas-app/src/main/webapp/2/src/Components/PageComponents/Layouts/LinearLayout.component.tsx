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
import { cx } from 'emotion';
import { layoutHighlightStyle } from './List.component';
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

  // The mapping is done outside from the return to avoid grouping ReflexSplitter and ReflexElement in fragment
  for (let i = 0; i < props.children.length; editMode ? (i += 2) : (i += 1)) {
    if ((editMode || keepSplitter) && i > 0) {
      children.push(
        <ReflexSplitter key={`SPLITTER${i / (editMode ? 2 : 1)}`} />,
      );
    }
    // We need to group every 2 elements because drop zones are added in edit mode
    children.push(
      <ReflexElement
        key={`ELEMENT${i}`}
        flex={props.flexValues && props.flexValues[i]}
        onStopResize={args => {
          editMode &&
            onUpdate(
              {
                type: componentType,
                props: {
                  flexValues: {
                    ...(props.flexValues ? props.flexValues : {}),
                    [i]: args.component.props.flex,
                  },
                },
              },
              path,
              true,
            );
        }}
      >
        {props.children[i]}
        {editMode && props.children[i + 1]}
      </ReflexElement>,
    );
  }

  return (
    <div
      className={cx(showLayout && layoutHighlightStyle, flex, grow)}
      style={{ width: '100%' }}
    >
      <EditHandle
        togglerProps={{
          onClick: setShowLayout,
          checked: showLayout,
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
