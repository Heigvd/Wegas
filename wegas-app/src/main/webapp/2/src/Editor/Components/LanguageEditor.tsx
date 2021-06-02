import * as React from 'react';
import { cx } from 'emotion';
import { Toolbar } from '../../Components/Toolbar';
import { LanguagesAPI } from '../../API/languages.api';
import { useGameModel } from '../../Components/Hooks/useGameModel';
import { GameModel } from '../../data/selectors';
import { getDispatch } from '../../data/Stores/store';
import { Actions } from '../../data';
import { Schema } from 'jsoninput';
import { AvailableViews } from './FormView';
import getEditionConfig from '../editionConfig';
import { overrideSchema } from './EntityEditor';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { flex, grow, flexColumn, defaultPadding, defaultPaddingLeft } from '../../css/classes';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { IGameModelLanguage } from 'wegas-ts-api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { borderBottom } from './FormView/commonView';

const edition = { color: themeVar.colors.ActiveColor };
const simple = { color: themeVar.colors.DarkTextColor };

const title = 'Translation Manager';

export default function LanguageEditor() {
  const [editMode, setEditMode] = React.useState(false);
  const languages = useGameModel().languages;
  const [selectedLanguages, setSelectedLanguages] = React.useState(() =>
    languages.filter((_val, index) => index < 2).map(language => language.code),
  );

  React.useEffect(() => {
    LanguagesAPI.getEditableLanguages().then(editable => {
      setSelectedLanguages(
        languages
          .sort((langA, langB) => {
            const editA = editable.includes(langA);
            const editB = editable.includes(langB);
            if (editA && !editB) {
              return -1;
            }
            if (!editA && editB) {
              return 1;
            }
            return 0;
          })
          .filter((_val, index) => index < 2)
          .map(language => language.code),
      );
    });
  }, [languages]);

  return (
    <div className={cx(flex, grow)}>
      <Toolbar className={defaultPadding}>
        <Toolbar.Header className={borderBottom}>
          <div className={cx(flex, grow)}>{title}</div>
          <Button
            icon={{
              icon: 'cog',
              style: editMode ? edition : simple,
            }}
            onClick={() => setEditMode(oldMode => !oldMode)}
          />
        </Toolbar.Header>
        <Toolbar.Content>
          <Toolbar>
            <Toolbar.Header>
              {languages.map((language, index) => {
                const selected = selectedLanguages.includes(language.code);
                return (
                  <React.Fragment key={language.code}>
                    {index > 0 && (
                      <div className={cx(flex, grow)}>
                        <Button
                          icon="arrows-alt-h"
                          tooltip="Priorize language on the right"
                          onClick={() => {
                            LanguagesAPI.upLanguage(language).then(
                              gameModel => {
                                getDispatch()(
                                  Actions.GameModelActions.editGameModel(
                                    gameModel,
                                    String(GameModel.selectCurrent().id),
                                  ),
                                );
                              },
                            );
                          }}
                        />
                      </div>
                    )}
                    <div className={cx(flex, grow, defaultPaddingLeft)}>
                      {language.code}
                      <input
                        type="checkbox"
                        defaultChecked={selectedLanguages.includes(
                          language.code,
                        )}
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
                  </React.Fragment>
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
                            sorting: 'button',
                            action: function (e: IGameModelLanguage) {
                              LanguagesAPI.updateLanguage(e).then(
                                gameModelLanguage => {
                                  getDispatch()(
                                    Actions.GameModelActions.editLanguage(
                                      gameModelLanguage,
                                      String(GameModel.selectCurrent().id),
                                    ),
                                  );
                                },
                              );
                            },
                          },
                        ]}
                        config={overrideSchema(language, schema)}
                      />
                    );
                  };

                  const LanguageForm = asyncSFC(asyncForm);

                  return (
                    <div
                      key={language.code}
                      className={cx(flex, grow)}
                    >
                      <div className={cx(flex, flexColumn)}>
                        <div className={defaultPaddingLeft}>{`${language.lang} (${language.code})`}</div>
                        {editMode && <LanguageForm />}
                      </div>
                    </div>
                  );
                })}
            </Toolbar.Content>
          </Toolbar>
        </Toolbar.Content>
      </Toolbar>
    </div>
  );
}
