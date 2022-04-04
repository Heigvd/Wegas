import { cx } from '@emotion/css';
import { deepClone } from 'fast-json-patch';
import { noop } from 'lodash-es';
import * as React from 'react';
import {
  IVariableDescriptor,
  WegasClassNameAndScriptableTypes,
} from 'wegas-ts-api';
import { DropMenu } from '../../../Components/DropMenu';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import {
  PageComponent,
  usePageComponentStore,
} from '../../../Components/PageComponents/tools/componentFactory';
import { tabLayoutChildrenClassNames } from '../../../Components/TabLayout/tabLayoutStyles';
import {
  expandBoth,
  flex,
  flexColumn,
  grow,
  itemCenter,
  justifyCenter,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { State } from '../../../data/Reducer/reducers';
import { store, useStore } from '../../../data/Stores/store';
import { findComponent, isPageItem } from '../../../Helper/pages';
import { mergeDeep } from '../../../Helper/tools';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { pagesTranslations } from '../../../i18n/pages/pages';
import { focusTab, MainLinearLayout } from '../LinearTabLayout/LinearLayout';
import ComponentPalette, {
  DnDComponent,
  isDnDComponent,
} from './ComponentPalette';
import ConnectedComponentProperties from './ComponentProperties';
import PageDisplay from './PageDisplay';
import PagesLayout, { PageComponentNode } from './PagesLayout';
import SourceEditor from './SourceEditor';

export interface Handles {
  [path: string]: { jsx: JSX.Element; dom: React.RefObject<HTMLDivElement> };
}

export interface FocusedComponent {
  pageId: string;
  componentPath: number[];
}

export type PageEditorComponent = DnDComponent | PageComponentNode;

interface PageEditorState {
  selectedPageId?: string;
  editedPath?: number[];
}

export interface PageContext extends PageEditorState {
  loading: boolean;
  selectedPage?: WegasComponent;
  editMode: boolean;
  showBorders: boolean;
  showControls: boolean;
  pageIdPath: string[];
  handles: Handles;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowBorders: React.Dispatch<React.SetStateAction<boolean>>;
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>;
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
    index: number,
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
  onEditComponent: (selectedPageId?: string, path?: number[]) => void;
  onPageClick: (selectedPageId: string) => void;
}

export const defaultPageCTX: PageContext = {
  selectedPageId: undefined,
  loading: true,
  editedPath: undefined,
  selectedPage: undefined,
  editMode: false,
  showBorders: false,
  showControls: true,
  pageIdPath: [],
  handles: {},
  setEditMode: noop,
  setShowControls: noop,
  setShowBorders: noop,
  onDrop: noop,
  onEdit: noop,
  onDelete: noop,
  onUpdate: noop,
  onDeleteLayoutComponent: noop,
  onDuplicateLayoutComponent: noop,
  onEditComponent: noop,
  onMoveLayoutComponent: noop,
  onNewLayoutComponent: noop,
  onPageClick: noop,
};

export const pageCTX = React.createContext<PageContext>(defaultPageCTX);

export function patchPage(selectedPageId: string, page: WegasComponent) {
  store.dispatch(Actions.PageActions.patch(selectedPageId, page));
}

export function createComponent(
  page: WegasComponent,
  path: number[],
  componentType: string,
  componentProps?: WegasComponent['props'],
  index?: number,
) {
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
}

export function deleteComponent(page: WegasComponent, path: number[]) {
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
}

export function updateComponent(
  page: WegasComponent,
  value: WegasComponent,
  path: number[],
  patch?: boolean,
) {
  const { newPage, parent } = findComponent(page, path);
  if (parent) {
    if (parent.props.children && path) {
      let comp = value;
      if (patch) {
        const oldComp = parent.props.children[path[path.length - 1]];
        comp = {
          ...oldComp,
          ...value,
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
}

export function moveComponent(
  sourcePageId: string,
  destPageId: string,
  sourcePage: WegasComponent,
  destPage: WegasComponent,
  sourcePath: number[],
  destPath: number[],
  destIndex: number,
  props?: WegasComponent['props'],
) {
  const sourceIndex: number | undefined = sourcePath.slice(-1)[0];
  const samePages = sourcePageId === destPageId;
  const samePath = !deepDifferent(sourcePath.slice(0, -1), destPath);
  const deleteIndex =
    samePages && samePath && sourceIndex >= destIndex
      ? sourceIndex + 1
      : sourceIndex;
  const deletePath =
    samePages && // If same pages
    destPath.length + 1 < sourcePath.length && // If component is dragged out of its container
    destIndex <= sourcePath[destPath.length] // If component new path is before its old container
      ? // Add 1 to the container path current path
        [
          ...sourcePath.slice(0, destPath.length),
          sourcePath[destPath.length] + 1,
          ...sourcePath.slice(destPath.length + 1),
        ]
      : // Set the new index of the component in case it is moved inside the same container
        [...sourcePath.slice(0, -1), deleteIndex];

  const { component } = findComponent(sourcePage, sourcePath);
  if (component != null) {
    const newDest = createComponent(
      destPage,
      destPath,
      component.type,
      props ? mergeDeep(component.props, props) : component.props,
      destIndex,
    );
    let newDestPage = newDest?.newPage;
    let newSourcePage: WegasComponent | undefined = undefined;
    const newDestPath = newDest?.newPath;

    if (samePages && newDestPage) {
      newDestPage = deleteComponent(newDestPage, deletePath);
    } else {
      newSourcePage = deleteComponent(sourcePage, sourcePath);
    }
    return { newSourcePage, newDestPath, samePages, newDestPage };
  }
  return { samePages };
}

function pageFolderToDropMenuItems(
  folder: PageIndexFolder,
): DropMenuItem<undefined>[] {
  return folder.items.map(item => {
    if (isPageItem(item)) {
      return { label: item.name, id: item.id! };
    } else {
      return { label: item.name, items: pageFolderToDropMenuItems(item) };
    }
  });
}

export const PAGE_EDITOR_LAYOUT_ID = 'PageEditorLayout';

interface PageContextProviderProps {
  /**
   * The layoutId in witch the page windows are added
   */
  layoutId?: string;
}

export const computeProps = (
  component: PageComponent,
  props?: WegasComponent['props'],
  variable?: WegasClassNameAndScriptableTypes[IVariableDescriptor['@class']],
): WegasComponent['props'] => {
  if (props) {
    return props;
  } else if (component.getComputedPropsFromVariable) {
    return component.getComputedPropsFromVariable(variable);
  } else {
    return {};
  }
};

export function PageContextProvider({
  layoutId,
  children,
}: React.PropsWithChildren<PageContextProviderProps>) {
  const handles = React.useRef({});
  const [{ selectedPageId, editedPath }, setPageEditorState] =
    React.useState<PageEditorState>({
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
      pages: s.pages,
    }),
    [selectedPageId],
  );
  const { selectedPage, defaultPageId, loading } = useStore(pageInfoSelector);

  React.useEffect(() => {
    if (selectedPageId == null && defaultPageId != null) {
      setPageEditorState(os => ({
        ...os,
        selectedPageId: defaultPageId,
      }));
    }
  }, [defaultPageId, selectedPageId]);

  const onEdit = React.useCallback(
    (selectedPageId?: string, path?: number[]) => {
      if (path != null && layoutId != null) {
        focusTab(layoutId, 'Component Properties');
      }
      setPageEditorState(o => {
        if (
          o == null ||
          o.selectedPageId !== selectedPageId ||
          o.editedPath?.join(',') !== path?.join(',')
        ) {
          return { ...o, editedPath: path, selectedPageId };
        } else {
          return o;
        }
      });
    },
    [layoutId],
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
      const { samePages, newDestPath, newSourcePage, newDestPage } =
        moveComponent(
          sourcePageId,
          destPageId,
          sourcePage,
          destPage,
          sourcePath,
          destPath,
          destIndex,
          props,
        );

      if (newDestPage) {
        patchPage(destPageId, newDestPage);
        if (!samePages && newSourcePage) {
          patchPage(sourcePageId, newSourcePage);
        }
        onEdit(destPageId, newDestPath);
      }
    },
    [onEdit],
  );

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

      if (!isDnDComponent(dndComponent)) {
        componentPageId = dndComponent.pageId;
        componentPage = store.getState().pages[componentPageId];
        componentPath = dndComponent.componentPath;
        componentName = undefined;
      } else {
        componentPageId = selectedPageId;
        componentPage = selectedPage;
        componentPath = dndComponent.path;
        componentName = dndComponent.componentName;
      }

      if (selectedPageId != null && selectedPage != null) {
        const computedPage = replace
          ? deleteComponent(selectedPage, [...path, index == null ? 0 : index])
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
        const newPage = deleteComponent(selectedPage, path);
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

  const onNewLayoutComponent: PageContext['onNewLayoutComponent'] =
    React.useCallback(
      (pageId, page, path, componentTypeName, index) => {
        const newComponent = createComponent(
          page,
          path,
          componentTypeName,
          computeProps(components[componentTypeName], undefined, undefined),
          index,
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
      const newPage = deleteComponent(page, path);
      if (newPage) {
        patchPage(pageId, newPage);
      }
    },
    [],
  );

  const onPageClick = React.useCallback(
    (pageId: string | undefined) =>
      setPageEditorState(ops => ({
        ...ops,
        selectedPageId: pageId,
        editedPath: undefined,
      })),
    [],
  );

  const value: PageContext = React.useMemo(() => {
    return {
      selectedPageId,
      selectedPage,
      editedPath,
      loading,
      editMode,
      showControls,
      showBorders: showBorders /*|| (editMode && isAnythingDragged)*/,
      pageIdPath: selectedPageId
        ? [selectedPageId]
        : defaultPageId
        ? [defaultPageId]
        : [],
      handles: handles.current,
      setEditMode,
      setShowBorders,
      setShowControls,
      onDrop,
      onDelete,
      onEdit: path => onEdit(selectedPageId, path),
      onUpdate,
      onDeleteLayoutComponent,
      onDuplicateLayoutComponent,
      onEditComponent: onEdit,
      onMoveLayoutComponent,
      onNewLayoutComponent,
      onPageClick,
    };
  }, [
    defaultPageId,
    editMode,
    editedPath,
    loading,
    onDelete,
    onDeleteLayoutComponent,
    onDrop,
    onDuplicateLayoutComponent,
    onEdit,
    onMoveLayoutComponent,
    onNewLayoutComponent,
    onPageClick,
    onUpdate,
    selectedPage,
    selectedPageId,
    showBorders,
    showControls,
  ]);

  return <pageCTX.Provider value={value}>{children}</pageCTX.Provider>;
}

export default function PageEditor({
  layoutId = PAGE_EDITOR_LAYOUT_ID,
}: Partial<PageContextProviderProps>) {
  const i18nCommonValues = useInternalTranslate(commonTranslations);
  const i18nPagesValues = useInternalTranslate(pagesTranslations);
  const focusTab = React.useRef<(tabId: string, layoutId: string) => void>();

  const { selectedPageId, onPageClick } = React.useContext(pageCTX);

  const pageInfoSelector = React.useCallback(
    (s: State) => ({
      selectedPage: selectedPageId ? s.pages[selectedPageId] : undefined,
      defaultPageId: s.pages.index ? s.pages.index.defaultPageId : undefined,
      loading: selectedPageId == null || s.pages.index == null,
      pages: s.pages,
    }),
    [selectedPageId],
  );
  const { defaultPageId, pages } = useStore(pageInfoSelector);
  const { dispatch } = store;

  const availableLayoutTabs = React.useMemo(
    () => [
      {
        tabId: 'Pages Layout',
        content: <PagesLayout />,
      },
      {
        tabId: 'Component Palette',
        content: <ComponentPalette />,
      },
      {
        tabId: 'Page Display',
        content: <PageDisplay />,
      },
      { tabId: 'Source Editor', content: <SourceEditor /> },
      {
        tabId: 'Component Properties',
        content: <ConnectedComponentProperties />,
      },
    ],
    [],
  );

  // If the default page does not exists
  if (
    defaultPageId != null &&
    Object.keys(pages).length > 1 &&
    pages[defaultPageId] == null
  ) {
    return (
      <div className={cx(expandBoth, flex, itemCenter, justifyCenter)}>
        <DropMenu
          label={i18nPagesValues.noDefaultPages}
          items={pageFolderToDropMenuItems(pages.index.root)}
          onSelect={item => {
            if (item.id != null) {
              dispatch(Actions.PageActions.setDefault(item.id));
              onPageClick(item.id);
            }
          }}
        />
      </div>
    );
  }

  return Object.keys(availableLayoutTabs).length === 0 ? (
    <pre>{i18nCommonValues.loading}...</pre>
  ) : (
    <div className={cx(flex, grow) + ' PAGE-EDITOR'}>
      {Object.keys(pages).length === 1 ? (
        <div
          className={cx(
            expandBoth,
            flex,
            flexColumn,
            itemCenter,
            justifyCenter,
          )}
        >
          <p>{i18nPagesValues.noPages}</p>
          <PagesLayout />
        </div>
      ) : (
        <MainLinearLayout
          tabs={availableLayoutTabs}
          initialLayout={[
            [['Pages Layout'], ['Component Palette']],
            ['Page Display'],
          ]}
          layoutId={layoutId}
          onFocusTab={ft => {
            focusTab.current = ft;
          }}
          classNames={tabLayoutChildrenClassNames}
        />
      )}
    </div>
  );
}
