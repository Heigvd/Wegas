import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { JSONandJSEditor } from '../ScriptEditors/JSONandJSEditor';
import { deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { MainLinearLayout } from '../LinearTabLayout/LinearLayout';
import ComponentEditor from './ComponentEditor';
import { PageLoader } from './PageLoader';
import { Button } from '../../../Components/Inputs/Button/Button';
import { Toggler } from '../../../Components/Inputs/Button/Toggler';
import { css, cx } from 'emotion';
import { noop } from 'lodash-es';
import { PagesLayout } from './PagesLayout';
import { store, useStore } from '../../../data/store';
import { Actions } from '../../../data';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { themeVar } from '../../../Components/Theme';
import { flex, grow } from '../../../css/classes';

const innerButtonStyle = css({
  margin: '2px auto 2px auto',
  width: 'fit-content',
});

interface PageContext {
  editMode: boolean;
  showBorders: boolean;
  showControls: boolean;
  onDrop: (dndComponent: DnDComponent, path: number[], index?: number) => void;
  onDelete: (path: number[]) => void;
  onEdit: (path: number[]) => void;
  onUpdate: (value: WegasComponent, path?: number[], patch?: boolean) => void;
}

export const pageCTX = React.createContext<PageContext>({
  editMode: false,
  showBorders: false,
  showControls: true,
  onDrop: noop,
  onEdit: noop,
  onDelete: noop,
  onUpdate: noop,
});

// interface PageModalState {
//   type: 'newpage' | 'editpage' | 'close';
// }
// interface ErrorModalState {
//   type: 'error';
//   label: string;
// }
// interface SaveModalState {
//   type: 'save';
//   label: OnSaveStatus;
// }
// type ModalState = PageModalState | ErrorModalState | SaveModalState;

// const savingProgressStatus: OnSaveStatus = {
//   status: 'warning',
//   text: 'Saving page in progress',
// };

// const savingDoneStatus: OnSaveStatus = {
//   status: 'succes',
//   text: 'The page has been saved',
// };

// const savingErrorStatus: OnSaveStatus = {
//   status: 'error',
//   text: 'Error : The page has not been saved',
// };

interface PageEditorState {
  selectedPageId?: string;
  editedPath?: number[];
}

interface PageEditorContext extends PageEditorState {
  loading: boolean;
  selectedPage?: WegasComponent;
  // findComponent?: (
  //   path: string[],
  // ) => {
  //   newPage: WegasComponent;
  //   component?: WegasComponent;
  //   parent?: WegasComponent;
  // };
}
export const pageEditorCTX = React.createContext<PageEditorContext>({
  loading: false,
});

export const computePageLabel = (id: string, pageName?: string | null) =>
  pageName ? `${pageName} (${id})` : id;

export const returnPages = (
  pages: Pages,
  item?: PageIndexItem,
): PagesWithName => {
  if (item == null) {
    return {};
  }
  if (item['@class'] === 'Folder') {
    return {
      ...item.items.reduce((o, i) => ({ ...o, ...returnPages(pages, i) }), {}),
    };
  }
  return { [item.id!]: { name: item.name, page: pages[item.id!] } };
};

const findComponent = (
  page: WegasComponent,
  path: number[],
): {
  newPage: WegasComponent;
  component?: WegasComponent;
  parent?: WegasComponent;
} => {
  const browsePath = [...path];
  const newPage = deepClone(page) as WegasComponent;
  let parent: WegasComponent | undefined = undefined;
  let component: WegasComponent = newPage;
  while (browsePath.length > 0) {
    if (component.props.children) {
      parent = component;
      component = component.props.children[browsePath[0]];
      browsePath.splice(0, 1);
    } else {
      return { newPage };
    }
  }
  return { newPage, component, parent };
};

const patchPage = (selectedPageId: string, page: WegasComponent) =>
  store.dispatch(Actions.PageActions.patch(selectedPageId, page));

const createComponent = (
  selectedPageId: string,
  page: WegasComponent,
  path: number[],
  componentType: string,
  componentProps?: WegasComponent['props'],
  index?: number,
) => {
  const { newPage, component } = findComponent(page, path);
  if (component) {
    if (component.props.children === undefined) {
      component.props.children = [];
    }
    const children = component.props.children;
    const droppedComp: WegasComponent = {
      type: componentType,
      props: componentProps || {},
    };
    if (index !== undefined) {
      children.splice(index, 0, droppedComp);
    } else {
      children.push(droppedComp);
    }
    path.push(index ? index : 0);
    patchPage(selectedPageId, newPage);
  }
};

const deleteComponent = (
  selectedPageId: string,
  page: WegasComponent,
  path: number[],
) => {
  const newPage = deepClone(page) as WegasComponent;
  let parent: WegasComponent = newPage;
  const browsePath = [...path];
  while (browsePath.length > 0) {
    if (parent.props.children) {
      if (browsePath.length == 1) {
        parent.props.children.splice(browsePath[0], 1);
        patchPage(selectedPageId, newPage);
        return;
      }
      parent = parent.props.children[browsePath[0]];
    }
    browsePath.splice(0, 1);
  }
};

const updateComponent = (
  selectedPageId: string,
  page: WegasComponent,
  value: WegasComponent,
  path: number[],
  patch?: boolean,
) => {
  const { newPage, parent } = findComponent(page, path);
  if (parent) {
    if (parent.props.children && path) {
      let comp = value;
      if (patch) {
        const oldComp = parent.props.children[path[path.length - 1]];
        comp = {
          ...oldComp,
          props: {
            ...oldComp.props,
            ...value.props,
          },
        };
      }
      parent.props.children.splice(Number(path[path.length - 1]), 1, comp);
      patchPage(selectedPageId, newPage);
    }
  } else {
    patchPage(selectedPageId, value);
  }
};

const moveComponent = (
  sourcePageId: string,
  destPageId: string,
  sourcePage: WegasComponent,
  destPage: WegasComponent,
  sourcePath: number[],
  destPath: number[],
) => {
  const { component } = findComponent(sourcePage, sourcePath);
  if (component) {
    // TODO : Create a page action to manage synchronously the move of a component
    createComponent(
      destPageId,
      destPage,
      destPath,
      component.type,
      component.props,
    );
    deleteComponent(sourcePageId, sourcePage, sourcePath);
  }
};

export const pageLayoutId = 'PageEditorLayout';

export default function PageEditor() {
  const [{ selectedPageId, editedPath }, setPageEditorState] = React.useState<
    PageEditorState
  >({});
  const [editMode, setEditMode] = React.useState(false);
  const [showBorders, setShowBorders] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  const components = usePageComponentStore(s => s);
  const { selectedPage, defaultPageId, loading } = useStore(
    s => ({
      selectedPage: selectedPageId ? s.pages[selectedPageId] : undefined,
      defaultPageId: s.pages.index ? s.pages.index.defaultPageId : undefined,
      loading: selectedPageId == null || s.pages.index == null,
    }),
    deepDifferent,
  );
  const focusTab = React.useRef<(tabId: string, layoutId: string) => void>();

  React.useEffect(() => {
    if (selectedPageId == null && defaultPageId != null) {
      setPageEditorState(os => ({
        ...os,
        selectedPageId: defaultPageId,
        loading: defaultPageId == null,
      }));
    }
  }, [defaultPageId, selectedPageId]);

  const onEdit = React.useCallback(
    (selectedPageId?: string, path?: number[]) => {
      if (path != null) {
        focusTab.current && focusTab.current('Editor', pageLayoutId);
      }
      setPageEditorState(o => ({ ...o, editedPath: path, selectedPageId }));
    },
    [],
  );

  const onDrop = React.useCallback(
    (dndComponent: DnDComponent, path: number[], index?: number) => {
      if (selectedPageId != null && selectedPage != null) {
        createComponent(
          selectedPageId,
          selectedPage,
          path,
          dndComponent.componentName,
          components[dndComponent.componentName].getComputedPropsFromVariable(),
          index,
        );
        onEdit(selectedPageId, path);
      }
    },
    [components, onEdit, selectedPage, selectedPageId],
  );

  const onDelete = React.useCallback(
    (path: number[]) => {
      if (selectedPageId && selectedPage) {
        deleteComponent(selectedPageId, selectedPage, path);
      }
    },
    [selectedPage, selectedPageId],
  );

  const onUpdate = React.useCallback(
    (value: WegasComponent, componentPath?: number[], patch?: boolean) => {
      const path = componentPath ? componentPath : editedPath;
      if (selectedPageId != null && selectedPage != null && path != null) {
        updateComponent(selectedPageId, selectedPage, value, path, patch);
      }
    },
    [editedPath, selectedPage, selectedPageId],
  );

  const Layout = (
    <pageEditorCTX.Consumer>
      {({ selectedPageId, editedPath }) => (
        <PagesLayout
          selectedPageId={selectedPageId}
          selectedComponentPath={editedPath}
          onPageClick={pageId =>
            setPageEditorState(ops => ({
              ...ops,
              selectedPageId: pageId,
              editedPath: undefined,
            }))
          }
          componentControls={{
            onNew: (pageId, page, path, type) =>
              createComponent(
                pageId,
                page,
                path,
                type,
                components[type]?.getComputedPropsFromVariable(),
              ),
            onDelete: deleteComponent,
            onEdit: onEdit,
            onMove: moveComponent,
          }}
        />
      )}
    </pageEditorCTX.Consumer>
  );

  const PageDisplay = (
    <pageEditorCTX.Consumer>
      {({ selectedPageId, loading }) => (
        <pageCTX.Consumer>
          {({ editMode, showControls, showBorders }) =>
            loading ? (
              <pre>Loading the pages</pre>
            ) : (
              <Toolbar>
                <Toolbar.Header>
                  <div style={{ margin: 'auto' }}>
                    {editMode && (
                      <Button
                        label={'Toggle controls'}
                        disableBorders={{ right: true }}
                      >
                        <div className={innerButtonStyle}>
                          <Toggler
                            checked={showControls}
                            onClick={() => setShowControls(c => !c)}
                          />
                        </div>
                      </Button>
                    )}
                    <Button
                      label={'Toggle edit mode'}
                      disableBorders={{ right: editMode, left: editMode }}
                    >
                      <div className={innerButtonStyle}>
                        <Toggler
                          checked={editMode}
                          onClick={() => setEditMode(!editMode)}
                        />
                      </div>
                    </Button>
                    {editMode && (
                      <Button
                        label={'Toggle borders'}
                        disableBorders={{ left: true }}
                      >
                        <div className={innerButtonStyle}>
                          <Toggler
                            checked={showBorders}
                            onClick={() => setShowBorders(b => !b)}
                          />
                        </div>
                      </Button>
                    )}
                  </div>
                </Toolbar.Header>
                <Toolbar.Content>
                  <PageLoader selectedPageId={selectedPageId} />
                </Toolbar.Content>
              </Toolbar>
            )
          }
        </pageCTX.Consumer>
      )}
    </pageEditorCTX.Consumer>
  );

  const SourceEditor = (
    <pageEditorCTX.Consumer>
      {({ selectedPageId, selectedPage, loading }) =>
        loading ? (
          <pre>Loading the pages</pre>
        ) : (
          <JSONandJSEditor
            content={JSON.stringify(selectedPage, null, 2)}
            onSave={content => {
              try {
                if (selectedPageId) {
                  patchPage(selectedPageId, JSON.parse(content));
                } else {
                  throw Error('No selected page');
                }
              } catch (e) {
                return { status: 'error', text: e };
              }
            }}
          />
        )
      }
    </pageEditorCTX.Consumer>
  );

  const Editor = (
    <pageEditorCTX.Consumer>
      {({ editedPath, selectedPage }) => (
        <pageCTX.Consumer>
          {({ onUpdate, onDelete }) =>
            !editedPath ? (
              <pre>No component selected yet</pre>
            ) : !selectedPage ? (
              <pre>No page selected yet</pre>
            ) : (
              <ComponentEditor
                entity={findComponent(selectedPage, editedPath).component}
                update={onUpdate}
                actions={[
                  {
                    label: 'Delete',
                    action: () => onDelete(editedPath),
                    confirm: true,
                  },
                ]}
              />
            )
          }
        </pageCTX.Consumer>
      )}
    </pageEditorCTX.Consumer>
  );

  const availableLayoutTabs = {
    Layout,
    Components: <ComponentPalette />,
    PageDisplay,
    SourceEditor,
    Editor,
  };

  return (
    <div
      className={cx(
        flex,
        grow,
        css({
          borderStyle: 'solid',
          borderColor: themeVar.primaryDarkerColor,
          margin: '1px',
          marginTop: '0px',
        }),
      )}
    >
      <pageEditorCTX.Provider
        value={{
          selectedPageId,
          selectedPage,
          editedPath,
          loading,
        }}
      >
        <pageCTX.Provider
          value={{
            editMode,
            showControls,
            showBorders,
            onDrop,
            onDelete,
            onEdit: path => onEdit(selectedPageId, path),
            onUpdate,
          }}
        >
          <MainLinearLayout
            tabs={availableLayoutTabs}
            layout={[[['Layout'], ['Components']], ['PageDisplay']]}
            layoutId={pageLayoutId}
            onFocusTab={ft => {
              focusTab.current = ft;
            }}
          />
        </pageCTX.Provider>
      </pageEditorCTX.Provider>
    </div>
  );
}
