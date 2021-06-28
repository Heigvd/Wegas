import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import {
  flex,
  flexColumn,
  grow,
  itemCenter,
  expandBoth,
  globalSelection,
  defaultPadding,
} from '../../../css/classes';
import { cx, css } from 'emotion';
import { FontAwesome, IconComp, Icon, Icons } from '../Views/FontAwesome';
import {
  actionNodeContentStyle,
  nodeContentStyle,
  TREEVIEW_ITEM_TYPE as TREEVIEW_INDEX_ITEM_TYPE,
} from '../Variable/VariableTree';
import { omit } from 'lodash-es';
import { DropMenu } from '../../../Components/DropMenu';
import { TextPrompt } from '../TextPrompt';
import { isPageItem, isFolderItem } from '../../../Helper/pages';
import { useStore, store } from '../../../data/Stores/store';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Actions } from '../../../data';
import { MessageString } from '../MessageString';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import {
  featuresCTX,
  isFeatureEnabled,
} from '../../../Components/Contexts/FeaturesProvider';
import { pageEditorCTX, pageCTX } from './PageEditor';
import {
  Tree,
  TreeNode,
  GetParentPropsFn,
  ItemDescription,
  isItemDescription,
} from '../Views/TreeView/TreeView';
import {
  usePagesStateStore,
  isComponentFocused,
  pagesStateStore,
  PageStateAction,
} from '../../../data/Stores/pageStore';
import { PAGEEDITOR_COMPONENT_TYPE, isDnDComponent } from './ComponentPalette';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { State } from '../../../data/Reducer/reducers';
import { languagesCTX } from '../../../Components/Contexts/LanguagesProvider';
import { internalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';

const bulletCSS = {
  width: '1em',
};

const CONTROLS_CLASSNAME = 'page-index-item-controls';

const PAGE_LAYOUT_ITEM = 'PAGE_LAYOUT_ITEM';
export const PAGE_LAYOUT_COMPONENT = 'PAGE_LAYOUT_COMPONENT';

const titleStyle = css({
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: themeVar.dimensions.BorderRadius,
  [`&>.${CONTROLS_CLASSNAME}`]: {
    visibility: 'hidden',
  },
  [`:hover>.${CONTROLS_CLASSNAME}`]: {
    visibility: 'visible',
  },
});

// const selectedIndexItemStyle = css({
//   borderColor: themeVar.colors.BorderColor,
// });

// const selectedComponentStyle = css({
//   borderColor: themeVar.colors.BorderColor,
// });

const focusedComponentStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
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

interface IndexNodeId {
  pagePath: string[];
}

export interface ComponentNodeId {
  pageId: string;
  page: WegasComponent;
  componentPath: number[];
}

type NodeId = IndexNodeId | ComponentNodeId;

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

function isComponentNodeId(nodeId: NodeId): nodeId is ComponentNodeId {
  return 'pageId' in nodeId;
}

export type LayoutDndComponent = ItemDescription<ComponentNodeId>;

export function isLayoutDndComponent(
  item?: Partial<LayoutDndComponent>,
): item is LayoutDndComponent {
  return isItemDescription(item) && isComponentNodeId(item.id);
}

interface LayoutButtonProps extends ClassStyleId {
  tooltip?: string;
}

// TODO : Generalize the 2 following component ( (IndexItemAdder,IndexItemModifer) => TextPrompter)

interface IndexItemAdderProps extends LayoutButtonProps {
  path: string[];
}

function IndexItemAdder({
  path,
  className,
  style,
  tooltip,
}: IndexItemAdderProps) {
  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const { dispatch } = store;
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);

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
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);
  const i18nEditorValues = internalTranslate(editorTabsTranslations, lang);

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
        items={Object.values(components).map(v => ({
          label: v.componentName,
          id: v.componentName,
        }))}
        onSelect={({ id }) => {
          onSelect(id);
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
        nodeContentStyle,
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
      <IconComp icon={icon} style={bulletCSS} />
      <div className={grow}>{newTitle}</div>
      {children}
    </div>
  );
}

const pageDispatch = pagesStateStore.dispatch;

interface WegasComponentTitleProps {
  page: WegasComponent;
  component: WegasComponent;
  pageId: string;
  selectedPageId?: string;
  componentPath: number[];
  selectedComponentPath?: number[];
  componentControls: ComponentControls;
}

