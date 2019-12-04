import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { ConfirmButton } from '../../../Components/Button/ConfirmButton';
import { Menu } from '../../../Components/Menu';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import { PageLoader, pageCTX, PageContextProvider } from './PageLoader';
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
import { wlog } from '../../../Helper/wegaslog';
import { ReflexElement, ReflexContainer, ReflexSplitter } from 'react-reflex';
import { splitter } from '../LinearTabLayout/LinearLayout';

const defaultPage = {
  type: 'Layout/List',
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
  pages: Pages;
}

function PageEditor() {
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
  const { editMode, setEditMode } = React.useContext(pageCTX);
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

  React.useEffect(() => {
    loadIndex(gameModelId);
  }, [loadIndex, gameModelId]);

  const onDrop = React.useCallback(
    (dndComponent: DnDComponent, path: string[], index?: number) => {
      wlog(dndComponent);
      wlog(path);
      wlog(index);
      const newPage = deepClone(selectedPage);
      let children = newPage.props.children;
      const browsePath = [...path];
      while (browsePath.length > 0) {
        children = children[browsePath[0]].props.children;
        browsePath.splice(0, 1);
      }

      if (children) {
        const droppedComp: WegasComponent = {
          type: dndComponent.componentName,
          props: components[
            dndComponent.componentName
          ].getComputedPropsFromVariable(),
        };
        if (index) {
          children.splice(index, 0, droppedComp);
        } else {
          children.push(droppedComp);
        }
        patchPage(pagesState.selectedPage, newPage);
      }
    },
    [components, pagesState.selectedPage, patchPage, selectedPage],
  );

  const onDelete = React.useCallback((path: string[]) => {
    wlog('DELETE : ' + JSON.stringify(path));
  }, []);

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
        <ReflexContainer orientation="vertical" className={splitter}>
          <ReflexElement flex={editMode ? 0.125 : 0}>
            <ComponentPalette />
          </ReflexElement>
          {editMode && <ReflexSplitter />}
          <ReflexElement>
            {selectedPage &&
              (srcMode ? (
                <JSONandJSEditor
                  content={JSON.stringify(selectedPage, null, 2)}
                  status={
                    modalState.type === 'save' ? modalState.label : undefined
                  }
                  onSave={content =>
                    patchPage(pagesState.selectedPage, JSON.parse(content))
                  }
                />
              ) : (
                <PageLoader
                  selectedPage={selectedPage}
                  onDrop={onDrop}
                  onDelete={onDelete}
                />
              ))}
          </ReflexElement>
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ContextedPageEditor() {
  return (
    <PageContextProvider>
      <PageEditor />
    </PageContextProvider>
  );
}
