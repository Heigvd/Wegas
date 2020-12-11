import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { JSONandJSEditor } from '../ScriptEditors/JSONandJSEditor';
import { deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import {
  usePageComponentStore,
  PageComponent,
  componentsStore,
} from '../../../Components/PageComponents/tools/componentFactory';
import { MainLinearLayout } from '../LinearTabLayout/LinearLayout';
import ComponentProperties from './ComponentProperties';
import { PageLoader } from './PageLoader';
import { css, cx } from 'emotion';
import { noop } from 'lodash-es';
import {
  PagesLayout,
  LayoutDndComponent,
  isLayoutDndComponent,
} from './PagesLayout';
import { store, useStore } from '../../../data/store';
import { Actions } from '../../../data';
import { flex, grow, expandBoth } from '../../../css/classes';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { mergeDeep } from '../../../Helper/tools';
import { findComponent } from '../../../Helper/pages';
import {
  WegasClassNameAndScriptableTypes,
  IVariableDescriptor,
} from 'wegas-ts-api';
import { State } from '../../../data/Reducer/reducers';

const toggleButtonStyle = css({
  display: 'flex',
});

export interface Handles {
  [path: string]: { jsx: JSX.Element; dom: React.RefObject<HTMLDivElement> };
}

export interface FocusedComponent {
  pageId: string;
  componentPath: number[];
}

export type PageEditorComponent = DnDComponent | LayoutDndComponent;

export interface PageContext {
  editMode: boolean;
  showBorders: boolean;
  showControls: boolean;
  pageIdPath: string[];
  handles: Handles;
  onDrop: (
    dndComponent: PageEditorComponent,
    path: number[],
    index?: number,
    props?: WegasComponent['props'],
    replace?: boolean,
  ) => void;
  onDelete: (path: number[]) => void;
  onEdit: (path: number[] | undefined) => void;
  onUpdate: (value: WegasComponent, path?: number[], patch?: boolean) => void;
}

export const defaultPageCTX: PageContext = {
  editMode: false,
  showBorders: false,
  showControls: true,
  pageIdPath: [],
  handles: {},
  onDrop: noop,
  onEdit: noop,
  onDelete: noop,
  onUpdate: noop,
};

export const pageCTX = React.createContext<PageContext>(defaultPageCTX);

interface PageEditorState {
  selectedPageId?: string;
  editedPath?: number[];
}

interface PageEditorContext extends PageEditorState {
  loading: boolean;
  selectedPage?: WegasComponent;
}
export const pageEditorCTX = React.createContext<PageEditorContext>({
  loading: false,
});

const returnPages = (pages: Pages, item?: PageIndexItem): PagesWithName => {
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

const patchPage = (selectedPageId: string, page: WegasComponent) =>
  store.dispatch(Actions.PageActions.patch(selectedPageId, page));

export const createComponent = (
  page: WegasComponent,
  path: number[],
  componentType: string,
  componentProps?: WegasComponent['props'],
  index?: number,
) => {
  const newPath = [...path];
  const { newPage, component } = findComponent(page, newPath);
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
      if (index >= children.length) {
        newPath.push(children.length - 1);
      } else {
        newPath.push(index);
      }
    } else {
      children.push(droppedComp);
      newPath.push(children.length - 1);
    }
    return { newPage, newPath };
  }
};

export const deleteComponent = (page: WegasComponent, path: number[]) => {
  const newPage = deepClone(page) as WegasComponent;
  let parent: WegasComponent = newPage;
  const browsePath = [...path];
  while (browsePath.length > 0) {
    if (parent.props.children) {
      if (browsePath.length == 1) {
        parent.props.children.splice(browsePath[0], 1);
        return newPage;
      }
      parent = parent.props.children[browsePath[0]];
    }
    browsePath.splice(0, 1);
  }
};

const updateComponent = (
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
      return newPage;
    }
  } else {
    return value;
  }
};

function SourceEditor() {
  return (
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
                return { status: 'error', text: (e as Error).message };
              }
            }}
          />
        )
      }
    </pageEditorCTX.Consumer>
  );
}

interface PageDisplayProps {
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBorders: React.Dispatch<React.SetStateAction<boolean>>;
}

const toolbarStyle = css({
  display: flex,
});

