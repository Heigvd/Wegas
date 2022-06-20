import { css, cx } from '@emotion/css';
import * as React from 'react';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import {
  ComponentType,
  usableComponentType,
  usePageComponentStore,
} from '../../../Components/PageComponents/tools/componentFactory';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import {
  autoScroll,
  defaultMargin,
  defaultMarginTop,
  expandBoth,
  expandWidth,
  flex,
  flexBetween,
  flexColumn,
  flexDistribute,
  flexWrap,
  grow,
  itemCenter,
  textCenter,
} from '../../../css/classes';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { IconComp } from '../Views/FontAwesome';
import { ComponentIcon, ComponentTypeIcon } from './ComponentIcon';
import { pageCTX } from './PageEditor';
import { PAGEEDITOR_COMPONENT_TYPE } from './PagesLayout';

const headerStyle = css({
  padding: '20px',
  width: 'auto',
  borderBottom: '2px solid ' + themeVar.colors.WarningColor,
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
    },
  },
});

const ComponentTextStyle = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  margin: '2px 0',
});

export interface DnDComponent {
  componentId: string;
  path?: number[];
}

export function isDnDComponent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item?: { [key: string]: any },
): item is DnDComponent {
  return (
    typeof item === 'object' &&
    item != null &&
    'componentId' in item &&
    typeof item.componentId === 'string'
  );
}

export interface DragMonitor {
  handlerId: string | symbol | null;
  isDragging: boolean;
}

interface ComponentTypeElementProps {
  componentType: ComponentType;
  enabled: boolean;
  componentIds: string[];
}

function ComponentTypeElement({
  componentType,
  enabled,
  componentIds,
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
          if (enabled) {
            setOpened(opened => !opened);
          }
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
          {componentIds.map(id => (
            <ComponentElement
              key={id}
              componentId={id}
              componentType={componentType}
            />
          ))}
        </div>
      </div>
    </>
  );
}

interface ComponentElementProps {
  componentId: string;
  componentType: ComponentType | undefined;
}

function ComponentElement({
  componentId,
  componentType,
}: ComponentElementProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const component = usePageComponentStore(s => s[componentId]);
  return (
    <>
      {component.componentType === componentType && (
        <div
          draggable
          onDragStart={e => {
            e.stopPropagation();
            e.dataTransfer.setData('data', JSON.stringify({ componentId }));
            e.dataTransfer.setData(PAGEEDITOR_COMPONENT_TYPE, '');
          }}
          className={componentStyle}
          title={componentId}
        >
          {component ? (
            <>
              {component.illustration ? (
                <ComponentIcon componentIllu={component.illustration} />
              ) : (
                <IconComp icon={component.icon} />
              )}
              <p className={ComponentTextStyle}>{component.componentName}</p>
            </>
          ) : (
            <span>{`${i18nValues.pageEditor.unknownComponent} "${componentId}"`}</span>
          )}
        </div>
      )}
    </>
  );
}

export default function ComponentPalette() {
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  const { editMode, setEditMode } = React.useContext(pageCTX);

  const componentIds = usePageComponentStore(
    s =>
      Object.entries(s)
        .filter(([, component]) => component.obsoleteComponent == null)
        .map(([k]) => k),
    deepDifferent,
  );
  return (
    <div className={cx(flex, flexColumn, expandBoth, autoScroll)}>
      {editMode ? (
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
            {usableComponentType.map(t => (
              <ComponentTypeElement
                key={t}
                componentType={t}
                enabled={editMode}
                componentIds={componentIds}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={cx(headerStyle, flex, itemCenter, flexColumn)}>
          <p className={textCenter}>
            {i18nValues.pageEditor.editorMustEnabled}
          </p>
          <Button
            onClick={() => setEditMode(true)}
            className={defaultMarginTop}
          >
            {i18nValues.pageEditor.enableEditMode}
          </Button>
        </div>
      )}
    </div>
  );
}
