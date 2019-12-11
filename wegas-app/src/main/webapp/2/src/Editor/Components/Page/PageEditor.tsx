import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { ConfirmButton } from '../../../Components/Button/ConfirmButton';
import { Menu } from '../../../Components/Menu';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import {
  JSONandJSEditor,
  OnSaveStatus,
} from '../ScriptEditors/JSONandJSEditor';
import { grow } from '../../../css/classes';
import { IconButton } from '../../../Components/Button/IconButton';
import { TextPrompt } from '../TextPrompt';
import { StyledLabel } from '../../../Components/AutoImport/String/String';
import { compare, deepClone } from 'fast-json-patch';
import { ComponentPalette, DnDComponent } from './ComponentPalette';
import { usePageComponentStore } from '../../../Components/PageComponents/componentFactory';
import { ReflexElement, ReflexContainer, ReflexSplitter } from 'react-reflex';
import { splitter } from '../LinearTabLayout/LinearLayout';
import ComponentEditor from './ComponentEditor';
import { PageLoader } from './PageLoader';

interface PageContext {
  editMode: boolean;
  onDrop?: (dndComponent: DnDComponent, path: string[], index?: number) => void;
  onDelete?: (path: string[]) => void;
  onEdit?: (path: string[]) => void;
}

export const pageCTX = React.createContext<PageContext>({
  editMode: false,
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
  // const [editedComponent, setEditedComponent] = React.useState<
  //   WegasComponent & { path: string[] }
  // >();
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
                s.selectedPage !== '0' ? s.selectedPage : Object.keys(pages)[0],
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
      callback?: (res: Page) => void,
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
          .catch(e =>
            setModalState({
              type: 'save',
              label: {
                ...savingErrorStatus,
                text: savingErrorStatus.text + '(' + e + ')',
              },
            }),
          );
      }
    },
    [gameModelId, selectedPage],
  );
  editMode;
  React.useEffect(() => {
    loadIndex(gameModelId);
  }, [loadIndex, gameModelId]);

  const findComponent = React.useCallback(
    (path: string[]) => {
      const browsePath = [...path];
      const newPage = deepClone(selectedPage);
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
      const { newPage, component } = findComponent(path);
      if (component && component.props.children) {
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
        patchPage(pagesState.selectedPage, newPage);
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
    (value: WegasComponent) => {
      if (pagesState.editedPath) {
        const { newPage, parent } = findComponent(pagesState.editedPath);
        if (parent) {
          if (parent.props.children && pagesState.editedPath) {
            parent.props.children.splice(
              Number(pagesState.editedPath[pagesState.editedPath.length - 1]),
              1,
              value,
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
        <div className={grow}>
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
                  <span>
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
                  </span>
                ),
                id: k,
              };
            })}
            onSelect={({ id }) => {
              setPagesState(s => ({ ...s, selectedPage: id }));
            }}
          />
          {modalState.type === 'error' && (
            <StyledLabel
              type={modalState.type}
              value={modalState.label}
              duration={3000}
            />
          )}
        </div>
        {!srcMode && (
          <button onClick={() => setEditMode(!editMode)}>
            {editMode ? 'View mode' : 'Edit mode'}
          </button>
        )}
        <button
          onClick={() => {
            setSrcMode(src => !src);
            setEditMode(false);
          }}
        >
          {srcMode ? 'Preview mode' : 'Source code mode'}
        </button>
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
            <ReflexElement>
              <pageCTX.Provider
                value={{
                  editMode: editMode,
                  onDrop: onDrop,
                  onDelete: onDelete,
                  onEdit: onEdit,
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
