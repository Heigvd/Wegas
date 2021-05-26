import * as React from 'react';
import { cx, css } from 'emotion';
import {
  flex,
  flexWrap,
  flexColumn,
  expandWidth,
  grow,
  flexDistribute,
  expandBoth,
  contentCenter,
  justifyCenter,
  itemCenter,
  textCenter,
} from '../../../css/classes';
import {
  usePageComponentStore,
  componentTypes,
  ComponentType,
} from '../../../Components/PageComponents/tools/componentFactory';
import {
  useDrag,
  DragElementWrapper,
  DragSourceOptions,
  DragPreviewOptions,
} from 'react-dnd';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { IconComp } from '../Views/FontAwesome';
import { pageCTX } from './PageEditor';
import { Button } from '../../../Components/Inputs/Buttons/Button';

const headerStyle = css({
  padding: '20px',
  width: 'auto',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  color: themeVar.Common.colors.WarningColor,
});

const paletteStyle = (editMode: boolean) =>
  css({
    backgroundColor: editMode
      ? themeVar.Common.colors.BackgroundColor
      : themeVar.Common.colors.DisabledColor,
    opacity: editMode ? 1 : 0.5,
  });

const componentTypeStyle = (
  type: ComponentType,
  currentType: ComponentType | undefined,
  enabled: boolean,
) => {
  const selected = type === currentType;
  const show = currentType == null || selected;
  return css({
    transition: show ? 'all 0.5s' : undefined,
    textAlign: 'center',
    padding: show ? '20px' : 0,
    height: show ? 'auto' : 0,
    width: show ? 'auto' : 0,
    overflow: 'hidden',
    backgroundColor: selected
      ? themeVar.Common.colors.PrimaryColor
      : themeVar.Common.colors.HeaderColor,
    color: selected
      ? themeVar.Common.colors.HeaderColor
      : themeVar.Common.colors.PrimaryColor,
    margin: show ? '5px' : 0,
    cursor: enabled ? 'pointer' : 'initial',
    '&::after': {
      content: `'${selected ? 'Back' : type}'`,
    },
  });
};

const componentStyle = (show: boolean) =>
  css({
    visibility: show ? 'visible' : 'collapse',
    transition: show ? 'all 1s' : undefined,
    padding: show ? '20px' : 0,
    height: show ? 'fit-content' : 0,
    width: show ? 'fit-content' : 0,
    maxHeight: show ? 'fit-content' : 0,
    maxWidth: show ? 'fit-content' : 0,
    overflow: 'hidden',
    backgroundColor: themeVar.Common.colors.HeaderColor,
    color: themeVar.Common.colors.PrimaryColor,
    margin: show ? '5px' : 0,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: themeVar.Common.colors.PrimaryColor,
      color: themeVar.Common.colors.HeaderColor,
    },
  });

export interface DnDComponent {
  componentName: string;
  type: typeof PAGEEDITOR_COMPONENT_TYPE;
  path?: number[];
}

export function isDnDComponent(
  item?: Partial<DnDComponent>,
): item is DnDComponent {
  return (
    typeof item === 'object' &&
    item != null &&
    'componentName' in item &&
    typeof item.componentName === 'string' &&
    'type' in item &&
    typeof item.type === 'string'
  );
}

export const PAGEEDITOR_COMPONENT_TYPE = 'dndComponnent';

export interface DragMonitor {
  handlerId: string | symbol | null;
  isDragging: boolean;
}

export function useComponentDrag(
  componentName: string,
  path?: number[],
): [
  DragMonitor,
  DragElementWrapper<DragSourceOptions>,
  DragElementWrapper<DragPreviewOptions>,
] {
  const { editMode } = React.useContext(pageCTX);

  return useDrag({
    item: {
      componentName,
      type: PAGEEDITOR_COMPONENT_TYPE,
      path,
    },
    canDrag: () => editMode,
    collect: monitor => ({
      handlerId: monitor.getHandlerId(),
      isDragging: !!monitor.isDragging(),
    }),
  });
}

interface ComponentTypeElementProps {
  componentType: ComponentType;
  currentType: ComponentType | undefined;
  onClick: (type: ComponentType) => void;
  enabled: boolean;
}

function ComponentTypeElement({
  componentType,
  onClick,
  currentType,
  enabled,
}: ComponentTypeElementProps) {
  return (
    <div
      className={componentTypeStyle(componentType, currentType, enabled)}
      onClick={() => enabled && onClick(componentType)}
    />
  );
}

interface ComponentElementProps {
  componentName: string;
  currentType: ComponentType | undefined;
}

function ComponentElement({
  componentName,
  currentType,
}: ComponentElementProps) {
  const component = usePageComponentStore(s => s[componentName]);
  const [, drag] = useComponentDrag(componentName);
  return (
    <div
      ref={drag}
      className={componentStyle(component.componentType === currentType)}
      title={componentName}
    >
      {component ? (
        <IconComp icon={component.icon} />
      ) : (
        <span>{`Unknown component "${componentName}"`}</span>
      )}
    </div>
  );
}

export function ComponentPalette({
  setEditMode,
}: {
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [currentType, setCurrentType] = React.useState<ComponentType>();

  const { editMode } = React.useContext(pageCTX);

  const componentNames = usePageComponentStore(
    s => Object.keys(s),
    deepDifferent,
  );
  return (
    <div className={cx(flex, flexColumn, expandBoth)}>
      {!editMode && (
        <div className={cx(headerStyle, flex, itemCenter, flexColumn)}>
          <p className={textCenter}>
            Edit mode must be enabled to use the palette.
          </p>
          <Button onClick={() => setEditMode(true)}>Enable edit mode</Button>
        </div>
      )}
      <div className={cx(flex, flexColumn, grow, paletteStyle(editMode))}>
        <div className={cx(flex, flexColumn, expandWidth)}>
          {componentTypes.map(t => (
            <ComponentTypeElement
              key={t}
              componentType={t}
              currentType={currentType}
              onClick={type =>
                setCurrentType(o => (o === type ? undefined : type))
              }
              enabled={editMode}
            />
          ))}
        </div>
        <div
          className={cx(
            flex,
            grow,
            flexWrap,
            flexDistribute,
            justifyCenter,
            contentCenter,
          )}
        >
          {componentNames.map(k => (
            <ComponentElement
              key={k}
              componentName={k}
              currentType={currentType}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
