import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import {
  flex,
  flexColumn,
  grow,
  itemCenter,
  expandBoth,
} from '../../../css/classes';
import { cx, css } from 'emotion';
import { FontAwesome, IconComp, Icon, Icons } from '../Views/FontAwesome';
import {
  nodeContentStyle,
  TREEVIEW_ITEM_TYPE as TREEVIEW_INDEX_ITEM_TYPE,
} from '../Variable/VariableTree';
import { omit } from 'lodash-es';
import { Menu } from '../../../Components/Menu';
import { TextPrompt } from '../TextPrompt';
import { ConfirmButton } from '../../../Components/Inputs/Button/ConfirmButton';
import { isPageItem, isFolderItem } from '../../../Helper/pages';
import { useStore, store } from '../../../data/store';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Actions } from '../../../data';
import { MessageString } from '../MessageString';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { featuresCTX } from '../../../Components/Contexts/FeaturesProvider';
import { themeVar } from '../../../Components/Theme';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { classNameOrEmpty } from '../../../Helper/className';
import { pageEditorCTX, pageCTX } from './PageEditor';
import { Tree, TreeNode, GetParentPropsFn } from '../Views/TreeView/TreeView';
import {
  usePagesStateStore,
  isComponentFocused,
  pagesStateStore,
  PageStateAction,
} from '../../../data/pageStore';

const bulletCSS = {
  width: '1em',
};

const controlsClassName = 'page-index-item-controls';

const pageLayoutItemType = 'PAGE_LAYOUT_ITEM';
const TREEVIEW_COMPONENT_TYPE = 'PAGE_LAYOUT_COMPONENT';

const titleStyle = css({
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderRadius: themeVar.borderRadius,
  [`&>.${controlsClassName}`]: {
    visibility: 'hidden',
  },
  [`:hover>.${controlsClassName}`]: {
    visibility: 'visible',
  },
});

const selectedIndexItemStyle = css({
  borderColor: themeVar.primaryDarkerColor,
});

const selectedComponentStyle = css({
  borderColor: themeVar.primaryLighterColor,
});

const focusedComponentStyle = css({
  backgroundColor: themeVar.primaryHoverColor,
});

