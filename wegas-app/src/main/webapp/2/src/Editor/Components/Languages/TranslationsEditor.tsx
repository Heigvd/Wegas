import { css, cx } from 'emotion';
import * as React from 'react';
import { LanguagesAPI } from '../../../API/languages.api';
import { DropMenu } from '../../../Components/DropMenu';
import { CheckBox } from '../../../Components/Inputs/Boolean/CheckBox';
import { useOkCancelModal } from '../../../Components/Modal';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  defaultMargin,
  defaultPadding,
  defaultMarginTop,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  MediumPadding,
  flexBetween,
  defaultMarginRight,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { entityIs } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { GameModel, VariableDescriptor } from '../../../data/selectors';
import { store, useStore } from '../../../data/Stores/store';
import { getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { unsafeTranslate } from '../FormView/translatable';
import { LightWeightHTMLEditor } from '../../../Components/HTML/LightWeightHTMLEditor';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { isArray } from 'lodash-es';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { classNameOrEmpty } from '../../../Helper/className';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { languagesTranslations } from '../../../i18n/languages/languages';

const langaugeVisitorHeaderStyle = css({
  borderBottom: `solid 1px ${themeVar.colors.PrimaryColor}`,
  marginTop: '0.5em',
  fontWeight: 700,
});

const columnMargin = css({
  margin: '1em',
});

const translationContainerStyle = (nbLanguages: number) => {
  return css({
    display: 'grid',
    gridTemplateColumns: new Array(nbLanguages).fill('auto').join(' '),
  });
};

const rowSpanStyle = (nbLanguages: number) =>
  css({
    gridColumnStart: 1,
    gridColumnEnd: nbLanguages + 1,
  });

const depthMarginStyle = (depth: number) =>
  css({
    marginLeft: depth + 'em',
  });

const inputStyle = css({
  //maxWidth: '500px',
  minWidth: '484px',
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
});

interface TranslationViewProps {
  variableId: number;
  selectedLanguages: IGameModelLanguage[];
  className?: string;
  showOptions: boolean;
}

function TranslationView({
  variableId,
  selectedLanguages,
  showOptions,
  className,
}: TranslationViewProps) {
  const i18nValues = useInternalTranslate(languagesTranslations);
  const variable = useStore(
    s => s.variableDescriptors[variableId],
    deepDifferent,
  );

  const translations: { [key: string]: ITranslatableContent } = React.useMemo(
    () =>
      Object.entries(variable || {})
        .filter(([, v]) => entityIs(v, 'TranslatableContent'))
        .reduce((o, [k, v]) => ({ ...o, [k]: v }), {}),
    [variable],
  );

  const [editedTranslations, setEditedTranslations] = React.useState<{
    [key: string]: { [code: string]: string | undefined };
  }>(
    Object.keys(translations).reduce(
      (o, k) => ({
        ...o,
        [k]: selectedLanguages.reduce(
          (o, l) => ({ ...o, [l.code]: undefined }),
          {},
        ),
      }),
      {},
    ),
  );

  const getValue = React.useCallback(
    (value: string | undefined, k: string, languageCode: string): string => {
      const editedValue = editedTranslations[k][languageCode];
      return editedValue == null ? (value == null ? '' : value) : editedValue;
    },
    [editedTranslations],
  );

  function setValue(k: string, languageCode: string) {
    return function (value: string | undefined) {
      setEditedTranslations(ot => {
        return {
          ...ot,
          [k]: {
            ...(ot[k] || {}),
            [languageCode]: value === '' ? undefined : value,
          },
        };
      });
    };
  }

  return (
    <>
      {Object.entries(translations).map(([k, v]) => {
        return (
          <React.Fragment key={k}>
            {selectedLanguages.map((language, index) => {
              const languageCode = language.code;
              const translation = unsafeTranslate(v, languageCode);
              return (
                <div
                  key={language.id!}
                  className={cx(
                    flex,
                    flexColumn,
                    defaultMargin,
                    inputStyle,
                    defaultPadding,
                    {
                      [classNameOrEmpty(className)]: index === 0,
                    },
                  )}
                >
                  <div
                    className={cx(
                      flex,
                      flexBetween,
                      rowSpanStyle(selectedLanguages.length),
                    )}
                  >
                    {k}
                    <div className={flex}>
                      <Button
                        icon="undo"
                        tooltip={i18nValues.undoModifications}
                        disabled={editedTranslations[k][languageCode] == null}
                        onClick={() => setValue(k, languageCode)(undefined)}
                      />
                      <Button
                        icon="save"
                        tooltip={i18nValues.saveModifications}
                        disabled={editedTranslations[k][languageCode] == null}
                        onClick={() => {
                          LanguagesAPI.updateTranslation(
                            languageCode,
                            v.id!,
                            editedTranslations[k][languageCode]!,
                          ).then(res => {
                            setValue(k, languageCode)(undefined);
                            store.dispatch(manageResponseHandler(res));
                          });
                        }}
                      />
                    </div>
                  </div>
                  {k === 'text' ? (
                    <LightWeightHTMLEditor
                      value={getValue(translation, k, languageCode)}
                      onChange={setValue(k, languageCode)}
                    />
                  ) : (
                    <SimpleInput
                      value={getValue(translation, k, languageCode)}
                      onChange={value =>
                        setValue(k, languageCode)(String(value))
                      }
                    />
                  )}
                  <div className={cx(flex, flexRow)}>
                    {showOptions &&
                    <>
                      <ConfirmButton
                        className={grow}
                        icon="outdent"
                        tooltip={i18nValues.outdateOtherLanguages}
                        onAction={success => {
                          if (success) {
                            LanguagesAPI.outdateTranslations(
                              languageCode,
                              v.id!,
                              getValue(translation, k, languageCode),
                            ).then(res => {
                              store.dispatch(manageResponseHandler(res));
                            });
                          }
                        }}
                      />
                      <Toggler
                        value={
                          v.translations[languageCode] == null ||
                          v.translations[languageCode].status == null
                            ? true
                            : !v.translations[languageCode].status.includes(
                                'outdated',
                              )
                        }
                        onChange={value => {
                          LanguagesAPI.setTranslationStatus(
                            languageCode,
                            v.id!,
                            getValue(translation, k, languageCode),
                            !value,
                          ).then(res => {
                            store.dispatch(manageResponseHandler(res));
                          });
                        }}
                        hint={i18nValues.markAsOutadated}
                        label="Outdated"
                        className={css({fontSize: '14px', color: themeVar.colors.DisabledColor})}
                      />
                    </>
                    }
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

function variableIsList(
  variable: IVariableDescriptor,
): variable is IVariableDescriptor & { itemsIds: number[] } {
  return (
    'itemsIds' in variable &&
    isArray((variable as IVariableDescriptor & { itemsIds: number[] }).itemsIds)
  );
}

interface LanguagesVisitorProps {
  itemId: number | undefined;
  selectedLanguages: IGameModelLanguage[];
  depth?: number;
  showOptions: boolean;
}

function LanguagesVisitor({
  itemId,
  selectedLanguages,
  depth = 0,
  showOptions,
}: LanguagesVisitorProps) {
  const item = useStore(() => VariableDescriptor.select(itemId), deepDifferent);
  const [show, setShow] = React.useState(false);
  if (item == null) {
    return null;
  }

  return (
    <>
      <div
        className={cx(
          flex,
          flexRow,
          itemCenter,
          langaugeVisitorHeaderStyle,
          rowSpanStyle(selectedLanguages.length),
          depthMarginStyle(depth),
        )}
      >
        <IconComp
          icon={withDefault(getIcon(item), 'question')}
          className={css({ marginRight: '5px' })}
        />
        {editorLabel(item)}
        {variableIsList(item) && (
          <IconButton
            icon={show ? 'caret-down' : 'caret-right'}
            onClick={() => setShow(os => !os)}
          />
        )}
      </div>
      <TranslationView
        variableId={item.id!}
        selectedLanguages={selectedLanguages}
        showOptions={showOptions}
        className={cx(depthMarginStyle(depth), defaultMarginTop)}
      />
      {show &&
        variableIsList(item) &&
        item.itemsIds.map(childrenId => (
          <LanguagesVisitor
            key={childrenId}
            itemId={childrenId}
            selectedLanguages={selectedLanguages}
            depth={depth + 1}
            showOptions = {showOptions}
          />
        ))}
    </>
  );
}

function languageLabel(language: IGameModelLanguage) {
  return `${language.lang} (${language.code})`;
}

interface LanguageClearAction {
  type: 'CLEAR_OUTDATED' | 'CLEAR_ALL';
  language: IGameModelLanguage;
}

interface LanguageCopyAction {
  type: 'COPY';
  language: IGameModelLanguage;
  sourceLanguage: IGameModelLanguage;
}

type LanguageAction = LanguageClearAction | LanguageCopyAction;

interface TranslationHeaderProps {
  language: IGameModelLanguage;
  languages: IGameModelLanguage[];
  onSelect: (action: LanguageAction) => void;
}

function TranslationHeader({
  language,
  languages,
  onSelect,
}: TranslationHeaderProps) {
  const i18nValues = useInternalTranslate(languagesTranslations);
  return (
    <div
      className={cx(flex, flexRow, columnMargin, itemCenter)}
    >
      <h3>{languageLabel(language)}</h3>
      <DropMenu
        icon="cog"
        items={[
          {
            label: i18nValues.clearTranslations,
            type: 'CLEAR_TRANSLATIONS',
            language,
            items: [
              {
                label: i18nValues.outdatedTranslations,
                language,
                type: 'CLEAR_OUTDATED',
              },
              {
                label: i18nValues.allTranslations,
                language,
                type: 'CLEAR_ALL',
              },
            ],
          },
          {
            label: i18nValues.copyTranslations,
            type: 'COPY_TRANSLATIONS',
            language,
            items: languages
              .filter(lang => lang.id !== language.id)
              .map(lang => ({
                label: languageLabel(lang),
                language: lang,
                type: 'COPY',
              })),
          },
        ]}
        onSelect={item => {
          if (item.type === 'COPY') {
            onSelect({
              type: 'COPY',
              language: language,
              sourceLanguage: item.language,
            });
          } else if (
            item.type === 'CLEAR_OUTDATED' ||
            item.type === 'CLEAR_ALL'
          ) {
            onSelect({
              type: item.type as LanguageClearAction['type'],
              language: language,
            });
          }
        }}
        containerClassName={cx(flex, itemCenter)}
      />
    </div>
  );
}

export function TranslationEditor() {
  const [languageAction, setLanguageAction] = React.useState<LanguageAction>();
  const [showOptions, setShowOptions] = React.useState(false);
  const { languages, root } = useStore(() => {
    return {
      languages: GameModel.selectCurrent().languages,
      root: GameModel.selectCurrent(),
    };
  });
  const i18nValues = useInternalTranslate(languagesTranslations);

  const [selectedLanguages, setSelectedLanguages] = React.useState(
    languages.filter(language => language.active),
  );
  const { showModal, OkCancelModal } = useOkCancelModal();

  function toggleLanguage(language: IGameModelLanguage) {
    setSelectedLanguages(selectedLanguages =>
      selectedLanguages.find(lang => lang.id === language.id)
        ? selectedLanguages.filter(lang => lang.id !== language.id)
        : [...selectedLanguages, language],
    );
  }

  return (
    <Toolbar className={cx(expandWidth, MediumPadding)}>
      <Toolbar.Header>
        <h2 className={grow}>{i18nValues.translationManagement}</h2>
        <DropMenu
          icon="cog"
          items={[
            {
              label: i18nValues.allTranslations,
              items: languages.map(language => ({
                label: (
                  <div className={cx(flex, flexRow, grow)}>
                    <div className={grow}>{languageLabel(language)}</div>
                    <CheckBox
                      value={selectedLanguages.includes(language)}
                      onChange={() => {
                        toggleLanguage(language);
                      }}
                    />
                  </div>
                ),
                language,
              })),
              onSelect: (language: IGameModelLanguage) => toggleLanguage(language),
            },
            {
              label: (
                <div
                  className={css({padding: '5px'})}
                  onClick={() => setShowOptions(showOptions => !showOptions)}>
                  <IconComp icon={showOptions ? "blind" : "eye"} className={defaultMarginRight}/>
                  {showOptions ? "Hide options" : "Show Options"}
                </div>
              )
            },
          ]}
        />
      </Toolbar.Header>
      <Toolbar.Content
        className={translationContainerStyle(selectedLanguages.length)}
      >
        {selectedLanguages.map((language) => (
          <TranslationHeader
            key={language.id!}
            language={language}
            languages={languages}
            onSelect={action => {
              showModal();
              setLanguageAction(action);
            }}

          />
        ))}
        {root.itemsIds.map(itemId => (
          <LanguagesVisitor
            key={itemId}
            itemId={itemId}
            selectedLanguages={selectedLanguages}
            showOptions = {showOptions}
          />
        ))}
        {languageAction && (
          <OkCancelModal
            onOk={() => {
              if (languageAction.type === 'COPY') {
                LanguagesAPI.copyTranslations(
                  languageAction.language,
                  languageAction.sourceLanguage,
                ).then(res => {
                  store.dispatch(manageResponseHandler(res));
                });
              } else {
                LanguagesAPI.clearTranslations(
                  languageAction.language,
                  languageAction.type === 'CLEAR_OUTDATED',
                ).then(res => {
                  store.dispatch(manageResponseHandler(res));
                });
              }

              setLanguageAction(undefined);
            }}
          >
            {languageAction.type === 'COPY'
              ? i18nValues.warningCopy(
                  languageLabel(languageAction.sourceLanguage),
                  languageLabel(languageAction.language),
                )
              : i18nValues.warningDelete(
                  languageLabel(languageAction.language),
                  languageAction.type === 'CLEAR_OUTDATED',
                )}
          </OkCancelModal>
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
