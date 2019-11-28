import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { ConfirmButton } from '../../../Components/Button/ConfirmButton';
import { Menu } from '../../../Components/Menu';
import { PageAPI } from '../../../API/pages.api';
import { GameModel } from '../../../data/selectors';
import { PageLoader } from './PageLoader';
import { JSONandJSEditor } from '../ScriptEditors/JSONandJSEditor';
import { grow } from '../../../css/classes';

const computePageLabel = (id: string, pageName?: string | null) =>
  pageName ? `${pageName} (${id})` : id;

export default function PageEditor() {
  const gameModelId = GameModel.selectCurrent().id!;
  const [pages, setPages] = React.useState<Pages>({});
  const [selectedPageId, setSelectedPageId] = React.useState<string>();
  const [srcMode, setSrcMode] = React.useState<boolean>(false);
  // const [editMode, setEditMode] = React.useState<boolean>(false);
  const selectedPage =
    pages === undefined || selectedPageId === undefined
      ? undefined
      : pages[selectedPageId];

  const loadIndex = React.useCallback(gameModelId => {
    PageAPI.getIndex(gameModelId).then(res => {
      let pages: Pages = {};
      res.forEach((index, _i, indexes) => {
        PageAPI.get(gameModelId, index.id, true).then(res => {
          pages = { ...pages, ...res };
          if (Object.keys(pages).length === indexes.length) {
            setPages(pages);
            setSelectedPageId(id => (id ? id : Object.keys(pages)[0]));
          }
        });
      });
    });
  }, []);

  React.useEffect(() => {
    loadIndex(gameModelId);
  }, [loadIndex, gameModelId]);

  return (
    <Toolbar>
      <Toolbar.Header>
        <div className={grow}>
          <Menu
            label={
              selectedPageId === undefined || selectedPage === undefined
                ? 'No selected page'
                : computePageLabel(selectedPageId, selectedPage['@name'])
            }
            items={Object.keys(pages).map((k: string) => {
              return {
                label: (
                  <span>
                    {computePageLabel(k, pages[k]['@name'])}
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
              setSelectedPageId(id);
            }}
          />
        </div>
        <button onClick={() => setSrcMode(src => !src)}>
          {srcMode ? 'Preview' : 'Source code'}
        </button>
      </Toolbar.Header>
      <Toolbar.Content>
        {selectedPage &&
          (srcMode ? (
            <JSONandJSEditor
              content={JSON.stringify(selectedPage, null, 2)}
              onSave={() => ({ status: 'succes' })}
            />
          ) : (
            <PageLoader selectedPage={selectedPage} />
          ))}
      </Toolbar.Content>
    </Toolbar>
  );
}
