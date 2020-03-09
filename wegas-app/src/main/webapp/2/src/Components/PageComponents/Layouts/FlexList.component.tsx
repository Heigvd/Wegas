import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { css } from 'emotion';
import {
  FlexListProps,
  FlexList,
  flexDirectionValues,
  flexWrapValues,
  justifyContentValues,
  alignItemsValues,
  alignContentValues,
} from '../../Layouts/FlexList';
import {
  EditorHandleProps,
  PageComponentMandatoryProps,
} from '../tools/EditableComponent';

export const hoverElement = css({
  backgroundColor: 'red',
  ':hover': {
    backgroundColor: 'green',
    '&>wegas-component-handle': {
      opacity: 0.5,
    },
  },
});

type FlexListCompoentProps = FlexListProps & PageComponentMandatoryProps;
interface PlayerFlexListProps extends FlexListCompoentProps {
  /**
   * name - the name of the component
   */
  name?: string;
}

function PlayerFlexList(props: PlayerFlexListProps) {
  const {
    ComponentContainer,
    showBorders,
    childProps,
    flexProps,
  } = extractProps(props);

  const [showLayout, setShowLayout] = React.useState(
    showBorders ? true : false,
  );
  React.useEffect(() => {
    if (showBorders !== undefined) {
      setShowLayout(showBorders);
    }
  }, [showBorders]);

  const handleProps: EditorHandleProps = {
    componentName: props.name,
    vertical:
      props.flexDirection === 'column' ||
      props.flexDirection === 'column-reverse',
    togglerProps: {
      onChange: setShowLayout,
      value: showLayout,
      hint: 'Highlight list borders (only during edition mode)',
    },
  };

  return (
    <ComponentContainer flexProps={flexProps} handleProps={handleProps}>
      <FlexList {...childProps} />
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerFlexList,
    'FlexList',
    'bars',
    {
      name: schemaProps.string('Name', false),
      flexDirection: schemaProps.select(
        'Direction',
        false,
        flexDirectionValues,
        'string',
      ),
      flexWrap: schemaProps.select('Wrap', false, flexWrapValues, 'string'),
      justifyContent: schemaProps.select(
        'Justify content',
        false,
        justifyContentValues,
        'string',
      ),
      alignItems: schemaProps.select(
        'Align items',
        false,
        alignItemsValues,
        'string',
      ),
      alignContent: schemaProps.select(
        'Align content',
        false,
        alignContentValues,
        'string',
      ),
    },
    ['ISListDescriptor'],
    (val?: Readonly<ISListDescriptor>) =>
      val
        ? {
            // children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
          }
        : {},
  ),
);
