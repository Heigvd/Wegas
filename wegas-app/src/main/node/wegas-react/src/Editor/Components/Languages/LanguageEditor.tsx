import { css, cx } from '@emotion/css';
import JSONForm, { Schema } from 'jsoninput';
import { cloneDeep } from 'lodash';
import * as React from 'react';
import { IGameModel, IGameModelLanguage } from 'wegas-ts-api';
import gameModelLanguageSchema from 'wegas-ts-api/src/generated/schemas/GameModelLanguage.json';
import { LanguagesAPI } from '../../../API/languages.api';
import { IManagedResponse } from '../../../API/rest';
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
import { editingStore } from '../../../data/Stores/editingStore';
import { getDispatch } from '../../../data/Stores/store';
import { wwarn } from '../../../Helper/wegaslog';
import { commonTranslations } from '../../../i18n/common/common';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { overrideSchema, parseEvent } from '../EntityEditor';
import '../FormView';
import { AvailableViews } from '../FormView';
import { ISelectProps } from '../FormView/Select';
import { MessageString } from '../MessageString';

const languagePanelStyle = css({ width: '50%' });
const languageInnerPanelStyle = css({ width: '80%' });
const languageFormButtonsStyle = css({ width: '30%', marginTop: '2em' });

const languageSchema =
  gameModelLanguageSchema.schema as Schema.Object<AvailableViews>;
languageSchema.properties!['indexOrder'] = { view: { type: 'hidden' } };

const createLanguageSchema = cloneDeep(languageSchema);
createLanguageSchema.properties!['visibility'].view!.type = 'hidden';
createLanguageSchema.properties!['active'].view!.type = 'hidden';

const editLanguageSchema = cloneDeep(languageSchema);
editLanguageSchema.properties!['visibility'].view!.type = 'hidden';
(
  editLanguageSchema.properties!['code'].view! as { readOnly: boolean }
).readOnly = true;

const defaultLanguage: IGameModelLanguage = {
  '@class': 'GameModelLanguage',
  active: false,
  code: 'DEF',
  lang: 'Default language',
  visibility: 'PRIVATE',
};

function moveLanguage(
  up: boolean,
  language: IGameModelLanguage | undefined | null,
  languages: IGameModelLanguage[],
) {
  function dispatch(gameModel: IGameModel) {
    getDispatch()(
      Actions.GameModelActions.editGameModel(
        gameModel,
        String(GameModel.selectCurrent().id),
      ),
    );
  }

  if (language != null) {
    if (up) {
      LanguagesAPI.upLanguage(language).then(dispatch);
    } else {
      const previousLanguage = languages.find(
        (lang: ISortedGameModelLanguage) =>
          lang.indexOrder === (language.indexOrder || 0) + 1,
      );
      if (previousLanguage != null) {
        LanguagesAPI.upLanguage(previousLanguage).then(dispatch);
      }
    }
  }
}

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
  const [selectedLanguage, setSelectedLanguage] =
    React.useState<IGameModelLanguage>(defaultLanguage);

  const [error, setError] = React.useState<string | undefined>();

  const languages = useGameModel().languages;
  const i18nEditorTabValues = useInternalTranslate(editorTabsTranslations);
  const i18nCommonValues = useInternalTranslate(commonTranslations);
  const translatableLanguages = useTranslatableLanguages();

  const schema =
    selectedLanguage.id == null ? createLanguageSchema : editLanguageSchema;

  React.useEffect(() => {
    if (
      Array.isArray(translatableLanguages) &&
      translatableLanguages.length > 0 &&
      createLanguageSchema.properties != null &&
      createLanguageSchema.properties['code'] != null &&
      createLanguageSchema.properties['code']['view'] != null
    ) {
      createLanguageSchema.properties.code.view.type = 'select';
      (createLanguageSchema.properties.code as ISelectProps).view.choices =
        translatableLanguages.filter(
          code => !languages.map(lang => lang.code).includes(code),
        );
      (
        createLanguageSchema.properties.code as ISelectProps
      ).view.allowAnyValue = true;
    }
  }, [translatableLanguages, languages, createLanguageSchema]);

  return (
    <div className={cx(flex, flexRow, grow)}>
      <div
        className={cx(flex, grow, itemCenter, flexColumn, languagePanelStyle)}
      >
        <h2>{i18nEditorTabValues.languageEditor.languages}</h2>
        <ListView
          selectedId={selectedLanguage?.id}
          className={languageInnerPanelStyle}
          items={languages.map(lang => ({ id: lang.id!, label: lang.lang }))}
          onSelect={id => {
            setSelectedLanguage(
              languages.find(lang => lang.id === id) || defaultLanguage,
            );
          }}
          onMove={up => moveLanguage(up, selectedLanguage, languages)}
          onNew={() => setSelectedLanguage(defaultLanguage)}
          // NOT IMPLENTED YET
          // onTrash={() => {
          //   if (selectedLanguage) {
          //     LanguagesAPI.deleteLanguage(selectedLanguage.code).then(
          //       gameModel => {
          //         getDispatch()(
          //           Actions.GameModelActions.editGameModel(
          //             gameModel,
          //             String(GameModel.selectCurrent().id),
          //           ),
          //         );
          //       },
          //     );
          //   }
          // }}
        />
      </div>
      <div
        className={cx(flex, grow, flexColumn, itemCenter, languagePanelStyle)}
      >
        {selectedLanguage && (
          <>
            <MessageString
              type="warning"
              duration={5000}
              value={error}
              onLabelVanish={() => setError(undefined)}
            />
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
                  setSelectedLanguage(defaultLanguage);
                }}
                className={secondaryButtonStyle}
              />
              <Button
                label={i18nCommonValues.save}
                onClick={() => {
                  if (selectedLanguage.id != null) {
                    LanguagesAPI.updateLanguage(selectedLanguage)
                      .then(gameModelLanguage => {
                        getDispatch()(
                          Actions.GameModelActions.editLanguage(
                            gameModelLanguage,
                            String(GameModel.selectCurrent().id),
                          ),
                        );
                      })
                      .catch(e => {
                        wwarn(e);
                      });
                  } else {
                    LanguagesAPI.addLanguage(selectedLanguage).then(
                      (res: IManagedResponse) => {
                        const { deletedEntities, events, updatedEntities } =
                          res;
                        setError(
                          events
                            .map(event => parseEvent(event).message)
                            .join('\n'),
                        );
                        editingStore.dispatch(
                          manageResponseHandler({
                            '@class': 'ManagedResponse',
                            deletedEntities,
                            updatedEntities,
                            events: [],
                          }),
                        );
                      },
                    );
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
