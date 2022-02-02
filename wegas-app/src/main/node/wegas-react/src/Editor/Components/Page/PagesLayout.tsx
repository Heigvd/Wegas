import { css, cx } from '@emotion/css';
import { omit } from 'lodash-es';
import * as React from 'react';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';
import { DropMenu } from '../../../Components/DropMenu';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import {
  componentTypes,
  usePageComponentStore,
} from '../../../Components/PageComponents/tools/componentFactory';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import { TreeNode } from '../../../Components/TreeView/TreeNode';
import { OnMoveFn, TreeView } from '../../../Components/TreeView/TreeView';
import {
  defaultPadding,
  expandBoth,
  flex,
  globalSelection,
  grow,
  itemCenter,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { State } from '../../../data/Reducer/reducers';
// import { ItemDescription, isItemDescription } from '../Views/TreeView/TreeView';
import {
  isComponentFocused,
  pagesStateStore,
  PageStateAction,
  usePagesStateStore,
} from '../../../data/Stores/pageStore';
import { store, useStore } from '../../../data/Stores/store';
import { isFolderItem, isPageItem } from '../../../Helper/pages';
import { commonTranslations } from '../../../i18n/common/common';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { MessageString } from '../MessageString';
import { TextPrompt } from '../TextPrompt';
import { actionNodeContentStyle } from '../Variable/CTree';
import { TREEVIEW_ITEM_TYPE } from '../Variable/VariableTreeView';
import { FontAwesome, Icon, IconComp, Icons } from '../Views/FontAwesome';
import { DnDComponent, isDnDComponent } from './ComponentPalette';
import { pageCTX } from './PageEditor';

interface NodeBasicInfo<T> {
  parent?: T;
  index?: number;
}

const bulletCSS = {
  width: '1em',
};

const CONTROLS_CLASSNAME = 'page-index-item-controls';

const PAGE_LAYOUT_ITEM = 'PAGE_LAYOUT_ITEM';
export const PAGE_LAYOUT_COMPONENT = 'PAGE_LAYOUT_COMPONENT';
export const PAGEEDITOR_COMPONENT_TYPE = 'dndComponnent';
export const ALLOWED_PAGE_EDITOR_COMPONENTS = [
  PAGE_LAYOUT_COMPONENT,
  TREEVIEW_ITEM_TYPE,
  PAGEEDITOR_COMPONENT_TYPE,
];

const titleStyle = css({
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '2px',
  [`&>.${CONTROLS_CLASSNAME}`]: {
    visibility: 'hidden',
  },
  [`:hover>.${CONTROLS_CLASSNAME}`]: {
    visibility: 'visible',
  },
});

const focusedComponentStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
  border: 'solid black',
});

const defaultPage = {
  type: 'FlexList',
  props: {
    children: [],
    layout: {
      flexDirection: 'column',
    },
    layoutStyle: {
      width: '100%',
      height: '100%',
      overflow: 'auto',
    },
  },
};

interface PageModalState {
  type: 'newpage' | 'newfolder' | 'editpage';
}
interface ErrorModalState {
  type: 'error';
  label: string;
}
type LayoutModalStates = PageModalState | ErrorModalState /*| SaveModalState*/;

interface PageIndexNode {
  pagePath: string[];
}

export interface PageComponentNode {
  pageId: string;
  componentPath: number[];
}

type PageNode = PageIndexNode | PageComponentNode;

function isPageIndexNode(node: PageNode): node is PageIndexNode {
  return 'pagePath' in node && Array.isArray(node.pagePath);
}

export function isPageComponentNode(node: PageNode): node is PageComponentNode {
  return (
    'pageId' in node &&
    typeof node.pageId === 'string' &&
    'componentPath' in node &&
    Array.isArray(node.componentPath)
  );
}

function isWegasComponent(component: unknown): component is WegasComponent {
  if (
    typeof component !== 'object' ||
    component == null ||
    !('type' in component) ||
    !('props' in component)
  ) {
    return false;
  }
  const objectComponent = component as { type: unknown; props: unknown };
  if (
    typeof objectComponent.type !== 'string' ||
    typeof objectComponent.props !== 'object'
  ) {
    return false;
  }
  return true;
}

