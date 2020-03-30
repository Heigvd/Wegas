import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { ConfirmButton } from '../../../Components/Inputs/Button/ConfirmButton';
import { Menu } from '../../../Components/Menu';
import { PageAPI } from '../../../API/pages.api';
import {
  JSONandJSEditor,
  OnSaveStatus,
} from '../ScriptEditors/JSONandJSEditor';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { TextPrompt } from '../TextPrompt';
import { compare, deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { ReflexElement, ReflexContainer, ReflexSplitter } from 'react-reflex';
import { splitter } from '../LinearTabLayout/LinearLayout';
import ComponentEditor from './ComponentEditor';
import { PageLoader } from './PageLoader';
import { Button } from '../../../Components/Inputs/Button/Button';
import { MessageString } from '../MessageString';
import { Toggler } from '../../../Components/Inputs/Button/Toggler';
import { css } from 'emotion';
import { noop } from 'lodash-es';
import { themeVar } from '../../../Components/Theme';
// import pageState, { PageState } from '../../../data/Reducer/pageState';
// import pageState from '../../../data/Reducer/pageState';
import { PagesLayout } from './PagesLayout';
import { wlog } from '../../../Helper/wegaslog';
import { store } from '../../../data/store';
import { Actions } from '../../../data';
import pageState from '../../../data/Reducer/pageState';

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

const loadingPage = {
  type: 'HTML',
  props: {
    text: 'Loading pages...',
  },
};

interface PageModalState {
  type: 'newpage' | 'editpage' | 'close';
}
interface ErrorModalState {
  type: 'error';
  label: string;
}
interface SaveModalState {
  type: 'save';
  label: OnSaveStatus;
}
type ModalState = PageModalState | ErrorModalState | SaveModalState;

const savingProgressStatus: OnSaveStatus = {
  status: 'warning',
  text: 'Saving page in progress',
};

const savingDoneStatus: OnSaveStatus = {
  status: 'succes',
  text: 'The page has been saved',
};

const savingErrorStatus: OnSaveStatus = {
  status: 'error',
  text: 'Error : The page has not been saved',
};

interface PagesState {
  defaultPage: string;
  selectedPage: string;
  pages: PagesWithName;
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

const selectedPage = (pagesState: PagesState): WegasComponent =>
  pagesState.pages[pagesState.selectedPage].page;

export default function PageEditor() {
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });
  const [pagesState, setPagesState] = React.useState<PagesState>({
    defaultPage: '0',
    selectedPage: '0',
    pages: { '0': { name: 'Loading page', page: loadingPage } },
  });
  const [srcMode, setSrcMode] = React.useState<boolean>(false);
  const [editMode, setEditMode] = React.useState(false);
  const [showBorders, setShowBorders] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);

  const components = usePageComponentStore(s => s);

  const { dispatch } = store;

  const loadIndex = React.useCallback((firstTime: boolean = false) => {
    // getIndex to make sure index exists
    PageAPI.getIndex().then(index => {
      PageAPI.getAll().then(pages => {
        setPagesState(ops => ({
          defaultPage: index.defaultPageId,
          selectedPage: firstTime ? index.defaultPageId : ops.defaultPage,
          pages: returnPages(pages, index.root),
        }));
      });
    });
  }, []);

  const patchPage = React.useCallback(
    (page: WegasComponent, callback?: (res: WegasComponent) => void) => {
      setModalState({ type: 'save', label: savingProgressStatus });
      const diff = compare(selectedPage(pagesState), page);
      PageAPI.patch(JSON.stringify(diff), pagesState.selectedPage, true)
        .then(res => {
          setModalState({ type: 'save', label: savingDoneStatus });
          if (callback) {
            callback(res);
          }
        })
        .catch(e =>
          setModalState({
            type: 'save',
            label: {
              ...savingErrorStatus,
              text: savingErrorStatus.text + '(' + e + ')',
            },
          }),
        );
    },
    [pagesState],
  );

  const findComponent = React.useCallback(
    (path: string[]) => {
      const browsePath = [...path];
      const newPage = deepClone(selectedPage(pagesState)) as WegasComponent;
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
    [pagesState],
  );

  const onEdit = React.useCallback(
    (path?: string[]) => setPagesState(o => ({ ...o, editedPath: path })),
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
      const newPage = deepClone(selectedPage(pagesState)) as WegasComponent;
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
    [pagesState, patchPage],
  );

  const onUpdate = React.useCallback(
    (value: WegasComponent, componentPath?: string[], patch?: boolean) => {
      const path = componentPath ? componentPath : pagesState.editedPath;
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
    [patchPage, pagesState.editedPath, findComponent],
  );

  React.useEffect(() => {
    loadIndex(true);
  }, [loadIndex]);

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
              selectedPageId={pagesState.selectedPage}
              onPageClick={pageId =>
                setPagesState(ops => ({ ...ops, selectedPage: pageId }))
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
                status={
                  modalState.type === 'save' ? modalState.label : undefined
                }
                onSave={content =>
                  patchPage(selectedPage(pagesState), JSON.parse(content))
                }
              />
            </ReflexElement>
          )}
          {!srcMode && editMode && (
            <ReflexElement
              flex={editMode ? (pagesState.editedPath ? 0.3 : 0.125) : 0}
            >
              <div style={{ float: 'left' }}>
                LAYOUT
                <ComponentPalette />
              </div>
              {pagesState.editedPath && (
                <ComponentEditor
                  entity={findComponent(pagesState.editedPath).component}
                  update={onUpdate}
                  actions={[
                    {
                      label: 'Close',
                      action: () =>
                        setPagesState(o => ({ ...o, editedPath: undefined })),
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
                {pagesState.selectedPage ? (
                  <PageLoader selectedPage={selectedPage(pagesState)} />
                ) : (
                  'Loading pages...'
                )}
              </pageCTX.Provider>
            </ReflexElement>
          )}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
