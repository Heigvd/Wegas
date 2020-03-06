import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { css, cx } from 'emotion';
import { themeVar } from '../../Theme';
import {
  FlexListProps,
  FlexList,
  flexDirectionValues,
  flexWrapValues,
  justifyContentValues,
  alignItemsValues,
  alignContentValues,
  FlexItem,
  FlexItemProps,
} from '../../Layouts/FlexList';
import { schrinkBoth } from '../../../css/classes';
import { EditorHandleProps } from '../tools/EditableComponent';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.searchColor,
});

export const childHighlightCSS = {
  borderStyle: 'dotted',
  borderWidth: '1px',
  borderColor: themeVar.searchColor,
};

export const childHighlightStyle = css({
  '&>*': childHighlightCSS,
});

export const hoverElement = css({
  backgroundColor: 'red',
  ':hover': {
    backgroundColor: 'green',
    '&>wegas-component-handle': {
      opacity: 0.5,
    },
  },
});

interface ComponentContainerProps<T> extends PageComponentMandatoryProps {
  child: React.FunctionComponent<T>;
  childProps: T;
  itemProps: FlexItemProps;
  handleProps?: EditorHandleProps;
}

function ComponentContainer<T>(props: ComponentContainerProps<T>) {
  const {
    child,
    childProps,
    itemProps,
    EditHandle,
    handleProps,
    showBorders,
  } = props;

  return (
    <FlexItem
      {...itemProps}
      className={cx(
        {
          [childHighlightStyle]: showBorders,
          [layoutHighlightStyle]: showBorders,
        },
        itemProps.className,
      )}
    >
      <EditHandle {...handleProps} />
      {child(childProps)}
    </FlexItem>
  );
}

type FlexListCompoentProps = FlexListProps & PageComponentMandatoryProps;
interface PlayerFlexListProps extends FlexListCompoentProps {
  /**
   * name - the name of the component
   */
  name?: string;
}

function PlayerFlexList(props: PlayerFlexListProps) {
  const { EditHandle, showBorders } = props;
  const [showLayout, setShowLayout] = React.useState(
    showBorders ? true : false,
  );

  React.useEffect(() => {
    if (showBorders !== undefined) {
      setShowLayout(showBorders);
    }
  }, [showBorders]);

  return (
    <div
      style={{ position: 'relative' }}
      className={cx(
        schrinkBoth,
        { [childHighlightStyle]: showLayout },
        hoverElement,
      )}
    >
      <EditHandle
        componentName={props.name}
        vertical={
          props.flexDirection === 'column' ||
          props.flexDirection === 'column-reverse'
        }
        togglerProps={{
          onChange: setShowLayout,
          value: showLayout,
          hint: 'Highlight list borders (only during edition mode)',
        }}
      />
      <FlexList {...props} className={props.className} />
    </div>
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
      className: schemaProps.string('Class', false),
      style: schemaProps.hidden(false, 'object'),
      children: schemaProps.hidden(false, 'array'),
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