interface LayoutButtonProps extends ClassStyleId {
  tooltip?: string;
}

interface IndexItemAdderProps extends LayoutButtonProps {
  path: string[];
}

export function IndexItemAdder({
  path,
  className,
  style,
  tooltip,
}: IndexItemAdderProps) {
  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const { dispatch } = store;
  const i18nValues = useInternalTranslate(editorTabsTranslations);

  return (
    <div className={className} style={style} title={tooltip}>
      <DropMenu
        icon="plus"
        items={[
          {
            label: (
              <div>
                <FontAwesome icon="file" style={bulletCSS} />
                {i18nValues.fileBrowser.newPage}
              </div>
            ),
            value: 'newpage' as LayoutModalStates['type'],
          },
          {
            label: (
              <div>
                <FontAwesome icon="folder" style={bulletCSS} />
                {i18nValues.fileBrowser.newFolder}
              </div>
            ),
            value: 'newfolder' as LayoutModalStates['type'],
          },
        ]}
        onSelect={({ value }) => {
          setModalState({ type: value } as PageModalState);
        }}
      />
      {modalState &&
        (modalState.type === 'newpage' || modalState.type === 'newfolder') && (
          <>
            <TextPrompt
              placeholder={
                modalState.type === 'newpage'
                  ? i18nValues.fileBrowser.pageName
                  : i18nValues.fileBrowser.folderName
              }
              defaultFocus
              onAction={(success, value) => {
                if (value === '') {
                  setModalState({
                    type: 'error',
                    label: i18nValues.fileBrowser.itemMustName(),
                  });
                } else {
                  if (success) {
                    switch (modalState.type) {
                      case 'newpage':
                        dispatch(
                          Actions.PageActions.createItem(
                            path,
                            {
                              '@class': 'Page',
                              name: value,
                            },
                            defaultPage,
                          ),
                        );
                        break;
                      case 'newfolder':
                        dispatch(
                          Actions.PageActions.createItem(path, {
                            '@class': 'Folder',
                            name: value,
                            items: [],
                          }),
                        );
                        break;
                    }
                    setModalState(undefined);
                  }
                }
              }}
              onBlur={() => setModalState(undefined)}
              applyOnEnter
            />
          </>
        )}
      {modalState && modalState.type === 'error' && (
        <MessageString
          type="warning"
          value={modalState.label}
          duration={3000}
          onLabelVanish={() => setModalState(undefined)}
        />
      )}
    </div>
  );
}

interface IndexItemModiferProps extends IndexItemAdderProps {
  indexItem: PageIndexItem;
}

function IndexItemModifer({
  path,
  indexItem,
  className,
  tooltip,
}: IndexItemModiferProps) {
  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const { dispatch } = store;
  const i18nValues = useInternalTranslate(commonTranslations);
  const i18nEditorValues = useInternalTranslate(editorTabsTranslations);

  return (
    <div className={className} title={tooltip}>
      <Button
        icon="edit"
        tooltip={`${i18nValues.edit} ${
          isPageItem(indexItem)
            ? i18nEditorValues.fileBrowser.pageName
            : i18nEditorValues.fileBrowser.folderName
        }`}
        onClick={() => {
          setModalState({ type: 'editpage' });
        }}
      />
      {modalState && modalState.type === 'editpage' && (
        <>
          <TextPrompt
            placeholder={`${
              isPageItem(indexItem)
                ? i18nEditorValues.fileBrowser.pageName
                : i18nEditorValues.fileBrowser.folderName
            }`}
            defaultFocus
            onAction={(success, value) => {
              if (value === '') {
                setModalState({
                  type: 'error',
                  label: i18nEditorValues.fileBrowser.itemMustName(
                    isPageItem(indexItem)
                      ? i18nEditorValues.fileBrowser.page
                      : i18nEditorValues.fileBrowser.folder,
                  ),
                });
              } else {
                if (success) {
                  dispatch(
                    Actions.PageActions.updateIndexItem(path, {
                      ...indexItem,
                      name: value,
                    }),
                  );
                  setModalState(undefined);
                }
              }
            }}
            onBlur={() => setModalState(undefined)}
            applyOnEnter
          />
        </>
      )}
      {modalState && modalState.type === 'error' && (
        <MessageString
          type="warning"
          value={modalState.label}
          duration={3000}
          onLabelVanish={() => setModalState(undefined)}
        />
      )}
    </div>
  );
}

