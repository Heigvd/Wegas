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
  itemCenter,
  textCenter,
  defaultMargin,
  flexBetween,
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
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { ComponentIcon, ComponentTypeIcon } from './ComponentIcon';

const headerStyle = css({
  padding: '20px',
  width: 'auto',
  backgroundColor: themeVar.colors.HeaderColor,
  color: themeVar.colors.WarningColor,
});

const paletteStyle = (editMode: boolean) =>
  css({
    backgroundColor: themeVar.colors.BackgroundColor,
    opacity: editMode ? 1 : 0.5,
  });

const componentTypeButtonStyle = (opened: boolean, enabled: boolean) => {
  return css({
    padding: '15px',
    backgroundColor: enabled
      ? themeVar.colors.PrimaryColor
      : themeVar.colors.HeaderColor,
    color: enabled
      ? themeVar.colors.LightTextColor
      : themeVar.colors.PrimaryColor,
    cursor: enabled ? 'pointer' : 'initial',
    marginBottom: opened ? '0px' : '3px',
    '&:hover': {
      backgroundColor: enabled
        ? themeVar.colors.ActiveColor
        : themeVar.colors.HeaderColor,
      transition: 'background-color .5s ease',
    },
  });
};

const componentTypeCollapseStyle = (opened: boolean) => {
  return css({
    transition: 'all .8s ease',
    textAlign: 'center',
    opacity: opened ? 1 : 0,
    maxHeight: opened ? '500px' : 0,
    width: 'auto',
    overflow: 'hidden',
    backgroundColor: themeVar.colors.HeaderColor,
    marginBottom: opened ? '3px' : 0,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  });
};

const componentStyle = css({
  width: '90px',
  height: '90px',
  padding: '5px 10px',
  overflow: 'hidden',
  fontSize: '13px',
  lineHeight: '16px',
  backgroundColor: themeVar.colors.HeaderColor,
  color: themeVar.colors.PrimaryColor,
  margin: '5px',
  cursor: 'pointer',
  '&:hover': {
    color: themeVar.colors.ActiveColor,
    transition: 'all .5s',
    svg: {
      fill: themeVar.colors.ActiveColor,
      transition: 'all .5s',
    }
  },
});

const ComponentTextStyle = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  margin: '2px 0',
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
  onClick: (type: ComponentType) => void;
  currentType: ComponentType | undefined;
  enabled: boolean;
  componentNames: string[];
}

function ComponentTypeElement({
  componentType,
  onClick,
  //currentType,
  enabled,
  componentNames,
}: ComponentTypeElementProps) {
  const [opened, setOpened] = React.useState(false);
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const translatedType = i18nValues.pageEditor.componentTypes[componentType]
    ? i18nValues.pageEditor.componentTypes[componentType]
    : componentType;

  return (
    <>
      <div
        className={cx(
          componentTypeButtonStyle(opened, enabled),
          flex,
          flexBetween,
        )}
        onClick={() => {
          enabled && onClick(componentType);
          setOpened(opened => !opened);
        }}
      >
        <div>
          <ComponentTypeIcon componentType={componentType} />
          {`${translatedType}`}
        </div>
        <IconComp icon={opened ? 'chevron-up' : 'chevron-down'} />
      </div>
      <div
        className={cx(
          flex,
          grow,
          flexWrap,
          flexDistribute,
          componentTypeCollapseStyle(opened),
        )}
      >
        <div className={cx(defaultMargin, flex, flexWrap)}>
          {componentNames.map(k => (
            <ComponentElement
              key={k}
              componentName={k}
              componentType={componentType}
            />
          ))}
        </div>
      </div>
    </>
  );
}

interface ComponentElementProps {
  componentName: string;
  componentType: ComponentType | undefined;
}

function ComponentElement({
  componentName,
  componentType,
}: ComponentElementProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const component = usePageComponentStore(s => s[componentName]);
  const [, drag] = useComponentDrag(componentName);
  return (
    <>
      {component.componentType === componentType && (
        <div ref={drag} className={componentStyle} title={componentName}>
          {component ? (
            <>
              {component.illustration ? (
                <ComponentIcon componentIllu={component.illustration} />
              ) : (
                <IconComp icon={component.icon} />
              )}
              <p className={ComponentTextStyle}>{componentName}</p>
            </>
          ) : (
            <span>{`${i18nValues.pageEditor.unknownComponent} "${componentName}"`}</span>
          )}
        </div>
      )}
    </>
  );
}

export function ComponentPalette({
  setEditMode,
}: {
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
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
            {i18nValues.pageEditor.editorMustEnabled}
          </p>
          <Button onClick={() => setEditMode(true)}>
            {i18nValues.pageEditor.enableEditMode}
          </Button>
        </div>
      )}
      <div
        className={cx(
          flex,
          flexColumn,
          grow,
          paletteStyle(editMode),
          defaultMargin,
        )}
      >
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
              componentNames={componentNames}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
