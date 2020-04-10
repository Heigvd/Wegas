import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
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

type FlexListCompoentProps = FlexListProps & PageComponentMandatoryProps;
interface PlayerFlexListProps extends FlexListCompoentProps {
  /**
   * name - the name of the component
   */
  name?: string;
  /**
   * children - the array containing the child components
   */
  children: WegasComponent[];
}

function PlayerFlexList(props: PlayerFlexListProps) {
  const {
    ComponentContainer,
    showBorders,
    childProps,
    containerProps,
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
      handleProps={handleProps}
      showBorders={showLayout}
    >
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
      listLayout: schemaProps.hashlist('List layout properties', false, [
        {
          label: 'Direction',
          value: {
            prop: 'flexDirection',
            schema: schemaProps.select('Direction', false, flexDirectionValues),
          },
        },
        {
          label: 'Wrap',
          value: {
            prop: 'flexWrap',
            schema: schemaProps.select('Wrap', false, flexWrapValues, 'string'),
          },
        },
        {
          label: 'Justify content',
          value: {
            prop: 'justifyContent',
            schema: schemaProps.select(
              'Justify content',
              false,
              justifyContentValues,
            ),
          },
        },
        {
          label: 'Align items',
          value: {
            prop: 'alignItems',
            schema: schemaProps.select('Align items', false, alignItemsValues),
          },
        },
        {
          label: 'Align content',
          value: {
            prop: 'alignContent',
            schema: schemaProps.select(
              'Align content',
              false,
              alignContentValues,
            ),
          },
        },
      ]),
      children: schemaProps.hidden(false),
    },
    ['ISListDescriptor'],
    (val?: Readonly<ISListDescriptor>) =>
      val
        ? {
            // children:val.itemsIds.map(id=>componentsStore.getComponentByType(VariableDescriptor.select(id)))
            children: [],
          }
        : {
            children: [],
          },
  ),
);