interface ComponentAdderProps extends LayoutButtonProps {
  onSelect: (componentType: string) => void;
}

function ComponentAdder({ className, tooltip, onSelect }: ComponentAdderProps) {
  const components = usePageComponentStore(s => s);
  return (
    <div className={className} title={tooltip}>
      <DropMenu
        icon="plus"
        items={componentTypes.map(type => ({
          label: type,
          id: type,
          items: Object.values(components)
            .filter(
              c => c.componentType === type && c.obsoleteComponent == null,
            )
            .map(v => ({
              label: v.componentName,
              id: v.componentName,
            })),
        }))}
        onSelect={({ id }) => {
          if (!componentTypes.includes(id)) {
            onSelect(id);
          }
        }}
      />
    </div>
  );
}

const compToKey = (component: WegasComponent, path?: number[]) =>
  JSON.stringify({
    type: component.type,
    props: omit(component.props, 'children'),
    path,
  });

interface LayoutNodeTitleProps extends ClassStyleId {
  icon: Icons;
  title: string;
  advancedTitle?: string;
  tooltip?: string;
  onMouseUp?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseOut?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  classSelector?: string[];
}

function LayoutNodeTitle({
  icon,
  title,
  advancedTitle,
  tooltip,
  onMouseUp,
  onMouseOver,
  onMouseOut,
  className,
  style,
  children,
}: React.PropsWithChildren<LayoutNodeTitleProps>) {
  const { currentFeatures } = React.useContext(featuresCTX);

  const newTitle =
    isFeatureEnabled(currentFeatures, 'ADVANCED') && advancedTitle != null
      ? advancedTitle
      : title;

  return (
    <div
      onMouseUp={onMouseUp}
      className={cx(
        actionNodeContentStyle,
        titleStyle,
        flex,
        grow,
        itemCenter,
        className,
      )}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={style}
      title={tooltip}
    >
      <IconComp icon={icon} className={css({ marginRight: '3px' })} />
      <div className={grow}>{newTitle}</div>
      {children}
    </div>
  );
}

const pageDispatch = pagesStateStore.dispatch;

interface WegasComponentTitleProps {
  component: WegasComponent;
  pageId: string;
  selectedPageId?: string;
  componentPath: number[];
  selectedComponentPath?: number[];
}

function WegasComponentTitle({
  component,
  pageId,
  selectedPageId,
  componentPath,
  selectedComponentPath,
}: WegasComponentTitleProps) {
  const {
    onDeleteLayoutComponent,
    onEditComponent,
    onNewLayoutComponent,
    onDuplicateLayoutComponent,
    editMode,
  } = React.useContext(pageCTX);

  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const registeredComponent = usePageComponentStore(s => s[component.type]);

  let icon: Icon;
  if (registeredComponent != null) {
    icon = registeredComponent.icon;
  } else {
    icon = 'exclamation-triangle';
  }

  let title = component.type;
  if ('name' in component.props) {
    title += ` ${component.props.name}`;
  }

  const isSelected =
    pageId === selectedPageId &&
    JSON.stringify(componentPath) === JSON.stringify(selectedComponentPath);
  const isFocused = usePagesStateStore(
    isComponentFocused(editMode, pageId, componentPath),
  );

  return (
    <LayoutNodeTitle
      icon={icon}
      title={title}
      advancedTitle={title + ' ' + JSON.stringify(componentPath)}
      tooltip={
        registeredComponent == null
          ? i18nValues.pageEditor.unknownComponent
          : undefined
      }
      onMouseUp={() => onEditComponent(pageId, componentPath)}
      onMouseOver={e => {
        if (editMode /*&& !isDragging*/) {
          e.stopPropagation();
          pageDispatch(PageStateAction.setFocused(pageId, componentPath));
        }
      }}
      onMouseOut={e => {
        if (editMode /*&& !isDragging*/) {
          e.stopPropagation();
          pageDispatch(PageStateAction.unsetFocused());
        }
      }}
      className={cx({
        [globalSelection]: isSelected,
        [focusedComponentStyle]: isFocused,
      })}
    >
      {component.props?.children && (
        <ComponentAdder
          tooltip={i18nValues.pageEditor.addComponent}
          onSelect={componentType => {
            onNewLayoutComponent(
              pageId,
              store.getState().pages[pageId],
              componentPath,
              componentType,
              0,
            );
          }}
          className={CONTROLS_CLASSNAME}
        />
      )}
      {!component.uneditable && (
        <>
          <ConfirmButton
            icon="trash"
            onAction={success =>
              success &&
              onDeleteLayoutComponent(
                pageId,
                store.getState().pages[pageId],
                componentPath,
              )
            }
            disabled={componentPath.length === 0}
            tooltip={
              componentPath.length === 0
                ? i18nValues.pageEditor.firstCompoNotDeleted
                : i18nValues.pageEditor.deleteComponent
            }
            className={CONTROLS_CLASSNAME}
          />
          <Button
            icon="copy"
            onClick={() =>
              onDuplicateLayoutComponent(
                pageId,
                store.getState().pages[pageId],
                componentPath,
              )
            }
            disabled={componentPath.length === 0}
            tooltip={i18nValues.pageEditor.copyComponent}
            className={CONTROLS_CLASSNAME}
          />
        </>
      )}
    </LayoutNodeTitle>
  );
}

