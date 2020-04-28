import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  extractProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import {
  EditorHandleProps,
  PageComponentMandatoryProps,
  layoutHighlightStyle,
} from '../tools/EditableComponent';
import { cx } from 'emotion';
import { classNameOrEmpty } from '../../../Helper/className';

interface AbsoluteLayoutProps extends PageComponentMandatoryProps {
  /**
   * name - the name of the component
   */
  name?: string;
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
}

function PlayerFlexList(props: AbsoluteLayoutProps) {
  const {
    ComponentContainer,
    showBorders,
    childProps,
    containerProps,
  } = extractProps(props);

  const [showLayout, setShowLayout] = React.useState(showBorders);
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
      hint: 'Highlight layout borders (only during edition mode)',
    },
  };
  return (
    <ComponentContainer
      {...containerProps}
      handleProps={handleProps}
      showBorders={showLayout}
    >
      <div
        className={
          cx({
            [layoutHighlightStyle]: showLayout,
          }) + classNameOrEmpty(childProps.className)
        }
      >
        {childProps.children}
      </div>
    </ComponentContainer>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerFlexList,
    'AbsoluteLayout',
    'bars',
    {
      name: schemaProps.string('Name', false),
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
    'ABSOLUTE',
  ),
);