function PageEditionToolbar({
  setShowBorders,
  setEditMode,
  setShowControls,
}: Partial<PageDisplayProps>) {
  const { editMode, showControls, showBorders } = React.useContext(pageCTX);
  return (
    <div className={toolbarStyle}>
      {setShowControls && editMode && (
        <Toggler
          className={toggleButtonStyle}
          label="Show controls: "
          value={showControls}
          onChange={() => setShowControls(c => !c)}
        />
      )}

      {setEditMode && (
        <Toggler
          className={toggleButtonStyle}
          label="Edit mode:"
          value={editMode}
          onChange={() => setEditMode(!editMode)}
        />
      )}
      {setShowBorders && editMode && (
        <Toggler
          className={toggleButtonStyle}
          label="Toggle borders: "
          value={showBorders}
          onChange={() => setShowBorders(b => !b)}
        />
      )}
    </div>
  );
}

function PageDisplay({
  setShowBorders,
  setEditMode,
  setShowControls,
}: PageDisplayProps) {
  const { selectedPageId, loading } = React.useContext(pageEditorCTX);

  if (loading) {
    return <pre>Loading the pages</pre>;
  }
  return (
    <Toolbar className={expandBoth + ' PAGE-DISPLAY'}>
      <Toolbar.Header>
        <PageEditionToolbar
          setShowBorders={setShowBorders}
          setShowControls={setShowControls}
          setEditMode={setEditMode}
        />
      </Toolbar.Header>
      <Toolbar.Content>
        <PageLoader selectedPageId={selectedPageId} displayFrame />
      </Toolbar.Content>
    </Toolbar>
  );
}

interface LayoutProps {
  setPageEditorState: React.Dispatch<React.SetStateAction<PageEditorState>>;
  onMoveLayoutComponent: (
    sourcePageId: string,
    destPageId: string,
    sourcePage: WegasComponent,
    destPage: WegasComponent,
    sourcePath: number[],
    destPath: number[],
    destIndex: number,
    props?: WegasComponent['props'],
  ) => void;
  onNewLayoutComponent: (
    pageId: string,
    page: WegasComponent,
    path: number[],
    type: string,
  ) => void;
  onDuplicateLayoutComponent: (
    pageId: string,
    page: WegasComponent,
    path: number[],
  ) => void;
  onDeleteLayoutComponent: (
    pageId: string,
    page: WegasComponent,
    path: number[],
  ) => void;
  onEdit: (selectedPageId?: string, path?: number[]) => void;
}

function Layout({
  onDeleteLayoutComponent,
  onEdit,
  onMoveLayoutComponent,
  onNewLayoutComponent,
  onDuplicateLayoutComponent,
  setPageEditorState,
}: LayoutProps) {
  return (
    <PagesLayout
      onPageClick={pageId =>
        setPageEditorState(ops => ({
          ...ops,
          selectedPageId: pageId,
          editedPath: undefined,
        }))
      }
      componentControls={{
        onNew: onNewLayoutComponent,
        onDuplicate: onDuplicateLayoutComponent,
        onDelete: onDeleteLayoutComponent,
        onEdit: onEdit,
        onMove: onMoveLayoutComponent,
      }}
    />
  );
}

export const PAGE_EDITOR_LAYOUT_ID = 'PageEditorLayout';