function WegasComponentTitle({
  page,
  component,
  pageId,
  selectedPageId,
  componentPath,
  selectedComponentPath,
  componentControls,
}: WegasComponentTitleProps) {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);
  const registeredComponent = usePageComponentStore(s => s[component.type]);
  const { editMode } = React.useContext(pageCTX);

  const { onDelete, onEdit, onNew, onDuplicate } = componentControls;

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
      onMouseUp={() => onEdit(pageId, componentPath)}
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
            onNew(pageId, page, componentPath, componentType, 0);
          }}
          className={CONTROLS_CLASSNAME}
        />
      )}
      {!component.uneditable && (
        <>
          <ConfirmButton
            icon="trash"
            onAction={success =>
              success && onDelete(pageId, page, componentPath)
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
            onClick={() => onDuplicate(pageId, page, componentPath)}
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
  getParentProps: GetParentPropsFn<NodeId>;
  pageId: string;
  selectedPageId?: string;
  componentPath: number[];
  selectedComponentPath?: number[];
  componentControls: ComponentControls;
}

function WegasComponentNode({
  component,
  getParentProps,
  pageId,
  selectedPageId,
  componentPath,
  selectedComponentPath,
  componentControls,
}: WegasComponentNodeProps) {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);
  const pageSelector = React.useCallback(
    (s: State) => s.pages[pageId],
    [pageId],
  );
  const page = useStore(pageSelector);
  const id: ComponentNodeId = { pageId, page, componentPath };
  const parentProps = getParentProps();
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
      {...parentProps}
      title={
        <WegasComponentTitle
          component={computedComponent}
          componentControls={componentControls}
          componentPath={componentPath}
          page={page}
          pageId={pageId}
          selectedComponentPath={selectedComponentPath}
          selectedPageId={selectedPageId}
          //isDragging={isDragging}
        />
      }
      id={id}
      type={PAGE_LAYOUT_COMPONENT}
      acceptType={[
        PAGE_LAYOUT_COMPONENT,
        TREEVIEW_INDEX_ITEM_TYPE,
        PAGEEDITOR_COMPONENT_TYPE,
      ]}
      noDrag={componentPath.length === 0}
      noDrop={
        computedComponent.props?.children == null ||
        (computedComponent.props.children.length === 1 &&
          computedComponent.type === 'For each') ||
        computedComponent.type === 'If Else'
      }
    >
      {computedComponent.props?.children
        ? getParentProps =>
            computedComponent.props?.children?.map((childComponent, i) => (
              <WegasComponentNode
                key={compToKey(childComponent, [...componentPath, i])}
                getParentProps={getParentProps}
                component={childComponent}
                pageId={pageId}
                selectedPageId={selectedPageId}
                componentPath={[...componentPath, i]}
                selectedComponentPath={selectedComponentPath}
                componentControls={componentControls}
              />
            ))
        : null}
    </TreeNode>
  );
}

interface PageIndexTitleProps {
  newPath: string[];
  indexItem: PageIndexItem;
  onPageClick: (selectedPageId: string) => void;
  defaultPageId: string;
}

function PageIndexTitle({
  newPath,
  indexItem,
  onPageClick,
  defaultPageId,
}: PageIndexTitleProps) {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);
  const { selectedPageId } = React.useContext(pageEditorCTX);
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

interface PagesLayoutNodeProps extends PagesLayoutProps {
  indexItem: PageIndexItem;
  path: string[];
  defaultPageId: string;
  getParentProps: GetParentPropsFn<NodeId>;
}

