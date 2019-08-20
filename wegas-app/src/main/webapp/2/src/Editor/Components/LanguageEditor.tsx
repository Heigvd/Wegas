import * as React from 'react';
import { css, cx } from 'emotion';
import { Toolbar } from '../../Components/Toolbar';
import { IconButton } from '../../Components/Button/IconButton';
import { themeVar } from '../../Components/Theme';
import { LanguagesAPI } from '../../API/languages.api';
import { useGameModel } from '../../Components/Hooks/useGameModel';
import { GameModel } from '../../data/selectors';
import { getDispatch } from '../../data/store';
import { Actions } from '../../data';
import { Schema } from 'jsoninput';
import { AvailableViews } from './FormView';
import getEditionConfig from '../editionConfig';
import { overrideSchema } from './EntityEditor';
import { asyncSFC } from '../../Components/HOC/asyncSFC';

const grow = css({ flex: '1 1 auto' });
const flex = css({ display: 'flex' });
const column = css({ flexDirection: 'column' });
const inline = css({ display: 'inline-block' });
const centered = css({ justifyContent: 'center' });
const label = css({ width: '55px' });

const edition = { color: themeVar.primaryDarkerColor };
const simple = { color: themeVar.primaryLighterColor };

const title = 'Translation Manager';

export function LanguageEditor() {
  const [editMode, setEditMode] = React.useState(false);
  const languages = useGameModel().languages;
  const [selectedLanguages, setSelectedLanguages] = React.useState(() =>
    languages.filter((_val, index) => index < 2).map(language => language.code),
  );
  return (
    <Toolbar>
      <Toolbar.Header>
        <span className={cx(flex, grow)}>{title}</span>
        <div className={inline}>
          <IconButton
            icon="cog"
            fixedWidth
            onClick={() => setEditMode(oldMode => !oldMode)}
            style={editMode ? edition : simple}
          />
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        <Toolbar>
          <Toolbar.Header>
            {languages.map((language, index) => {
              const selected = selectedLanguages.includes(language.code);
              return (
                <>
                  {index > 0 && (
                    <div
                      className={cx(flex, grow, centered)}
                      key={'UP' + language.code}
                    >
                      <IconButton
                        icon="arrows-alt-h"
                        tooltip="Priorize language on the right"
                        onClick={() => {
                          LanguagesAPI.upLanguage(language).then(gameModel => {
                            getDispatch()(
                              Actions.GameModelActions.editGameModel(
                                gameModel,
                                String(GameModel.selectCurrent().id),
                              ),
                            );
                          });
                        }}
                      />
                    </div>
                  )}
                  <div key={language.code} className={cx(flex, grow, centered)}>
                    {language.code}
                    <input
                      type="checkbox"
                      defaultChecked={selectedLanguages.includes(language.code)}
                      onClick={() =>
                        setSelectedLanguages(oldSelected => {
                          if (selected) {
                            return oldSelected.filter(
                              code => code !== language.code,
                            );
                          } else {
                            return [...oldSelected, language.code];
                          }
                        })
                      }
                    />
                  </div>
                </>
              );
            })}
          </Toolbar.Header>
          <Toolbar.Content>
            {languages
              .filter(languages => selectedLanguages.includes(languages.code))
              .map(language => {
                const asyncForm = async () => {
                  const [Form, schema] = await Promise.all<
                    typeof import('./Form')['Form'],
                    Schema<AvailableViews>
                  >([
                    import('./Form').then(m => m.Form),
                    getEditionConfig(language) as Promise<
                      Schema<AvailableViews>
                    >,
                  ]);
                  return (
                    <Form
                      entity={language}
                      actions={[
                        {
                          label: 'Save',
                          action: function(e: IGameModelLanguage) {
                            LanguagesAPI.updateLanguage(e);
                            // Update store here
                            debugger;
                          },
                        },
                      ]}
                      schema={overrideSchema(language, schema)}
                    />
                  );
                };

                const Test = asyncSFC(
                  asyncForm,
                  () => <div>load...</div>,
                  ({ err }: { err: Error }) => <span>{err.message}</span>,
                );

                return (
                  <div key={language.code} className={cx(flex, grow, centered)}>
                    <div className={column}>
                      <div>
                        {language.lang + ` (${language.code}) `}
                        {editMode && (
                          <IconButton
                            icon="save"
                            tooltip="save language properties"
                            type="submit"
                          />
                        )}
                      </div>

                      <Test />

                      {editMode && (
                        <>
                          <div className={flex}>
                            <div className={label}>{'Code: '}</div>
                            <input
                              type="text"
                              defaultValue={language.code}
                              name="CODE"
                            />
                          </div>
                          <div className={flex}>
                            <div className={label}>{'Name: '}</div>
                            <input type="text" defaultValue={language.lang} />
                          </div>
                          <div className={flex}>
                            <div className={label}>{'Active: '}</div>
                            <input
                              type="checkbox"
                              defaultChecked={language.active}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </Toolbar.Content>
        </Toolbar>
      </Toolbar.Content>
    </Toolbar>
  );
}