interface WegasComponentNodeProps {
  component: WegasComponent;
  pageId: string;
  selectedPageId?: string;
  componentPath: number[];
  selectedComponentPath?: number[];
}

function WegasComponentNode({
  component,
  pageId,
  selectedPageId,
  componentPath,
  selectedComponentPath,
}: WegasComponentNodeProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const data: PageComponentNode = { pageId, componentPath };
  let computedComponent: WegasComponent;

  if (component === undefined) {
    computedComponent = {
      type: 'Undefined',
      props: {},
    };
  } else {
    computedComponent = component;
  }

  if (!isWegasComponent(computedComponent)) {
    return (
      <LayoutNodeTitle
        icon="exclamation-circle"
        title={i18nValues.pageEditor.unknownComponent}
      />
    );
  }

  return (
    <TreeNode
      label={
        <WegasComponentTitle
          component={computedComponent}
          componentPath={componentPath}
          pageId={pageId}
          selectedComponentPath={selectedComponentPath}
          selectedPageId={selectedPageId}
        />
      }
      data={data}
      type={PAGE_LAYOUT_COMPONENT}
      acceptTypes={ALLOWED_PAGE_EDITOR_COMPONENTS}
      notDraggable={componentPath.length === 0}
      notDroppable={
        computedComponent.props?.children == null ||
        (computedComponent.props.children.length === 1 &&
          computedComponent.type === 'For each') ||
        computedComponent.type === 'If Else'
      }
    >
      {computedComponent.props?.children
        ? computedComponent.props?.children?.map((childComponent, i) => (
            <WegasComponentNode
              key={compToKey(childComponent, [...componentPath, i])}
              component={childComponent}
              pageId={pageId}
              selectedPageId={selectedPageId}
              componentPath={[...componentPath, i]}
              selectedComponentPath={selectedComponentPath}
            />
          ))
        : null}
    </TreeNode>
  );
}

interface PageIndexTitleProps {
  newPath: string[];
  indexItem: PageIndexItem;
  defaultPageId: string;
}

