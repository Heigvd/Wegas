import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import { splitter } from '../../../Editor/Components/LinearTabLayout/LinearLayout';
import { css } from 'emotion';
import { PlayerListProps } from './List.component';
import { omit } from 'lodash-es';

const linearLayoutStyle = css({ flex: '1 1 auto' });

const componentType = 'LinearLayout';

interface PlayerLinearLayoutProps extends PlayerListProps {
  /**
   * flexValues - allows to fix a specific flex value for each element in the layout
   */
  flexValues?: { [containerId: string]: number };
}

function PlayerLinearLayout(props: PlayerLinearLayoutProps) {
  const { EditHandle, path } = props;
  const { editMode, onUpdate } = React.useContext(pageCTX);
  const children: JSX.Element[] = [];

  // The mapping is done outside from the return to avoid grouping ReflexSplitter and ReflexElement in fragment
  for (let i = 0; i < props.children.length; editMode ? (i += 2) : (i += 1)) {
    if (editMode && i > 0) {
      children.push(<ReflexSplitter key={`SPLITTER${i}`} />);
    }
    // We need to group every 2 elements because drop zones are added in edit mode
    children.push(
      <ReflexElement
        key={`ELEMENT${i}`}
        flex={props.flexValues && props.flexValues[i]}
        onStopResize={args => {
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
    <div className={linearLayoutStyle}>
      <EditHandle />
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
      children: schemaProps.hidden(undefined, true),
      style: schemaProps.code('Style', false, 'JSON'),
      className: schemaProps.string('ClassName', false),
      horizontal: schemaProps.boolean('Horizontal', false),
    },
    ['ISListDescriptor'],
    () => ({ children: [] }),
  ),
);
