import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Menu } from '../../../Components/Menu';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import {
  JSONandJSEditor,
  OnSaveStatus,
} from '../ScriptEditors/JSONandJSEditor';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { TextPrompt } from '../TextPrompt';
import { compare, deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { ReflexElement, ReflexContainer, ReflexSplitter } from 'react-reflex';
import { splitter } from '../LinearTabLayout/LinearLayout';
import ComponentEditor from './ComponentEditor';
import { PageLoader } from './PageLoader';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { MessageString } from '../MessageString';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { css } from 'emotion';
import { flex } from '../../../css/classes';

const innerButtonStyle = css({
  margin: '2px auto 2px auto',
  width: 'fit-content',
});

interface PageContext {
  editMode: boolean;
  showBorders: boolean;
  showControls: boolean;
  handles: {
    [path: string]: { jsx: JSX.Element; dom: React.RefObject<HTMLDivElement> };
  };
  onDrop: (dndComponent: DnDComponent, path: string[], index?: number) => void;
  onDelete: (path: string[]) => void;
  onEdit: (path: string[]) => void;
  onUpdate: (value: WegasComponent, path?: string[], patch?: boolean) => void;
}

export const pageCTX = React.createContext<PageContext>({
  editMode: false,
  showBorders: false,
  showControls: true,
  handles: {},
  onDrop: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onUpdate: () => {},
});

const defaultPage = {
  type: 'FlexList',
  props: {
    listLayout: {
      flexDirection: 'column',
    },
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

const computePageLabel = (id: string, pageName?: string | null) =>
  pageName ? `${pageName} (${id})` : id;

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
  selectedPage: string;
  editedPath?: string[];
  pages: Pages;
}

export default function PageEditor() {
  const gameModelId = GameModel.selectCurrent().id!;
  const [modalState, setModalState] = React.useState<ModalState>({
    type: 'close',
  });
  const [pagesState, setPagesState] = React.useState<PagesState>({
    selectedPage: '0',
    pages: {
      '0': {
        '@index': 0,
        '@name': 'loading...',
        ...loadingPage,
      },
    },
  });
  const [srcMode, setSrcMode] = React.useState<boolean>(false);
  const [editMode, setEditMode] = React.useState(false);
  const [showBorders, setShowBorders] = React.useState(false);
  const handles = React.useRef({});
  const [showControls, setShowControls] = React.useState(true);

  const components = usePageComponentStore(s => s);
  const selectedPage: Page | undefined =
    pagesState.pages[String(pagesState.selectedPage)];

  const loadIndex = React.useCallback(gameModelId => {
    PageAPI.getIndex(gameModelId).then(res => {
      let pages: Pages = {};
      res.forEach((index, _i, indexes) => {
        PageAPI.get(gameModelId, index.id, true).then(res => {
          pages = { ...pages, ...res };
          if (Object.keys(pages).length === indexes.length) {
            setPagesState(s => ({
              ...s,
              pages: pages,
              selectedPage:
                s.selectedPage !== '0' ||
                !Object.keys(pages).includes(s.selectedPage)
                  ? s.selectedPage
                  : Object.keys(pages)[0],
            }));
          }
        });
      });
    });
  }, []);

  const patchPage = React.useCallback(
    (
      selectedPageId: string,
      page: Omit<Page, '@index'>,
      callback?: (res?: Page) => void,
    ) => {
      if (selectedPage) {
        setModalState({ type: 'save', label: savingProgressStatus });
        const diff = compare(selectedPage, page);
        PageAPI.patch(gameModelId, JSON.stringify(diff), selectedPageId, true)
          .then(res => {
            const resKey = Object.keys(res)[0];
            setPagesState(s => ({
              ...s,
              pages: { ...s.pages, [resKey]: res[resKey] },
            }));
            setModalState({ type: 'save', label: savingDoneStatus });
            if (callback) {
              callback(res);
            }
          })
          .catch(e => {
            setModalState({
              type: 'save',
              label: {
                ...savingErrorStatus,
                text: savingErrorStatus.text + '(' + e + ')',
              },
            });
            if (callback) {
              callback();
            }
          });
      }
    },
    [gameModelId, selectedPage],
  );
  editMode;
  React.useEffect(() => {
    loadIndex(gameModelId);
  }, [loadIndex, gameModelId]);

  const findComponent = React.useCallback(
    (path: string[], page?: Page) => {
      const browsePath = [...path];
      const newPage = page ? page : deepClone(selectedPage);
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
    (path?: string[]) => setPagesState(o => ({ ...o, editedPath: path })),
    [],
  );

  const onDrop = React.useCallback(
    (dndComponent: DnDComponent, path: string[], index?: number) => {
      let newIndex = index;
      const { newPage, component } = findComponent(path);
      if (component) {
        if (component.props.children === undefined) {
          component.props.children = [];
        }
        let droppedComp: WegasComponent | undefined;

        // If dndComponent.path we move the component in the new path
        if (dndComponent.path) {
          const { component, parent } = findComponent(
            dndComponent.path,
            newPage,
          );
          const dndCompIndex = Number(dndComponent.path.slice(-1));
          parent?.props.children?.splice(dndCompIndex, 1);
          droppedComp = component;
        }

        if (droppedComp == null) {
          droppedComp = {
            type: dndComponent.componentName,
            props: components[
              dndComponent.componentName
            ].getComputedPropsFromVariable(),
          };
        }

        const children = component.props.children;
        if (newIndex !== undefined) {
          children.splice(newIndex, 0, droppedComp);
          if (newIndex === children.length) {
            newIndex = children.length - 1;
          }
        } else {
          children.push(droppedComp);
        }
        path.push(`${newIndex ? newIndex : 0}`);
        patchPage(pagesState.selectedPage, newPage, page => {
          if (page) {
            onEdit(path);
          }
        });
      }
    },
    [components, pagesState.selectedPage, patchPage, onEdit, findComponent],
  );

  const onDelete = React.useCallback(
    (path: string[]) => {
      const newPage: Page = deepClone(selectedPage);
      let parent: WegasComponent = newPage;
      const browsePath = [...path];
      while (browsePath.length > 0) {
        if (parent.props.children) {
          // Avoid removing first componnent (FlexList) with browser path == 1
          if (browsePath.length == 1) {
            parent.props.children.splice(Number(browsePath[0]), 1);
            patchPage(pagesState.selectedPage, newPage);
            return;
          }
          parent = parent.props.children[Number(browsePath[0])];
        }
        browsePath.splice(0, 1);
      }
    },
    [selectedPage, pagesState.selectedPage, patchPage],
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
            patchPage(pagesState.selectedPage, newPage);
          }
        } else {
          patchPage(pagesState.selectedPage, value as Page);
        }
      }
    },
    [pagesState.selectedPage, patchPage, pagesState.editedPath, findComponent],
  );

  return (
    <Toolbar>
      <Toolbar.Header>
        <div>
          {modalState.type === 'newpage' || modalState.type === 'editpage' ? (
            <TextPrompt
              placeholder="Page name"
              defaultFocus
              onAction={(success, value) => {
                if (value === '') {
                  setModalState({
                    type: 'error',
                    label: 'The page must have a name',
                  });
                } else {
                  if (success) {
                    if (modalState.type === 'newpage') {
                      PageAPI.setPage(
                        gameModelId,
                        { ...defaultPage, ['@name']: value },
                        undefined,
                        true,
                      ).then(res => {
                        setPagesState(pages => ({ ...pages, ...res }));
                        setModalState({ type: 'close' });
                      });
                    } else {
                      patchPage(
                        pagesState.selectedPage,
                        {
                          ...selectedPage,
                          ['@name']: value,
                        },
                        () => {
                          setModalState({ type: 'close' });
                        },
                      );
                    }
                  }
                }
              }}
              onBlur={() => setModalState({ type: 'close' })}
              applyOnEnter
            />
          ) : (
            !srcMode && (
              <>
                <IconButton
                  icon="plus"
                  tooltip="Add a new page"
                  onClick={() => {
                    setModalState({ type: 'newpage' });
                  }}
                />
                {selectedPage !== undefined && (
                  <IconButton
                    icon="edit"
                    tooltip="Edit page name"
                    onClick={() => {
                      setModalState({ type: 'editpage' });
                    }}
                  />
                )}
              </>
            )
          )}
          <Menu
            label={
              selectedPage === undefined
                ? 'No selected page'
                : computePageLabel(
                    pagesState.selectedPage,
                    selectedPage['@name'],
                  )
            }
            items={Object.keys(pagesState.pages).map((k: string) => {
              return {
                label: (
                  <div className={flex}>
                    {computePageLabel(k, pagesState.pages[k]['@name'])}
                    <ConfirmButton
                      icon="trash"
                      onAction={success => {
                        if (success) {
                          PageAPI.deletePage(gameModelId, k).then(() =>
                            loadIndex(gameModelId),
                          );
                        }
                      }}
                    />
                  </div>
                ),
                id: k,
                value: k,
              };
            })}
            onSelect={({ id }) => {
              setPagesState(s => ({ ...s, selectedPage: id }));
            }}
          />
          {modalState.type === 'error' && (
            <MessageString
              type={modalState.type}
              value={modalState.label}
              duration={3000}
            />
          )}
        </div>
        <div style={{ margin: 'auto' }}>
          {editMode && (
            <>
              <Button
                label={'Toggle controls'}
                disableBorders={{ right: true }}
              >
                <div className={innerButtonStyle}>
                  <Toggler value={showControls} onChange={setShowControls} />
                </div>
              </Button>
              <Button label={'Toggle borders'} disableBorders={{ left: true }}>
                <div className={innerButtonStyle}>
                  <Toggler value={showBorders} onChange={setShowBorders} />
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
        {srcMode ? (
          <JSONandJSEditor
            content={JSON.stringify(selectedPage, null, 2)}
            status={modalState.type === 'save' ? modalState.label : undefined}
            onSave={content =>
              patchPage(pagesState.selectedPage, JSON.parse(content))
            }
          />
        ) : (
          <ReflexContainer orientation="vertical" className={splitter}>
            <ReflexElement
              flex={editMode ? (pagesState.editedPath ? 0.3 : 0.125) : 0}
            >
              <div style={{ float: 'left' }}>
                <ComponentPalette />
              </div>
              {pagesState.editedPath && (
                <ComponentEditor
                  entity={findComponent(pagesState.editedPath).component}
                  isFlexItem={
                    findComponent(pagesState.editedPath).parent?.type ===
                    'FlexList'
                  }
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
            {editMode && <ReflexSplitter />}
            <ReflexElement style={{ display: 'flex' }}>
              <pageCTX.Provider
                value={{
                  editMode,
                  showControls,
                  showBorders,
                  handles: handles.current,
                  onDrop,
                  onDelete,
                  onEdit,
                  onUpdate,
                }}
              >
                <PageLoader selectedPage={selectedPage} />
              </pageCTX.Provider>
            </ReflexElement>
          </ReflexContainer>
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