function PageIndexTitle({
  newPath,
  indexItem,
  defaultPageId,
}: PageIndexTitleProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const { onPageClick, selectedPageId } = React.useContext(pageCTX);
  const { dispatch } = store;
  const folderIsNotEmpty =
    isFolderItem(indexItem) && indexItem.items.length > 0;

  return (
    <LayoutNodeTitle
      icon={isPageItem(indexItem) ? 'file' : 'folder'}
      title={indexItem.name}
      advancedTitle={
        indexItem.name + (isPageItem(indexItem) ? ` ${indexItem.id}` : '')
      }
      onMouseUp={() => isPageItem(indexItem) && onPageClick(indexItem.id!)}
      className={cx({
        [globalSelection]:
          isPageItem(indexItem) && indexItem.id === selectedPageId,
        // [css({ backgroundColor: 'green' })]: indexItem.id === selectedPageId,
      })}
    >
      {isFolderItem(indexItem) && (
        <IndexItemAdder
          path={newPath}
          className={CONTROLS_CLASSNAME}
          tooltip={i18nValues.pageEditor.adddNewPageFolder}
        />
      )}
      {isPageItem(indexItem) && (
        <>
          <Button
            icon={
              indexItem.id === defaultPageId
                ? {
                    icon: 'star',
                    color: themeVar.colors.SuccessColor,
                  }
                : 'star'
            }
            onClick={() => {
              dispatch(Actions.PageActions.setDefault(indexItem.id!));
            }}
            tooltip={i18nValues.pageEditor.defaultPage}
            className={cx({
              [CONTROLS_CLASSNAME]: indexItem.id !== defaultPageId,
            })}
          />
          <Button
            icon={
              indexItem.scenaristPage
                ? {
                    icon: 'magic',
                    color: themeVar.colors.SuccessColor,
                  }
                : 'magic'
            }
            onClick={() => {
              dispatch(
                Actions.PageActions.updateIndexItem(newPath, {
                  ...indexItem,
                  scenaristPage: !indexItem.scenaristPage,
                }),
              );
            }}
            tooltip={i18nValues.pageEditor.scenaristPage}
            className={CONTROLS_CLASSNAME}
          />
          <Button
            icon={
              indexItem.trainerPage
                ? {
                    icon: 'chalkboard-teacher',
                    color: themeVar.colors.SuccessColor,
                  }
                : 'chalkboard-teacher'
            }
            onClick={() => {
              dispatch(
                Actions.PageActions.updateIndexItem(newPath, {
                  ...indexItem,
                  trainerPage: !indexItem.trainerPage,
                }),
              );
            }}
            tooltip={i18nValues.pageEditor.trainerPage}
            className={CONTROLS_CLASSNAME}
          />
        </>
      )}
      <IndexItemModifer
        path={newPath}
        indexItem={indexItem}
        className={CONTROLS_CLASSNAME}
      />
      <ConfirmButton
        icon="trash"
        onAction={success =>
          success && dispatch(Actions.PageActions.deleteIndexItem(newPath))
        }
        disabled={folderIsNotEmpty}
        tooltip={
          folderIsNotEmpty
            ? i18nValues.pageEditor.folderMustEmpty
            : i18nValues.pageEditor.deletePageOrFolder(
                isPageItem(indexItem)
                  ? i18nValues.fileBrowser.page
                  : i18nValues.fileBrowser.folder,
              )
        }
        className={CONTROLS_CLASSNAME}
      />
      {indexItem['@class'] === 'Page' && (
        <Button
          icon="copy"
          onClick={() => {
            const currentPage = store.getState().pages[indexItem.id!];
            dispatch(
              Actions.PageActions.createItem(
                newPath.slice(0, -1),
                { ...indexItem, name: indexItem.name + ' - copy' },
                currentPage,
              ),
            );
          }}
          className={CONTROLS_CLASSNAME}
        />
      )}
    </LayoutNodeTitle>
  );
}

interface PagesLayoutNodeProps {
  indexItem: PageIndexItem;
  path: string[];
  defaultPageId: string;
}

function PageIndexItemNode({
  indexItem,
  path,
  defaultPageId,
}: PagesLayoutNodeProps): JSX.Element | null {
  const i18nValues = useInternalTranslate(commonTranslations);
  const { selectedPageId, editedPath } = React.useContext(pageCTX);

  const pageSelector = React.useCallback(
    (s: State) => {
      if (isPageItem(indexItem)) {
        return s.pages[indexItem.id!];
      }
      return undefined;
    },
    [indexItem],
  );
  const page = useStore(pageSelector);
  const newPath = [
    ...path,
    isPageItem(indexItem) ? indexItem.id! : indexItem.name,
  ];
  const data: PageIndexNode = { pagePath: newPath };

  return isPageItem(indexItem) ? (
    page ? (
      <TreeNode
        label={
          <PageIndexTitle
            newPath={newPath}
            indexItem={indexItem}
            defaultPageId={defaultPageId}
          />
        }
        data={data}
        id={'PAGE' + indexItem.id}
        type={PAGE_LAYOUT_ITEM}
        // acceptTypes={[]}
        notDroppable
      >
        <WegasComponentNode
          key={indexItem.name + 'FIRSTCOMPONENT'}
          component={page}
          pageId={indexItem.id!}
          selectedPageId={selectedPageId}
          componentPath={[]}
          selectedComponentPath={editedPath}
        />
      </TreeNode>
    ) : (
      <span>{i18nValues.loading}...</span>
    )
  ) : (
    <TreeNode
      label={
        <PageIndexTitle
          newPath={newPath}
          indexItem={indexItem}
          defaultPageId={defaultPageId}
        />
      }
      // id={JSON.stringify(id)}
      data={data}
      type={PAGE_LAYOUT_ITEM}
      acceptTypes={[PAGE_LAYOUT_ITEM]}
    >
      {indexItem.items.map(v => (
        <PageIndexItemNode
          key={v.name}
          indexItem={v}
          path={newPath}
          defaultPageId={defaultPageId}
        />
      ))}
    </TreeNode>
  );
}

