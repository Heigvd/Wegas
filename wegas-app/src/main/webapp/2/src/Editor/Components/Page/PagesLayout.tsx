import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { Container, Node, DropResult } from '../Views/TreeView';
import { flex, flexColumn, grow, expand } from '../../../css/classes';
import { cx, css } from 'emotion';
import { FontAwesome, IconComp, Icon } from '../Views/FontAwesome';
import { nodeContentStyle } from '../Variable/VariableTree';
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
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { themeVar } from '../../../Components/Theme';

const bulletCSS = {
  width: '1em',
};

const titleLabelStyle = css({
  flex: '0 0 auto',
});

const defaultPage = {
  type: 'List',
  props: {
    children: [],
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
  componentPath?: number[];
}

type NodeId = IndexNodeId | ComponentNodeId;

function isComponentNodeId(nodeId: NodeId): nodeId is ComponentNodeId {
  return 'pageId' in nodeId;
}

interface IndexItemAdderProps {
  path: string[];
}

function IndexItemAdder({ path }: IndexItemAdderProps) {
  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const { dispatch } = store;

  return (
    <>
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
            id: 'newpage' as LayoutModalStates['type'],
          },
          {
            label: (
              <div>
                <FontAwesome icon="folder" style={bulletCSS} />
                New folder
              </div>
            ),
            id: 'newfolder' as LayoutModalStates['type'],
          },
        ]}
        onSelect={({ id }) => setModalState({ type: id } as PageModalState)}
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
    </>
  );
}

interface IndexItemModiferProps {
  path: string[];
  indexItem: PageIndexItem;
}

function IndexItemModifer({ path, indexItem }: IndexItemModiferProps) {
  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const { dispatch } = store;

  return (
    <>
      <IconButton
        icon="edit"
        tooltip="Edit item name"
        onClick={() => {
          setModalState({ type: 'editpage' });
        }}
      />
      {modalState && modalState.type === 'editpage' && (
        <>
          <TextPrompt
            placeholder="Item name"
            defaultFocus
            onAction={(success, value) => {
              if (value === '') {
                setModalState({
                  type: 'error',
                  label: 'The item must have a name',
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
    </>
  );
}

const compToKey = (component: WegasComponent) =>
  JSON.stringify({
    type: component.type,
    props: omit(component.props, 'children'),
  });

interface WegasComponentNodeProps {
  component: WegasComponent;
  nodeProps: () => {};
  pageId: string;
  componentPath: number[];
}

function WegasComponentNode({
  component,
  nodeProps,
  pageId,
  componentPath,
}: WegasComponentNodeProps) {
  const Title = () => {
    const registeredComponent = usePageComponentStore(s => s[component.type]);
    let icon: Icon;
    if (registeredComponent != null) {
      icon = registeredComponent.getIcon();
    } else {
      icon = 'exclamation-triangle';
    }
    return (
      <div
        className={cx(nodeContentStyle, flex, grow)}
        title={registeredComponent == null ? 'Unknown component' : undefined}
      >
        <IconComp icon={icon} style={bulletCSS} />
        {component.type}
        {'name' in component.props ? ` : ${component.props.name}` : ''}
      </div>
    );
  };

  return (
    <Node {...nodeProps()} header={<Title />} id={{ pageId, componentPath }}>
      {({ nodeProps }) =>
        component.props?.children?.map((childComponent, i) => (
          <WegasComponentNode
            key={compToKey(childComponent)}
            nodeProps={nodeProps}
            component={childComponent}
            pageId={pageId}
            componentPath={[...componentPath, i]}
          />
        )) || null
      }
    </Node>
  );
}

interface PagesLayoutNodeProps extends PagesLayoutProps {
  indexItem: PageIndexItem;
  path: string[];
  defaultPageId: string;
  nodeProps: () => {};
}

function PageIndexItemNode({
  indexItem,
  path,
  defaultPageId,
  nodeProps,
  selectedPageId,
  onPageClick,
  componentControls,
}: PagesLayoutNodeProps): JSX.Element | null {
  const { dispatch } = store;
  const newPath = [
    ...path,
    isPageItem(indexItem) ? indexItem.id! : indexItem.name,
  ];
  const folderIsNotEmpty =
    isFolderItem(indexItem) && indexItem.items.length > 0;

  const { page } = useStore(s => {
    if (isPageItem(indexItem)) {
      return { page: s.pages[indexItem.id!] };
    }
    return {};
  }, deepDifferent);

  const Title = () => (
    <div
      className={cx(nodeContentStyle, flex, grow, {
        [css({ backgroundColor: themeVar.primaryHoverColor })]:
          isPageItem(indexItem) && indexItem.id === selectedPageId,
      })}
      onClick={() => isPageItem(indexItem) && onPageClick(indexItem.id!)}
    >
      <FontAwesome
        icon={isPageItem(indexItem) ? 'file' : 'folder'}
        style={bulletCSS}
      />
      <>
        <div className={cx(titleLabelStyle, grow)}>{indexItem.name}</div>
        {isFolderItem(indexItem) && <IndexItemAdder path={newPath} />}
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
            />
          </>
        )}
        <IndexItemModifer path={newPath} indexItem={indexItem} />
        <ConfirmButton
          icon="trash"
          onAction={success =>
            success && dispatch(Actions.PageActions.deleteIndexItem(newPath))
          }
          disabled={folderIsNotEmpty}
          tooltip={
            folderIsNotEmpty
              ? 'The folder must be empty to delete it'
              : undefined
          }
        />
      </>
    </div>
  );

  return isPageItem(indexItem) ? (
    page ? (
      <Node {...nodeProps()} header={<Title />} id={{ pagePath: newPath }}>
        {({ nodeProps }) => [
          <WegasComponentNode
            key={indexItem.name + 'FIRSTCOMPONENT'}
            nodeProps={nodeProps}
            component={page}
            pageId={indexItem.id!}
            componentPath={[]}
          />,
        ]}
      </Node>
    ) : (
      <span>Loading ...</span>
    )
  ) : (
    <Node {...nodeProps()} header={<Title />} id={{ pagePath: newPath }}>
      {({ nodeProps }) =>
        indexItem.items.map(v => (
          <PageIndexItemNode
            nodeProps={nodeProps}
            key={v.name}
            indexItem={v}
            path={newPath}
            componentControls={componentControls}
            defaultPageId={defaultPageId}
            onPageClick={onPageClick}
            selectedPageId={selectedPageId}
          />
        ))
      }
    </Node>
  );
}

interface ComponentControls {
  onNewComponent: (
    pagePath: string,
    componentPath: number[],
    componentType: string,
  ) => void;
  onDeleteComponent: (pagePath: string[], compoentPath: string[]) => void;
}

interface PagesLayoutProps {
  onPageClick: (selectedPageId: string) => void;
  selectedPageId?: string;
  componentControls: ComponentControls;
}

export function PagesLayout(props: PagesLayoutProps) {
  const index = useStore(s => s.pages.index, deepDifferent);
  const { dispatch } = store;

  return (
    <Toolbar className={expand}>
      <Toolbar.Header>
        <IndexItemAdder path={[]} />
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, grow)}>
        <Container
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
              // TODO : Implement moving component from page to page
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
        </Container>
      </Toolbar.Content>
    </Toolbar>
  );
}