const defaultPage = {
  type: 'FlexList',
  props: {
    children: [],
    layout: {
      flexDirection: 'column',
    },
    style: {
      width: '100%',
      height: '100%',
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

interface ComponentNodeId {
  pageId: string;
  page: WegasComponent;
  componentPath: number[];
}

type NodeId = IndexNodeId | ComponentNodeId;

function isComponentNodeId(nodeId: NodeId): nodeId is ComponentNodeId {
  return 'pageId' in nodeId;
}

interface LayoutButtonProps extends ClassAndStyle {
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

  return (
    <div className={className} style={style} title={tooltip}>
      <Menu
        icon="plus"
        items={[
          {
            label: (
              <div>
                <FontAwesome icon="file" style={bulletCSS} />
                New page
              </div>
            ),
            value: 'newpage' as LayoutModalStates['type'],
          },
          {
            label: (
              <div>
                <FontAwesome icon="folder" style={bulletCSS} />
                New folder
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
                modalState.type === 'newpage' ? 'Page name' : 'Folder name'
              }
              defaultFocus
              onAction={(success, value) => {
                if (value === '') {
                  setModalState({
                    type: 'error',
                    label: 'The item must have a name',
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

  return (
    <div className={className} title={tooltip}>
      <IconButton
        icon="edit"
        tooltip={`Edit ${isPageItem(indexItem) ? 'page' : 'folder'} name`}
        onClick={() => {
          setModalState({ type: 'editpage' });
        }}
      />
      {modalState && modalState.type === 'editpage' && (
        <>
          <TextPrompt
            placeholder={`${isPageItem(indexItem) ? 'Page' : 'Folder'} name`}
            defaultFocus
            onAction={(success, value) => {
              if (value === '') {
                setModalState({
                  type: 'error',
                  label: `The ${
                    isPageItem(indexItem) ? 'page' : 'folder'
                  } must have a name`,
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
      <Menu
        icon="plus"
        items={Object.values(components).map(v => ({
          label: v.componentName,
          id: v.componentName,
        }))}
        onSelect={({ id }) => onSelect(id)}
      />
    </div>
  );
}

const compToKey = (component: WegasComponent) =>
  JSON.stringify({
    type: component.type,
    props: omit(component.props, 'children'),
  });

interface LayoutNodeTitleProps extends ClassAndStyle {
  icon: Icons;
  title: string;
  advancedTitle?: string;
  tooltip?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseOut?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  classSelector?: string[];
}

function LayoutNodeTitle({
  icon,
  title,
  advancedTitle,
  tooltip,
  onClick,
  onMouseOver,
  onMouseOut,
  className,
  style,
  children,
}: React.PropsWithChildren<LayoutNodeTitleProps>) {
  const { currentFeatures } = React.useContext(featuresCTX);

  const newTitle =
    currentFeatures.includes('ADVANCED') && advancedTitle != null
      ? advancedTitle
      : title;

  return (
    <div
      onClick={onClick}
      className={
        cx(nodeContentStyle, titleStyle, flex, grow, itemCenter, {}) +
        classNameOrEmpty(className)
      }
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
  const registeredComponent = usePageComponentStore(s => s[component.type]);
  const { editMode } = React.useContext(pageCTX);

  const { onDelete, onEdit, onNew } = componentControls;

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
      tooltip={registeredComponent == null ? 'Unknown component' : undefined}
      onClick={() => onEdit(pageId, componentPath)}
      onMouseOver={e => {
        if (editMode) {
          e.stopPropagation();
          pageDispatch(PageStateAction.setFocused(pageId, componentPath));
        }
      }}
      onMouseOut={e => {
        if (editMode) {
          e.stopPropagation();
          pageDispatch(PageStateAction.unsetFocused());
        }
      }}
      className={cx({
        [selectedComponentStyle]: isSelected,
        [focusedComponentStyle]: isFocused,
      })}
    >
      {component.props?.children && (
        <ComponentAdder
          tooltip="Add a component"
          onSelect={componentType =>
            onNew(pageId, page, componentPath, componentType)
          }
          className={controlsClassName}
        />
      )}
      <ConfirmButton
        icon="trash"
        onAction={success => success && onDelete(pageId, page, componentPath)}
        disabled={componentPath.length === 0}
        tooltip={
          componentPath.length === 0
            ? 'The first component of a page connot be deleted'
            : 'Delete the component'
        }
        className={controlsClassName}
      />
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
  const page = useStore(s => s.pages[pageId], deepDifferent);

  const id: ComponentNodeId = { pageId, page, componentPath };
  const parentProps = getParentProps();

  return (
    <TreeNode
      {...parentProps}
      title={
        <WegasComponentTitle
          component={component}
          componentControls={componentControls}
          componentPath={componentPath}
          page={page}
          pageId={pageId}
          selectedComponentPath={selectedComponentPath}
          selectedPageId={selectedPageId}
        />
      }
      id={id}
      type={TREEVIEW_COMPONENT_TYPE}
      acceptType={[
        TREEVIEW_COMPONENT_TYPE,
        TREEVIEW_INDEX_ITEM_TYPE,
        // PAGEEDITOR_COMPONENT_TYPE,
      ]}
      noDrag={componentPath.length === 0}
      noDrop={component.props?.children == null}
    >
      {component.props?.children
        ? getParentProps =>
            component.props?.children?.map((childComponent, i) => (
              <WegasComponentNode
                key={compToKey(childComponent)}
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
      onClick={() => isPageItem(indexItem) && onPageClick(indexItem.id!)}
      className={cx({
        [selectedIndexItemStyle]:
          isPageItem(indexItem) && indexItem.id === selectedPageId,
      })}
    >
      {isFolderItem(indexItem) && (
        <IndexItemAdder
          path={newPath}
          className={controlsClassName}
          tooltip="Add new page or folder"
        />
      )}
      {isPageItem(indexItem) && (
        <>
          <IconButton
            icon={
              indexItem.id === defaultPageId
                ? { icon: 'star', color: themeVar.successColor }
                : 'star'
            }
            onClick={() => {
              dispatch(Actions.PageActions.setDefault(indexItem.id!));
            }}
            tooltip="Default page"
            className={cx({
              [controlsClassName]: indexItem.id !== defaultPageId,
            })}
          />
          <IconButton
            icon={
              indexItem.scenaristPage
                ? { icon: 'magic', color: themeVar.successColor }
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
            tooltip="Scenarist page"
            className={controlsClassName}
          />
          <IconButton
            icon={
              indexItem.trainerPage
                ? { icon: 'chalkboard-teacher', color: themeVar.successColor }
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
            tooltip="Trainer page"
            className={controlsClassName}
          />
        </>
      )}
      <IndexItemModifer
        path={newPath}
        indexItem={indexItem}
        className={controlsClassName}
      />
      <ConfirmButton
        icon="trash"
        onAction={success =>
          success && dispatch(Actions.PageActions.deleteIndexItem(newPath))
        }
        disabled={folderIsNotEmpty}
        tooltip={
          folderIsNotEmpty
            ? 'The folder must be empty to delete it'
            : `Delete the ${isPageItem(indexItem) ? 'page' : 'folder'}`
        }
        className={controlsClassName}
      />
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
  const { selectedPageId, editedPath } = React.useContext(pageEditorCTX);
  const { page } = useStore(s => {
    if (isPageItem(indexItem)) {
      return { page: s.pages[indexItem.id!] };
    }
    return {};
  }, deepDifferent);
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
        type={pageLayoutItemType}
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
      <span>Loading ...</span>
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
      type={pageLayoutItemType}
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

// interface PagesLayoutNodeProps extends PagesLayoutProps {
//   indexItem: PageIndexItem;
//   path: string[];
//   defaultPageId: string;
//   nodeProps: () => {};
// }

// function PageIndexItemNode({
//   indexItem,
//   path,
//   defaultPageId,
//   nodeProps,
//   onPageClick,
//   componentControls,
// }: PagesLayoutNodeProps): JSX.Element | null {
//   const { selectedPageId, editedPath } = React.useContext(pageEditorCTX);
//   const { page } = useStore(s => {
//     if (isPageItem(indexItem)) {
//       return { page: s.pages[indexItem.id!] };
//     }
//     return {};
//   }, deepDifferent);
//   const newPath = [
//     ...path,
//     isPageItem(indexItem) ? indexItem.id! : indexItem.name,
//   ];
//   const id: IndexNodeId = { pagePath: newPath };

//   return isPageItem(indexItem) ? (
//     page ? (
//       <Node
//         {...nodeProps()}
//         header={
//           <PageIndexTitle
//             newPath={newPath}
//             indexItem={indexItem}
//             onPageClick={onPageClick}
//             defaultPageId={defaultPageId}
//           />
//         }
//         id={id}
//         dragId={pageLayoutItemType}
//       >
//         {({ nodeProps }) => [
//           <WegasComponentNode
//             key={indexItem.name + 'FIRSTCOMPONENT'}
//             nodeProps={nodeProps}
//             component={page}
//             pageId={indexItem.id!}
//             selectedPageId={selectedPageId}
//             componentPath={[]}
//             selectedComponentPath={editedPath}
//             componentControls={componentControls}
//           />,
//         ]}
//       </Node>
//     ) : (
//       <span>Loading ...</span>
//     )
//   ) : (
//     <Node
//       {...nodeProps()}
//       header={
//         <PageIndexTitle
//           newPath={newPath}
//           indexItem={indexItem}
//           onPageClick={onPageClick}
//           defaultPageId={defaultPageId}
//         />
//       }
//       id={id}
//       dragId={pageLayoutItemType}
//     >
//       {({ nodeProps }) =>
//         indexItem.items.map(v => (
//           <PageIndexItemNode
//             nodeProps={nodeProps}
//             key={v.name}
//             indexItem={v}
//             path={newPath}
//             componentControls={componentControls}
//             defaultPageId={defaultPageId}
//             onPageClick={onPageClick}
//           />
//         ))
//       }
//     </Node>
//   );
// }

interface ComponentControls {
  onNew: (
    pageId: string,
    page: WegasComponent,
    componentPath: number[],
    componentType: string,
  ) => void;
  onDelete: (
    pageId: string,
    page: WegasComponent,
    compoentPath: number[],
  ) => void;
  onEdit: (pageId: string, compoentPath: number[]) => void;
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
  const { dispatch } = store;
  const { componentControls } = props;
  const { onMove } = componentControls;

  return (
    <Toolbar className={expandBoth}>
      <Toolbar.Header>
        <IndexItemAdder path={[]} />
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, grow)}>
        <Tree<NodeId>
          id={{ pagePath: [] }}
          type="NODE"
          onDrop={({ target, id }) => {
            const computedTargetParent = target.parent
              ? target.parent
              : { pagePath: [] };

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
                <span>Loading ...</span>
              )}
            </div>
          )}
        </Tree>
        {/* <Container
          onDropResult={({ target, id }: DropResult<NodeId>) => {
            const computedTargetParent = target.parent
              ? target.parent
              : { pagePath: [] };

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
                target.index,
              );
            }
          }}
        >
          {({ nodeProps }) => (
            <div className={cx(flex, grow, flexColumn)}>
              {index ? (
                index.root.items.map(v => (
                  <PageIndexItemNode
                    nodeProps={nodeProps}
                    key={v.name}
                    indexItem={v}
                    path={[]}
                    defaultPageId={index.defaultPageId}
                    {...props}
                  />
                ))
              ) : (
                <span>Loading ...</span>
              )}
            </div>
          )}
        </Container> */}
      </Toolbar.Content>
    </Toolbar>
  );
}
