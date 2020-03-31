import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { JSONandJSEditor } from '../ScriptEditors/JSONandJSEditor';
import { deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { ReflexElement, ReflexContainer, ReflexSplitter } from 'react-reflex';
import { splitter } from '../LinearTabLayout/LinearLayout';
import ComponentEditor from './ComponentEditor';
import { PageLoader } from './PageLoader';
import { Button } from '../../../Components/Inputs/Button/Button';
import { Toggler } from '../../../Components/Inputs/Button/Toggler';
import { css } from 'emotion';
import { noop } from 'lodash-es';
import { PagesLayout } from './PagesLayout';
import { wlog } from '../../../Helper/wegaslog';
import { store, useStore } from '../../../data/store';
import { Actions } from '../../../data';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';

const innerButtonStyle = css({
  margin: '2px auto 2px auto',
  width: 'fit-content',
});

interface PageContext {
  editMode: boolean;
  showBorders: boolean;
  showControls: boolean;
  onDrop: (dndComponent: DnDComponent, path: string[], index?: number) => void;
  onDelete: (path: string[]) => void;
  onEdit: (path: string[]) => void;
  onUpdate: (value: WegasComponent, path?: string[], patch?: boolean) => void;
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

interface PagesState {
  selectedPageId?: string;
  editedPath?: string[];
}

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

export default function PageEditor() {
  const [{ selectedPageId, editedPath }, setPageEditorState] = React.useState<
    PagesState
  >({});
  const [srcMode, setSrcMode] = React.useState<boolean>(false);
  const [editMode, setEditMode] = React.useState(false);
  const [showBorders, setShowBorders] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  const components = usePageComponentStore(s => s);
  const { selectedPage, defaultPageId } = useStore(
    s => ({
      selectedPage: selectedPageId ? s.pages[selectedPageId] : undefined,
      defaultPageId: s.pages.index ? s.pages.index.defaultPageId : undefined,
    }),
    deepDifferent,
  );

  React.useEffect(() => {
    if (selectedPageId == null && defaultPageId != null) {
      setPageEditorState(os => ({ ...os, selectedPageId: defaultPageId }));
    }
  }, [defaultPageId, selectedPageId]);

  const { dispatch } = store;

  const patchPage = React.useCallback(
    (page: WegasComponent) => {
      selectedPageId &&
        dispatch(Actions.PageActions.patch(selectedPageId, page));
    },
    [dispatch, selectedPageId],
  );

  const findComponent = React.useCallback(
    (path: string[]) => {
      const browsePath = [...path];
      const newPage = deepClone(selectedPage) as WegasComponent;
      let parent: WegasComponent | undefined = undefined;
      let component: WegasComponent = newPage;
      while (browsePath.length > 0) {
        if (component.props.children) {
          parent = component;
          component = component.props.children[Number(browsePath[0])];
          browsePath.splice(0, 1);
        } else {
          return { newPage };
        }
      }
      return { newPage, component, parent };
    },
    [selectedPage],
  );

  const onEdit = React.useCallback(
    (path?: string[]) => setPageEditorState(o => ({ ...o, editedPath: path })),
    [],
  );

  const onDrop = React.useCallback(
    (dndComponent: DnDComponent, path: string[], index?: number) => {
      const { newPage, component } = findComponent(path);
      if (component) {
        if (component.props.children === undefined) {
          component.props.children = [];
        }
        const children = component.props.children;
        const droppedComp: WegasComponent = {
          type: dndComponent.componentName,
          props: components[
            dndComponent.componentName
          ].getComputedPropsFromVariable(),
        };
        if (index !== undefined) {
          children.splice(index, 0, droppedComp);
        } else {
          children.push(droppedComp);
        }
        path.push(`${index ? index : 0}`);
        onEdit(path);
        patchPage(newPage);
      }
    },
    [components, patchPage, onEdit, findComponent],
  );

  const onDelete = React.useCallback(
    (path: string[]) => {
      const newPage = deepClone(selectedPage) as WegasComponent;
      let parent: WegasComponent = newPage;
      const browsePath = [...path];
      while (browsePath.length > 0) {
        if (parent.props.children) {
          if (browsePath.length == 1) {
            parent.props.children.splice(Number(browsePath[0]), 1);
            patchPage(newPage);
            return;
          }
          parent = parent.props.children[Number(browsePath[0])];
        }
        browsePath.splice(0, 1);
      }
    },
    [patchPage, selectedPage],
  );

  const onUpdate = React.useCallback(
    (value: WegasComponent, componentPath?: string[], patch?: boolean) => {
      const path = componentPath ? componentPath : editedPath;
      if (path) {
        const { newPage, parent } = findComponent(path);
        if (parent) {
          if (parent.props.children && path) {
            let comp = value;
            if (patch) {
              const oldComp =
                parent.props.children[Number(path[path.length - 1])];
              comp = {
                ...oldComp,
                props: {
                  ...oldComp.props,
                  ...value.props,
                },
              };
            }
            parent.props.children.splice(
              Number(path[path.length - 1]),
              1,
              comp,
            );
            patchPage(newPage);
          }
        } else {
          patchPage(value as WegasComponent);
        }
      }
    },
    [patchPage, editedPath, findComponent],
  );

  return (
    <Toolbar>
      <Toolbar.Header>
        <div style={{ margin: 'auto' }}>
          {editMode && (
            <>
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
              <Button label={'Toggle borders'} disableBorders={{ left: true }}>
                <div className={innerButtonStyle}>
                  <Toggler
                    checked={showBorders}
                    onClick={() => setShowBorders(b => !b)}
                  />
                </div>
              </Button>
            </>
          )}
        </div>
        {!srcMode && (
          <Button
            label={editMode ? 'View mode' : 'Edit mode'}
            onClick={() => setEditMode(!editMode)}
            disableBorders={{ right: true }}
          />
        )}
        <Button
          label={srcMode ? 'Preview mode' : 'Source code mode'}
          onClick={() => {
            setSrcMode(src => !src);
            setEditMode(false);
          }}
          disableBorders={{ left: !srcMode }}
        />
      </Toolbar.Header>
      <Toolbar.Content>
        <ReflexContainer orientation="vertical" className={splitter}>
          <ReflexElement flex={0.3}>
            <PagesLayout
              selectedPageId={selectedPageId}
              onPageClick={pageId =>
                setPageEditorState(ops => ({ ...ops, selectedPageId: pageId }))
              }
              componentControls={{
                onNewComponent: () => wlog('To implement'),
                onDeleteComponent: () => wlog('To implement'),
              }}
            />
          </ReflexElement>
          <ReflexSplitter />
          {srcMode && (
            <ReflexElement>
              <JSONandJSEditor
                content={JSON.stringify(selectedPage, null, 2)}
                // status={
                //   modalState.type === 'save' ? modalState.label : undefined
                // }
                onSave={content => {
                  try {
                    patchPage(JSON.parse(content));
                  } catch (e) {
                    return { status: 'error', text: e };
                  }
                }}
              />
            </ReflexElement>
          )}
          {!srcMode && editMode && (
            <ReflexElement flex={editMode ? (editedPath ? 0.3 : 0.125) : 0}>
              <div style={{ float: 'left' }}>
                <ComponentPalette />
              </div>
              {editedPath && (
                <ComponentEditor
                  entity={findComponent(editedPath).component}
                  update={onUpdate}
                  actions={[
                    {
                      label: 'Close',
                      action: () =>
                        setPageEditorState(o => ({
                          ...o,
                          editedPath: undefined,
                        })),
                    },
                  ]}
                />
              )}
            </ReflexElement>
          )}
          {!srcMode && editMode && <ReflexSplitter />}
          {!srcMode && (
            <ReflexElement style={{ display: 'flex' }}>
              <pageCTX.Provider
                value={{
                  editMode,
                  showControls,
                  showBorders,
                  onDrop,
                  onDelete,
                  onEdit,
                  onUpdate,
                }}
              >
                <PageLoader selectedPageId={selectedPageId} />
              </pageCTX.Provider>
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