export default function PagesLayout() {
  const { onMoveLayoutComponent, onNewLayoutComponent } =
    React.useContext(pageCTX);
  const [openNodes, setOpenNodes] = React.useState<{
    [path: string]: boolean | undefined;
  }>({});

  const index = useStore(s => s.pages.index, deepDifferent);
  const i18nValues = useInternalTranslate(commonTranslations);

  const rootData: NodeBasicInfo<PageNode> = {
    index: 0,
    parent: { pagePath: [] },
  };

  const onDrop: OnMoveFn<PageNode | DnDComponent> = React.useCallback(
    (from, to) => {
      if (
        to.data != null &&
        from.data != null &&
        // Just safeguarding down, to.data will never be a DnDComponent
        !isDnDComponent(to.data)
      ) {
        const pages = store.getState().pages;
        const index = to.path.slice(-1)[0];
        // Checking if drag comes from the tree
        if (!isDnDComponent(from.data)) {
          // Checking if a page component is moved into another page component
          if (isPageComponentNode(from.data) && isPageComponentNode(to.data)) {
            const sourcePageId = from.data.pageId;
            const destPageId = to.data.pageId;
            const sourcePage = pages[sourcePageId];
            const destPage = pages[destPageId];
            const sourcePath = from.data.componentPath;
            const destPath = to.data.componentPath;

            onMoveLayoutComponent(
              sourcePageId,
              destPageId,
              sourcePage,
              destPage,
              sourcePath,
              destPath,
              index,
            );
          }
          // Checking if a page or a folder is moved into another folder
          // It's impossible to drop a page or a folder on another page as page nodes are undroppable
          else if (isPageIndexNode(from.data) && isPageIndexNode(to.data)) {
            store.dispatch(
              Actions.PageActions.moveIndexItem(
                from.data.pagePath,
                to.data.pagePath,
                index,
              ),
            );
          }
        }
        // Now the drag element comes from outside the tree
        else {
          if (isPageComponentNode(to.data)) {
            const sourceType = from.data.componentName;
            const destPageId = to.data.pageId;
            const destPage = pages[destPageId];
            const destPath = to.data.componentPath;
            onNewLayoutComponent(
              destPageId,
              destPage,
              destPath,
              sourceType,
              index,
            );
          }
        }
      }
    },
    [onMoveLayoutComponent, onNewLayoutComponent],
  );

  return (
    <Toolbar className={expandBoth}>
      <Toolbar.Header className={defaultPadding}>
        <IndexItemAdder path={[]} tooltip={i18nValues.add} />
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, grow, defaultPadding)}>
        <TreeView
          rootId="PageRoot"
          rootData={rootData.parent}
          nodeManagement={{
            openNodes,
            setOpenNodes,
          }}
          onMove={onDrop}
          acceptTypes={[PAGE_LAYOUT_ITEM]}
        >
          {index ? (
            index.root.items.map(v => (
              <PageIndexItemNode
                key={v.name}
                indexItem={v}
                path={[]}
                defaultPageId={index.defaultPageId}
              />
            ))
          ) : (
            <span>{i18nValues.loading}...</span>
          )}
        </TreeView>
      </Toolbar.Content>
    </Toolbar>
  );
}
