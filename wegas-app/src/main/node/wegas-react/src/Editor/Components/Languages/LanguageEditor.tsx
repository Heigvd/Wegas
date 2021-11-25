import { css, cx } from '@emotion/css';
import JSONForm, { Schema } from 'jsoninput';
import { cloneDeep } from 'lodash';
import * as React from 'react';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import * as gameModelLanguageSchema from 'wegas-ts-api/src/generated/schemas/GameModelLanguage.json';
import { LanguagesAPI } from '../../../API/languages.api';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { useTranslatableLanguages } from '../../../Components/Hooks/useLanguages';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { ListView } from '../../../Components/ListView';
import {
  defaultMarginLeft,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
  grow,
  itemCenter,
  secondaryButtonStyle,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { manageResponseHandler } from '../../../data/actions';
import { GameModel } from '../../../data/selectors';
import { getDispatch } from '../../../data/Stores/store';
import { commonTranslations } from '../../../i18n/common/common';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { overrideSchema } from '../EntityEditor';
import '../FormView';
import { AvailableViews } from '../FormView';
import { ISelectProps } from '../FormView/Select';

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
  const [selectedLanguageId, setSelectedLanguageId] = React.useState<
    number | undefined
  >(undefined);
  const [selectedLanguage, setSelectedLanguage] = React.useState<
    IGameModelLanguage | null | undefined
  >();

  const languages = useGameModel().languages;
  const i18nEditorTabValues = useInternalTranslate(editorTabsTranslations);
  const i18nCommonValues = useInternalTranslate(commonTranslations);
  const translatableLanguages = useTranslatableLanguages();

  const schema =
    selectedLanguageId === -1 ? createLanguageSchema : editLanguageSchema;

  if (
    Array.isArray(translatableLanguages) &&
    schema.properties != null &&
    schema.properties['code'] != null &&
    schema.properties['code']['view'] != null
  ) {
    schema.properties.code.view.type = 'select';
    (schema.properties.code as ISelectProps).view.choices =
      translatableLanguages.filter(
        code => !languages.map(lang => lang.code).includes(code),
      );
    (schema.properties.code as ISelectProps).view.allowAnyValue = true;
  }

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
              schema={schema}
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