export default function PageEditor() {
  const handles = React.useRef({});
  const focusTab = React.useRef<(tabId: string, layoutId: string) => void>();
  const [
    { selectedPageId, editedPath },
    setPageEditorState,
  ] = React.useState<PageEditorState>({
    selectedPageId: store.getState().pages.index
      ? store.getState().pages.index.defaultPageId
      : undefined,
  });

  const [editMode, setEditMode] = React.useState(false);
  const [showBorders, setShowBorders] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  const components = usePageComponentStore(s => s);
  const pageInfoSelector = React.useCallback(
    (s: State) => ({
      selectedPage: selectedPageId ? s.pages[selectedPageId] : undefined,
      defaultPageId: s.pages.index ? s.pages.index.defaultPageId : undefined,
      loading: selectedPageId == null || s.pages.index == null,
    }),
    [selectedPageId],
  );
  const { selectedPage, defaultPageId, loading } = useStore(pageInfoSelector);

  React.useEffect(() => {
    if (selectedPageId == null && defaultPageId != null) {
      setPageEditorState(os => ({
        ...os,
        selectedPageId: defaultPageId,
        //loading: defaultPageId == null,
      }));
    }
  }, [defaultPageId, selectedPageId]);

  const onEdit = React.useCallback(
    (selectedPageId?: string, path?: number[]) => {
      if (path != null) {
        focusTab.current &&
          focusTab.current('Component Properties', PAGE_EDITOR_LAYOUT_ID);
      }
      setPageEditorState(o => ({ ...o, editedPath: path, selectedPageId }));
    },
    [],
  );

  const onMoveLayoutComponent = React.useCallback(
    (
      sourcePageId: string,
      destPageId: string,
      sourcePage: WegasComponent,
      destPage: WegasComponent,
      sourcePath: number[],
      destPath: number[],
      destIndex: number,
      props?: WegasComponent['props'],
    ) => {
      const moveInsideItself = destPath.join().indexOf(sourcePath.join()) === 0;
      const samePage = sourcePageId === destPageId;
      const sameContainerPath =
        JSON.stringify(sourcePath.slice(0, -1)) === JSON.stringify(destPath);
      const sourceIndex: number | undefined = sourcePath.slice(-1)[0];

      const computedDestIndex =
        sameContainerPath && destIndex > sourceIndex
          ? destIndex - 1
          : destIndex;

      const samePosition = sourceIndex === computedDestIndex;

      // Don't do anything if the result is the same than before or if the user tries to put a container in itself
      if (
        !(
          moveInsideItself ||
          (samePage && sameContainerPath && samePosition && props == null)
        )
      ) {
        const { component } = findComponent(sourcePage, sourcePath);
        if (component) {
          const newSourcePage = deleteComponent(sourcePage, sourcePath);
          // Don't do anything if the path to the source element points to nothing (should never happen)
          if (newSourcePage != null) {
            const newDestPage = createComponent(
              samePage ? newSourcePage : destPage,
              destPath,
              component.type,
              props ? mergeDeep(component.props, props) : component.props,
              computedDestIndex,
            );
            // Don't modify the source page if it's the same than the destination page
            if (newDestPage != null) {
              if (sourcePageId !== destPageId) {
                patchPage(sourcePageId, newSourcePage);
              }
              patchPage(destPageId, newDestPage.newPage);
              onEdit(destPageId, newDestPage.newPath);
            }
          }
        }
      }
    },
    [onEdit],
  );

  const computeProps = (
    component: PageComponent,
    props?: WegasComponent['props'],
    variable?: WegasClassNameAndScriptableTypes[IVariableDescriptor['@class']],
  ) => {
    if (props) {
      return props;
    } else if (component.getComputedPropsFromVariable) {
      return component.getComputedPropsFromVariable(variable);
    } else {
      return {};
    }
  };

  const onDrop = React.useCallback(
    (
      dndComponent: PageEditorComponent,
      path: number[],
      index?: number,
      props?: WegasComponent['props'],
      replace?: boolean,
    ) => {
      let componentPageId = selectedPageId;
      let componentPage = selectedPage;
      let componentPath: number[] | undefined;
      let componentName: string | undefined;

      if (isLayoutDndComponent(dndComponent)) {
        componentPageId = dndComponent.id.pageId;
        componentPage = dndComponent.id.page;
        componentPath = dndComponent.id.componentPath;
        componentName = undefined;
      } else {
        componentPageId = selectedPageId;
        componentPage = selectedPage;
        componentPath = dndComponent.path;
        componentName = dndComponent.componentName;
      }

      if (selectedPageId != null && selectedPage != null) {
        const computedPage = replace
          ? deleteComponent(selectedPage, [
              ...path,
              ...(index == null ? [] : [index]),
            ])
          : selectedPage;

        if (computedPage != null) {
          // Dropping new component
          if (componentPath == null && componentName != null) {
            const computedProps = computeProps(
              components[componentName],
              props,
              undefined,
            );

            const newComponent = createComponent(
              computedPage,
              path,
              componentName,
              computedProps,
              index,
            );
            if (newComponent) {
              patchPage(selectedPageId, newComponent.newPage);
              onEdit(selectedPageId, newComponent.newPath);
            }
          }
          // Dropping existing component
          else {
            if (
              componentPageId != null &&
              componentPage != null &&
              componentPath != null
            ) {
              const newIndex = index ? index : 0;
              onMoveLayoutComponent(
                componentPageId,
                selectedPageId,
                componentPage,
                computedPage,
                componentPath,
                path,
                newIndex,
                props,
              );
            }
          }
        }
      }
    },
    [components, selectedPage, selectedPageId, onEdit, onMoveLayoutComponent],
  );

  const onDelete = React.useCallback(
    (path: number[]) => {
      if (selectedPageId && selectedPage) {
        // Checking if parent manages delete by itself
        const { parent: parentComponent } = findComponent(selectedPage, path);
        const { container } = componentsStore.getState()[
          parentComponent?.type || ''
        ];

        const newPage = container?.deleteChildren
          ? container?.deleteChildren(selectedPage, path)
          : deleteComponent(selectedPage, path);
        if (newPage) {
          patchPage(selectedPageId, newPage);
        }
      }
    },
    [selectedPage, selectedPageId],
  );

  const onUpdate = React.useCallback(
    (value: WegasComponent, componentPath?: number[], patch?: boolean) => {
      const path = componentPath ? componentPath : editedPath;
      if (selectedPageId != null && selectedPage != null && path != null) {
        const newPage = updateComponent(selectedPage, value, path, patch);
        if (newPage) {
          patchPage(selectedPageId, newPage);
        }
      }
    },
    [editedPath, selectedPage, selectedPageId],
  );

  const onNewLayoutComponent = React.useCallback(
    (pageId, page, path, componentTypeName) => {
      const newComponent = createComponent(
        page,
        path,
        componentTypeName,
        computeProps(components[componentTypeName], undefined, undefined),
      );
      if (newComponent) {
        patchPage(pageId, newComponent.newPage);
        onEdit(pageId, newComponent.newPath);
      }
    },
    [components, onEdit],
  );

  const onDuplicateLayoutComponent = React.useCallback(
    (pageId, page, path) => {
      const { component } = findComponent(page, path);
      if (component) {
        const newComponent = createComponent(
          page,
          path.slice(0, -1),
          component.type,
          component.props,
          path.slice(-1)[0] + 1,
        );
        if (newComponent) {
          patchPage(pageId, newComponent.newPage);
          onEdit(pageId, newComponent.newPath);
        }
      }
    },
    [onEdit],
  );

  const onDeleteLayoutComponent = React.useCallback(
    (pageId: string, page: WegasComponent, path: number[]) => {
      // Checking if parent manages delete by itself
      const { parent: parentComponent } = findComponent(page, path);
      const { container } = componentsStore.getState()[
        parentComponent?.type || ''
      ];

      const newPage = container?.deleteChildren
        ? container?.deleteChildren(page, path)
        : deleteComponent(page, path);
      if (newPage) {
        patchPage(pageId, newPage);
      }
    },
    [],
  );

  const availableLayoutTabs = React.useMemo(
    () => ({
      'Pages Layout': (
        <Layout
          onDeleteLayoutComponent={onDeleteLayoutComponent}
          onEdit={onEdit}
          onMoveLayoutComponent={onMoveLayoutComponent}
          onNewLayoutComponent={onNewLayoutComponent}
          onDuplicateLayoutComponent={onDuplicateLayoutComponent}
          setPageEditorState={setPageEditorState}
        />
      ),
      'Component Palette': <ComponentPalette setEditMode={setEditMode} />,
      'Page Display': (
        <PageDisplay
          setEditMode={setEditMode}
          setShowBorders={setShowBorders}
          setShowControls={setShowControls}
        />
      ),
      'Source Editor': <SourceEditor />,
      'Component Properties': <ComponentProperties />,
    }),
    [
      onDeleteLayoutComponent,
      onDuplicateLayoutComponent,
      onEdit,
      onMoveLayoutComponent,
      onNewLayoutComponent,
    ],
  );

  // useComparator({selectedPageId,editedPath})

  return Object.keys(availableLayoutTabs).length === 0 ? (
    <pre>Loading...</pre>
  ) : (
    <div className={cx(flex, grow) + ' PAGE-EDITOR'}>
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
            showBorders: showBorders /*|| (editMode && isAnythingDragged)*/,
            pageIdPath: selectedPageId
              ? [selectedPageId]
              : defaultPageId
              ? [defaultPageId]
              : [],
            handles: handles.current,
            onDrop,
            onDelete,
            onEdit: path => onEdit(selectedPageId, path),
            onUpdate,
          }}
        >
          <MainLinearLayout
            tabs={availableLayoutTabs}
            initialLayout={[
              [['Pages Layout'], ['Component Palette']],
              ['Page Display'],
            ]}
            layoutId={PAGE_EDITOR_LAYOUT_ID}
            onFocusTab={ft => {
              focusTab.current = ft;
            }}
          />
        </pageCTX.Provider>
      </pageEditorCTX.Provider>
    </div>
  );
}
