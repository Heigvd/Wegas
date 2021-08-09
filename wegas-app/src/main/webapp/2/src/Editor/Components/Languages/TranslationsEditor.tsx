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
import getEditionConfig, { getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { unsafeTranslate } from '../FormView/translatable';
import { LightWeightHTMLEditor } from '../../../Components/HTML/LightWeightHTMLEditor';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { isArray, isNumber } from 'lodash-es';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { languagesTranslations } from '../../../i18n/languages/languages';
import {
  generateSchema,
  makeItems,
  testCode,
} from '../FormView/Script/Expressions/expressionEditorHelpers';
import { wlog } from '../../../Helper/wegaslog';
import { getConfig, overrideSchema } from '../EntityEditor';
import { Schema } from 'jsoninput';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { commonTranslations } from '../../../i18n/common/common';
import { BaseView } from 'jsoninput/typings/types';
import { genVarItems } from '../FormView/TreeVariableSelect';

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

interface SharedItemViewProps {
  label: string;
  showOptions: boolean;
}

interface TranslationItemViewProps extends SharedItemViewProps {
  value: string;
  outdated: boolean;
  itemClassName?: string;
  rowSpanClassName: string;
  disabledButtons: boolean;
  onUndo: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  onOutdateOthers: () => void;
  onOutdate: (value: boolean) => void;
}

function TranslationItemView({
  label,
  value,
  outdated,
  showOptions,
  itemClassName,
  rowSpanClassName,
  disabledButtons,
  onUndo,
  onSave,
  onValueChange,
  onOutdateOthers,
  onOutdate,
}: TranslationItemViewProps) {
  const i18nValues = useInternalTranslate(languagesTranslations);

  return (
    <div
      className={cx(
        flex,
        flexColumn,
        defaultMargin,
        inputStyle,
        defaultPadding,
        itemClassName,
      )}
    >
      <div className={cx(flex, flexBetween, rowSpanClassName)}>
        {label}
        <div className={flex}>
          <Button
            icon="undo"
            tooltip={i18nValues.undoModifications}
            disabled={disabledButtons}
            onClick={onUndo}
          />
          <Button
            icon="save"
            tooltip={i18nValues.saveModifications}
            disabled={disabledButtons}
            onClick={onSave}
          />
        </div>
      </div>
      {label === 'text' ? (
        <LightWeightHTMLEditor value={value} onChange={onValueChange} />
      ) : (
        <SimpleInput
          value={value}
          onChange={value => onValueChange(String(value))}
        />
      )}
      <div className={cx(flex, flexRow)}>
        {showOptions && (
          <>
            <ConfirmButton
              className={grow}
              icon="outdent"
              tooltip={i18nValues.outdateOtherLanguages}
              onAction={success => {
                if (success) {
                  onOutdateOthers();
                }
              }}
            />
            <Toggler
              value={outdated}
              onChange={onOutdate}
              hint={i18nValues.markAsOutadated}
              label={i18nValues.outdated}
              className={css({
                fontSize: '14px',
                color: themeVar.colors.DisabledColor,
              })}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface TranslationViewItemProps extends SharedItemViewProps {
  language: IGameModelLanguage;
  index: number;
  depth: number;
  selectedLanguages: IGameModelLanguage[];
}

interface TranslatableContentViewProps extends TranslationViewItemProps {
  value: ITranslatableContent;
}

function TranslatableContentView({
  value,
  label,
  language,
  index,
  depth,
  selectedLanguages,
  showOptions,
}: TranslatableContentViewProps) {
  const languageCode = language.code;
  const translation = unsafeTranslate(value, languageCode);

  const [editedTranslation, setEditedTranslation] = React.useState<{
    [code: string]: string | undefined;
  }>({});

  const getValue = React.useCallback(
    (value: string | undefined, languageCode: string): string => {
      const editedValue = editedTranslation[languageCode];
      return editedValue == null ? (value == null ? '' : value) : editedValue;
    },
    [editedTranslation],
  );

  function setValue(languageCode: string) {
    return function (value: string | undefined) {
      setEditedTranslation(ot => {
        return {
          ...(ot || {}),
          [languageCode]: value === '' ? undefined : value,
        };
      });
    };
  }

  const outdated =
    value.translations[languageCode] == null ||
    value.translations[languageCode].status == null
      ? true
      : !value.translations[languageCode].status.includes('outdated');

  return (
    <TranslationItemView
      label={label}
      value={getValue(translation, languageCode)}
      outdated={outdated}
      showOptions={showOptions}
      itemClassName={
        index === 0 ? cx(depthMarginStyle(depth), defaultMarginTop) : undefined
      }
      rowSpanClassName={rowSpanStyle(selectedLanguages.length)}
      disabledButtons={editedTranslation[languageCode] == null}
      onUndo={() => setValue(languageCode)(undefined)}
      onSave={() => {
        LanguagesAPI.updateTranslation(
          languageCode,
          value.id!,
          editedTranslation[languageCode]!,
        ).then(res => {
          setValue(languageCode)(undefined);
          store.dispatch(manageResponseHandler(res));
        });
      }}
      onValueChange={setValue(languageCode)}
      onOutdateOthers={() =>
        LanguagesAPI.outdateTranslations(
          languageCode,
          value.id!,
          getValue(translation, languageCode),
        ).then(res => {
          store.dispatch(manageResponseHandler(res));
        })
      }
      onOutdate={outdate => {
        LanguagesAPI.setTranslationStatus(
          languageCode,
          value.id!,
          getValue(translation, languageCode),
          !outdate,
        ).then(res => {
          store.dispatch(manageResponseHandler(res));
        });
      }}
    />
  );
}

interface ScriptViewProps extends TranslationViewItemProps {
  value: IScript;
}

async function AsyncScriptView({
  value,
  label,
  language,
  index,
  depth,
  selectedLanguages,
  showOptions,
}: ScriptViewProps) {
  const languageCode = language.code;
  // const parent = useStore(() => VariableDescriptor.select(value.parentId!))!;
  const parent = VariableDescriptor.select(value.parentId!)!;
  const schema = (await getEditionConfig(parent)) as {
    properties: { [key: string]: { view: { mode: ScriptMode } } };
  };
  const mode = schema.properties[label].view.mode;

  const test = testCode(value.content, mode);

  if (typeof test === 'string') {
    return null;
  }

  const schema2 = await generateSchema(test, [], mode);

  return (
    <div>
      <ul>
        {Object.entries(schema2.properties)
          .filter(
            ([k, v]) =>
              (!isNaN(Number(k)) || k === 'comparator') &&
              v.type === 'i18nstring',
          )
          .map(([k, v]) => (
            <li key={k}>
              {k} : {JSON.stringify(v)}
            </li>
          ))}
      </ul>
      {/* <div>{JSON.stringify(test)}</div>
      <ul>
        {Object.entries(schema.properties)
          .filter(([k]) => k === label)
          .map(([k, v]) => (
            <li key={k}>
              {k} : {JSON.stringify(v)}
            </li>
          ))}
      </ul> */}
    </div>
  );

  // const translation = unsafeTranslate(value, languageCode);

  // const [editedTranslation, setEditedTranslation] = React.useState<{
  //   [code: string]: string | undefined;
  // }>({});

  // const getValue = React.useCallback(
  //   (value: string | undefined, languageCode: string): string => {
  //     const editedValue = editedTranslation[languageCode];
  //     return editedValue == null ? (value == null ? '' : value) : editedValue;
  //   },
  //   [editedTranslation],
  // );

  // function setValue(languageCode: string) {
  //   return function (value: string | undefined) {
  //     setEditedTranslation(ot => {
  //       return {
  //         ...(ot || {}),
  //         [languageCode]: value === '' ? undefined : value,
  //       };
  //     });
  //   };
  // }

  // const outdated =
  //   value.translations[languageCode] == null ||
  //   value.translations[languageCode].status == null
  //     ? true
  //     : !value.translations[languageCode].status.includes('outdated');
  // return (
  //   <TranslationItemView
  //     label={label}
  //     value={getValue(translation, languageCode)}
  //     outdated={outdated}
  //     showOptions={showOptions}
  //     itemClassName={
  //       index === 0 ? cx(depthMarginStyle(depth), defaultMarginTop) : undefined
  //     }
  //     rowSpanClassName={rowSpanStyle(selectedLanguages.length)}
  //     disabledButtons={editedTranslation[languageCode] == null}
  //     onUndo={() => setValue(languageCode)(undefined)}
  //     onSave={() => {
  //       LanguagesAPI.updateTranslation(
  //         languageCode,
  //         value.id!,
  //         editedTranslation[languageCode]!,
  //       ).then(res => {
  //         setValue(languageCode)(undefined);
  //         store.dispatch(manageResponseHandler(res));
  //       });
  //     }}
  //     onValueChange={setValue(languageCode)}
  //     onOutdateOthers={() =>
  //       LanguagesAPI.outdateTranslations(
  //         languageCode,
  //         value.id!,
  //         getValue(translation, languageCode),
  //       ).then(res => {
  //         store.dispatch(manageResponseHandler(res));
  //       })
  //     }
  //     onOutdate={outdate => {
  //       LanguagesAPI.setTranslationStatus(
  //         languageCode,
  //         value.id!,
  //         getValue(translation, languageCode),
  //         !outdate,
  //       ).then(res => {
  //         store.dispatch(manageResponseHandler(res));
  //       });
  //     }}
  //   />
  // );
}

export const ScriptView = asyncSFC<ScriptViewProps>(AsyncScriptView);

interface TranslationViewProps {
  variableId: number;
  selectedLanguages: IGameModelLanguage[];
  showOptions: boolean;
  depth: number;
}

function TranslationView({
  variableId,
  selectedLanguages,
  showOptions,
  depth,
}: TranslationViewProps) {
  const variable = useStore(
    s => s.variableDescriptors[variableId],
    deepDifferent,
  );

  const translations: { [key: string]: ITranslatableContent | IScript } =
    React.useMemo(
      () =>
        Object.entries(variable || {})
          .filter(
            ([, v]) =>
              entityIs(v, 'TranslatableContent') || entityIs(v, 'Script'),
          )
          .reduce((o, [k, v]) => ({ ...o, [k]: v }), {}),
      [variable],
    );

  // const [editedTranslations, setEditedTranslations] = React.useState<{
  //   [key: string]: { [code: string]: string | undefined };
  // }>(
  //   Object.keys(translations).reduce(
  //     (o, k) => ({
  //       ...o,
  //       [k]: selectedLanguages.reduce(
  //         (o, l) => ({ ...o, [l.code]: undefined }),
  //         {},
  //       ),
  //     }),
  //     {},
  //   ),
  // );

  // const getValue = React.useCallback(
  //   (value: string | undefined, k: string, languageCode: string): string => {
  //     const editedValue = editedTranslations[k][languageCode];
  //     return editedValue == null ? (value == null ? '' : value) : editedValue;
  //   },
  //   [editedTranslations],
  // );

  // function setValue(k: string, languageCode: string) {
  //   return function (value: string | undefined) {
  //     setEditedTranslations(ot => {
  //       return {
  //         ...ot,
  //         [k]: {
  //           ...(ot[k] || {}),
  //           [languageCode]: value === '' ? undefined : value,
  //         },
  //       };
  //     });
  //   };
  // }

  return (
    <>
      {Object.entries(translations).map(([k, v]) => {
        return (
          <React.Fragment key={k}>
            {selectedLanguages.map((language, index) => {
              // const languageCode = language.code;
              // const translation = unsafeTranslate(v, languageCode);
              return entityIs(v, 'TranslatableContent') ? (
                <TranslatableContentView
                  key={language.id!}
                  label={k}
                  value={v}
                  language={language}
                  index={index}
                  depth={depth}
                  selectedLanguages={selectedLanguages}
                  showOptions={showOptions}
                />
              ) : (
                <ScriptView
                  key={language.id!}
                  label={k}
                  value={v}
                  language={language}
                  index={index}
                  depth={depth}
                  selectedLanguages={selectedLanguages}
                  showOptions={showOptions}
                />
              );

              /*(
                <TranslationItemView
                  key={language.id!}
                  label={k}
                  value={getValue(translation, k, languageCode)}
                  outdated={
                    v.translations[languageCode] == null ||
                    v.translations[languageCode].status == null
                      ? true
                      : !v.translations[languageCode].status.includes(
                          'outdated',
                        )
                  }
                  showOptions={showOptions}
                  itemClassName={
                    index === 0
                      ? cx(depthMarginStyle(depth), defaultMarginTop)
                      : undefined
                  }
                  rowSpanClassName={rowSpanStyle(selectedLanguages.length)}
                  disabledButtons={editedTranslations[k][languageCode] == null}
                  onUndo={() => setValue(k, languageCode)(undefined)}
                  onSave={() => {
                    LanguagesAPI.updateTranslation(
                      languageCode,
                      v.id!,
                      editedTranslations[k][languageCode]!,
                    ).then(res => {
                      setValue(k, languageCode)(undefined);
                      store.dispatch(manageResponseHandler(res));
                    });
                  }}
                  onValueChange={setValue(k, languageCode)}
                  onOutdateOthers={() =>
                    LanguagesAPI.outdateTranslations(
                      languageCode,
                      v.id!,
                      getValue(translation, k, languageCode),
                    ).then(res => {
                      store.dispatch(manageResponseHandler(res));
                    })
                  }
                  onOutdate={outdate => {
                    LanguagesAPI.setTranslationStatus(
                      languageCode,
                      v.id!,
                      getValue(translation, k, languageCode),
                      !outdate,
                    ).then(res => {
                      store.dispatch(manageResponseHandler(res));
                    });
                  }}
                />
              )*/
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
        depth={depth}
      />
      {show &&
        variableIsList(item) &&
        item.itemsIds.map(childrenId => (
          <LanguagesVisitor
            key={childrenId}
            itemId={childrenId}
            selectedLanguages={selectedLanguages}
            depth={depth + 1}
            showOptions={showOptions}
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
    <div className={cx(flex, flexRow, columnMargin, itemCenter)}>
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
        : [
            ...selectedLanguages.slice(
              0,
              languages.findIndex(l => l.id === language.id),
            ),
            language,
            ...selectedLanguages.slice(
              languages.findIndex(l => l.id === language.id),
            ),
          ],
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
              onSelect: (language: IGameModelLanguage) =>
                toggleLanguage(language),
            },
            {
              label: (
                <div
                  className={css({ padding: '5px', width: '100%' })}
                  onClick={() => setShowOptions(showOptions => !showOptions)}
                >
                  <IconComp
                    icon={showOptions ? 'eye-slash' : 'eye'}
                    className={defaultMarginRight}
                  />
                  {showOptions
                    ? i18nValues.hideOptions
                    : i18nValues.showOptions}
                </div>
              ),
            },
          ]}
        />
      </Toolbar.Header>
      <Toolbar.Content
        className={translationContainerStyle(selectedLanguages.length)}
      >
        {selectedLanguages.map(language => (
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
            showOptions={showOptions}
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
function variableIdsSelector(s: any): number[] {
  throw new Error('Function not implemented.');
}
