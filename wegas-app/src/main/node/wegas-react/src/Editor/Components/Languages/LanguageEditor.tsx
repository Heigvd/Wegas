import * as React from 'react';
import { css, cx } from '@emotion/css';
import { LanguagesAPI } from '../../../API/languages.api';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { GameModel } from '../../../data/selectors';
import { getDispatch } from '../../../data/Stores/store';
import { Actions } from '../../../data';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { overrideSchema } from '../EntityEditor';
import {
  flex,
  grow,
  flexColumn,
  flexRow,
  itemCenter,
  flexDistribute,
  defaultMarginLeft,
} from '../../../css/classes';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import JSONForm from 'jsoninput';
import '../FormView';
import * as gameModelLanguageSchema from 'wegas-ts-api/src/generated/schemas/GameModelLanguage.json';
import { cloneDeep } from 'lodash';
import { ListView } from '../../../Components/ListView';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { commonTranslations } from '../../../i18n/common/common';
import { manageResponseHandler } from '../../../data/actions';
import { secondaryButtonStyle } from '../../../Components/Modal';

const languagePanelStyle = css({ width: '50%' });
const languageInnerPanelStyle = css({ width: '80%' });
const languageFormButtonsStyle = css({ width: '30%', marginTop: '2em' });

const languageSchema =
  gameModelLanguageSchema.schema as Schema.Object<AvailableViews>;

const createLanguageSchema = cloneDeep(languageSchema);
createLanguageSchema.properties!['visibility'].view!.type = 'hidden';
createLanguageSchema.properties!['active'].view!.type = 'hidden';
(
  createLanguageSchema.properties!['code'].view! as { readOnly: boolean }
).readOnly = false;
const editLanguageSchema = cloneDeep(languageSchema);
editLanguageSchema.properties!['indexOrder'] = { view: { type: 'hidden' } };
editLanguageSchema.properties!['visibility'].view!.type = 'hidden';

const defaultLanguage: IGameModelLanguage = {
  '@class': 'GameModelLanguage',
  active: false,
  code: 'DEF',
  lang: 'Default language',
  visibility: 'PRIVATE',
};

interface ISortedGameModelLanguage extends IGameModelLanguage {
  indexOrder: number;
}

interface LanguageEditFormProps {
  language: IGameModelLanguage;
  onChange: (gml: IGameModelLanguage) => void;
  schema: Schema.Object<AvailableViews>;
}

function LanguageEditForm({
  language,
  onChange,
  schema,
}: LanguageEditFormProps) {
  return (
    <JSONForm
      value={language}
      onChange={onChange}
      schema={overrideSchema(language, schema)}
    />
  );
}
export default function LanguageEditor() {
  const [selectedLanguageId, setSelectedLanguageId] =
    React.useState<number | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] =
    React.useState<IGameModelLanguage | null | undefined>();

  const languages = useGameModel().languages;
  const i18nEditorTabValues = useInternalTranslate(editorTabsTranslations);
  const i18nCommonValues = useInternalTranslate(commonTranslations);

  React.useEffect(() => {
    setSelectedLanguage(
      selectedLanguageId == null
        ? undefined
        : selectedLanguageId === -1
        ? defaultLanguage
        : languages.find(lang => lang.id === selectedLanguageId),
    );
  }, [languages, selectedLanguageId]);

  return (
    <div className={cx(flex, flexRow, grow)}>
      <div
        className={cx(flex, grow, itemCenter, flexColumn, languagePanelStyle)}
      >
        <h2>{i18nEditorTabValues.languageEditor.languages}</h2>
        <ListView
          selectedId={selectedLanguageId}
          className={languageInnerPanelStyle}
          items={languages.map(lang => ({ id: lang.id!, label: lang.lang }))}
          onSelect={id => {
            setSelectedLanguageId(id);
          }}
          onMove={up => {
            function dispatch(gameModel: IGameModel) {
              getDispatch()(
                Actions.GameModelActions.editGameModel(
                  gameModel,
                  String(GameModel.selectCurrent().id),
                ),
              );
            }

            const language = selectedLanguage as
              | ISortedGameModelLanguage
              | undefined;
            if (language != null) {
              if (up) {
                LanguagesAPI.upLanguage(language).then(dispatch);
              } else {
                const previousLanguage = languages.find(
                  (lang: ISortedGameModelLanguage) =>
                    lang.indexOrder === language.indexOrder + 1,
                );
                if (previousLanguage != null) {
                  LanguagesAPI.upLanguage(previousLanguage).then(dispatch);
                }
              }
            }
          }}
          onTrash={() => {
            if (selectedLanguage) {
              LanguagesAPI.deleteLanguage(selectedLanguage.code).then(
                gameModel => {
                  getDispatch()(
                    Actions.GameModelActions.editGameModel(
                      gameModel,
                      String(GameModel.selectCurrent().id),
                    ),
                  );
                },
              );
            }
          }}
          onNew={() => setSelectedLanguageId(-1)}
        />
      </div>
      <div
        className={cx(flex, grow, flexColumn, itemCenter, languagePanelStyle)}
      >
        {selectedLanguage && (
          <>
            <LanguageEditForm
              language={selectedLanguage}
              onChange={setSelectedLanguage}
              schema={
                selectedLanguageId === -1
                  ? createLanguageSchema
                  : editLanguageSchema
              }
            />
            <div
              className={cx(
                flex,
                flexRow,
                flexDistribute,
                languageFormButtonsStyle,
              )}
            >
              <Button
                label={i18nCommonValues.cancel}
                onClick={() => {
                  setSelectedLanguageId(undefined);
                }}
                className={secondaryButtonStyle}
              />
              <Button
                label={i18nCommonValues.save}
                onClick={() => {
                  if (selectedLanguage.id === -1) {
                    LanguagesAPI.updateLanguage(selectedLanguage).then(
                      gameModelLanguage => {
                        getDispatch()(
                          Actions.GameModelActions.editLanguage(
                            gameModelLanguage,
                            String(GameModel.selectCurrent().id),
                          ),
                        );
                      },
                    );
                  } else {
                    LanguagesAPI.addLanguage(selectedLanguage).then(res => {
                      getDispatch()(manageResponseHandler(res));
                    });
                  }
                }}
                className={defaultMarginLeft}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