function PageIndexItemNode({
  indexItem,
  path,
  defaultPageId,
  getParentProps,
  onPageClick,
  componentControls,
}: PagesLayoutNodeProps): JSX.Element | null {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);
  const { selectedPageId, editedPath } = React.useContext(pageEditorCTX);
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
  const id: IndexNodeId = { pagePath: newPath };

  const parentProps = getParentProps();

  return isPageItem(indexItem) ? (
    page ? (
      <TreeNode
        {...parentProps}
        title={
          <PageIndexTitle
            newPath={newPath}
            indexItem={indexItem}
            onPageClick={onPageClick}
            defaultPageId={defaultPageId}
          />
        }
        id={id}
        type={PAGE_LAYOUT_ITEM}
      >
        {getParentProps => (
          <WegasComponentNode
            key={indexItem.name + 'FIRSTCOMPONENT'}
            getParentProps={getParentProps}
            component={page}
            pageId={indexItem.id!}
            selectedPageId={selectedPageId}
            componentPath={[]}
            selectedComponentPath={editedPath}
            componentControls={componentControls}
          />
        )}
      </TreeNode>
    ) : (
      <span>{i18nValues.loading}...</span>
    )
  ) : (
    <TreeNode
      {...parentProps}
      title={
        <PageIndexTitle
          newPath={newPath}
          indexItem={indexItem}
          onPageClick={onPageClick}
          defaultPageId={defaultPageId}
        />
      }
      id={id}
      type={PAGE_LAYOUT_ITEM}
    >
      {getParentProps =>
        indexItem.items.map(v => (
          <PageIndexItemNode
            getParentProps={getParentProps}
            key={v.name}
            indexItem={v}
            path={newPath}
            componentControls={componentControls}
            defaultPageId={defaultPageId}
            onPageClick={onPageClick}
          />
        ))
      }
    </TreeNode>
  );
}

interface ComponentControls {
  onNew: (
    pageId: string,
    page: WegasComponent,
    componentPath: number[],
    componentType: string,
    index: number,
  ) => void;
  onDuplicate: (
    pageId: string,
    page: WegasComponent,
    componentPath: number[],
  ) => void;
  onDelete: (
    pageId: string,
    page: WegasComponent,
    compoentPath: number[],
  ) => void;
  onEdit: (pageId?: string, componentPath?: number[]) => void;
  onMove: (
    sourcePageId: string,
    destPageId: string,
    sourcePage: WegasComponent,
    destPage: WegasComponent,
    sourcePath: number[],
    destPath: number[],
    destIndex: number,
  ) => void;
}

interface PagesLayoutProps {
  onPageClick: (selectedPageId: string) => void;
  componentControls: ComponentControls;
}

export function PagesLayout(props: PagesLayoutProps) {
  const index = useStore(s => s.pages.index, deepDifferent);
  const { selectedPageId, selectedPage } = React.useContext(pageEditorCTX);
  const { dispatch } = store;
  const { componentControls } = props;
  const { onMove, onNew } = componentControls;
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(commonTranslations, lang);

  return (
    <Toolbar className={expandBoth}>
      <Toolbar.Header className={defaultPadding}>
        <IndexItemAdder path={[]} />
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, grow)}>
        <Tree<NodeId>
          id={{ pagePath: [] }}
          type="NODE"
          onDrop={({ target, id, item }) => {
            const computedTargetParent = target.parent
              ? target.parent
              : { pagePath: [] };

            if (
              id == null &&
              isDnDComponent(item) &&
              isComponentNodeId(computedTargetParent) &&
              selectedPageId != null &&
              selectedPage != null
            ) {
              if (item.path != null) {
                onMove(
                  selectedPageId,
                  computedTargetParent.pageId,
                  selectedPage,
                  computedTargetParent.page,
                  item.path,
                  computedTargetParent.componentPath,
                  target.index || 0,
                );
              } else {
                onNew(
                  computedTargetParent.pageId,
                  computedTargetParent.page,
                  computedTargetParent.componentPath,
                  item.componentName,
                  target.index || 0,
                );
              }
            } else {
              if (
                !isComponentNodeId(id) &&
                !isComponentNodeId(computedTargetParent)
              ) {
                dispatch(
                  Actions.PageActions.moveIndexItem(
                    id.pagePath,
                    computedTargetParent.pagePath,
                    target.index,
                  ),
                );
              } else if (
                isComponentNodeId(id) &&
                isComponentNodeId(computedTargetParent)
              ) {
                onMove(
                  id.pageId,
                  computedTargetParent.pageId,
                  id.page,
                  computedTargetParent.page,
                  id.componentPath,
                  computedTargetParent.componentPath,
                  target.index || 0,
                );
              }
            }
          }}
        >
          {getParentProps => (
            <div className={cx(flex, grow, flexColumn)}>
              {index ? (
                index.root.items.map(v => (
                  <PageIndexItemNode
                    getParentProps={getParentProps}
                    key={v.name}
                    indexItem={v}
                    path={[]}
                    defaultPageId={index.defaultPageId}
                    {...props}
                  />
                ))
              ) : (
                <span>{i18nValues.loading}...</span>
              )}
            </div>
          )}
        </Tree>
      </Toolbar.Content>
    </Toolbar>
  );
}
