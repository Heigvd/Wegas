import generate from '@babel/generator';
import { parse } from '@babel/parser';
import { program } from '@babel/types';
import { css, cx } from '@emotion/css';
import u from 'immer';
import { isArray } from 'lodash-es';
import * as React from 'react';
import {
  IInScriptUpdate,
  ITranslationUpdate,
  LanguagesAPI,
} from '../../../API/languages.api';
import { DropMenu } from '../../../Components/DropMenu';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import {
  useEditableLanguages,
  useTranslatableLanguages,
} from '../../../Components/Hooks/useLanguages';
import HTMLEditor from '../../../Components/HTML/HTMLEditor';
import { CheckBox } from '../../../Components/Inputs/Boolean/CheckBox';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { useOkCancelModal } from '../../../Components/Modal';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  componentMarginRight,
  defaultMargin,
  defaultMarginLeft,
  defaultMarginTop,
  defaultPadding,
  defaultPaddingLeft,
  defaultPaddingRight,
  expandWidth,
  flex,
  flexBetween,
  flexColumn,
  flexRow,
  forceScrollY,
  itemCenter,
  justifyStart,
  layoutStyle,
  MediumPadding_notBottom,
  MediumPadding_sides,
  secondaryButtonStyle,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { entityIs } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { GlobalState } from '../../../data/Reducer/globalState';
import { GameModel, VariableDescriptor } from '../../../data/selectors';
import { store, useStore } from '../../../data/Stores/store';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { languagesTranslations } from '../../../i18n/languages/languages';
import getEditionConfig, { getIcon } from '../../editionConfig';
import { borderBottom } from '../FormView/commonView';
import {
  generateSchema,
  IAttributes,
  testCode,
} from '../FormView/Script/Expressions/expressionEditorHelpers';
import { unsafeTranslate } from '../FormView/translatable';
import { IconComp, withDefault } from '../Views/FontAwesome';

const langaugeVisitorHeaderStyle = css({
  borderBottom: `solid 1px ${themeVar.colors.PrimaryColor}`,
  marginTop: '0.5em',
  fontWeight: 700,
});

const selectedLangaugeVisitorHeaderStyle = css({
  backgroundColor: themeVar.colors.HoverColor,
  color: themeVar.colors.HoverTextColor,
});

const languageChoiceCbxStyle = css({
  textTransform: 'capitalize',
  margin: '.5rem 1rem',
  padding: '5px 10px',
  border: '1px solid ' + themeVar.colors.DisabledColor,
  borderRadius: themeVar.dimensions.BorderRadius,
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
  backgroundColor: themeVar.colors.SecondaryBackgroundColor,
});

function isLanguageEditable(
  languageCode: string,
  editableLanguages: GlobalState['languages']['editableLanguages'],
) {
  return (
    editableLanguages != null &&
    (editableLanguages === 'all' || editableLanguages.includes(languageCode))
  );
}

interface SharedItemViewProps {
  label: string;
  showOptions: boolean;
  view: 'string' | 'html';
}

interface TranslationItemViewProps extends SharedItemViewProps {
  value: string;
  upToDate: boolean;
  itemClassName?: string;
  rowSpanClassName: string;
  disabledButtons: boolean;
  disabled: boolean;
  onUndo: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  onOutdateOthers: () => void;
  onOutdate: (value: boolean) => void;
}

function TranslationItemView({
  label,
  value,
  upToDate,
  showOptions,
  itemClassName,
  disabledButtons,
  disabled,
  view,
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
      <div className={cx(flex, flexBetween)}>
        {label}
        <div className={flex}>
          <IconButton
            icon="globe"
            tooltip={i18nValues.translateWithDeepl}
            disabled={disabled}
            onClick={() => {}}
          />
          <Button
            icon="undo"
            tooltip={i18nValues.undoModifications}
            disabled={disabledButtons || disabled}
            onClick={onUndo}
          />
          <Button
            icon="save"
            tooltip={i18nValues.saveModifications}
            disabled={disabledButtons || disabled}
            onClick={onSave}
          />
        </div>
      </div>
      {view === 'html' ? (
        <HTMLEditor
          value={value}
          onChange={onValueChange}
          disabled={disabled}
        />
      ) : (
        <SimpleInput
          value={value}
          onChange={value => onValueChange(String(value))}
          disabled={disabled}
        />
      )}
      <div className={cx(flex, flexRow, flexBetween)}>
        {showOptions && (
          <>
            <ConfirmButton
              buttonClassName={cx(
                secondaryButtonStyle,
                css({ fontSize: '13px', marginTop: '4px' }),
              )}
              icon={'clock'}
              label={i18nValues.outdateOtherLanguages}
              tooltip={i18nValues.outdateOtherLanguages}
              onAction={success => {
                if (success) {
                  onOutdateOthers();
                }
              }}
              disabled={disabled}
            />
            <Toggler
              value={upToDate}
              onChange={onOutdate}
              hint={
                upToDate ? i18nValues.markAsOutdated : i18nValues.markAsUpToDate
              }
              label={upToDate ? i18nValues.upToDate : i18nValues.outdated}
              className={css({
                fontSize: '14px',
                color: themeVar.colors.DisabledColor,
              })}
              disabled={disabled}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface TranslationViewItemProps extends SharedItemViewProps {
  language: IGameModelLanguage;
  depth?: number;
  selectedLanguages: IGameModelLanguage[];
}

interface TranslatableScript {
  fieldName: string;
  index: number;
  parentClass: string;
  parentId: number;
}

interface PartialTranslationUpdate extends Omit<ITranslationUpdate, 'value'> {
  value: string | undefined;
}

interface PartialScriptUpdate extends Omit<IInScriptUpdate, 'value'> {
  value: string | undefined;
}

type UpdateTranslationsFN = (
  translationObject: PartialTranslationUpdate | PartialScriptUpdate,
) => void;

interface TranslatableContentViewProps extends TranslationViewItemProps {
  trContent: ITranslatableContent;
  script?: TranslatableScript;
}

function TranslatableContentView({
  trContent,
  label,
  language,
  depth,
  selectedLanguages,
  showOptions,
  view,
  script,
}: TranslatableContentViewProps) {
  const languageCode = language.code;
  const translation = unsafeTranslate(trContent, languageCode);
  const editableLanguages = useEditableLanguages();
  const { editedTranslations, updateTranslations } =
    React.useContext(translationCTX);

  let editedTranslation: ITranslationUpdate | IInScriptUpdate | undefined;
  if (script == null) {
    editedTranslation =
      editedTranslations[languageCode]?.TranslationUpdate[
        String(trContent.id!)
      ];
  } else {
    editedTranslation =
      editedTranslations[languageCode]?.InScriptUpdate[
        String(script.index) + String(script.parentId)
      ];
  }

  const getValue = React.useCallback(
    (value: string | undefined): string => {
      return editedTranslation?.value == null
        ? value == null
          ? ''
          : value
        : editedTranslation.value;
    },
    [editedTranslation],
  );

  function setValue(languageCode: string) {
    return function (value: string | undefined) {
      if (value !== getValue(translation)) {
        updateTranslations(
          script
            ? {
                '@class': 'InScriptUpdate',
                code: languageCode,
                value,
                ...script,
              }
            : {
                '@class': 'TranslationUpdate',
                code: languageCode,
                trId: trContent.id!,
                value,
              },
        );
      }
    };
  }

  const upToDate =
    trContent.translations[languageCode] == null ||
    trContent.translations[languageCode].status == null
      ? true
      : !trContent.translations[languageCode].status!.includes('outdate');

  const translationObject: ITranslationUpdate | IInScriptUpdate = script
    ? {
        '@class': 'InScriptUpdate',
        code: languageCode,
        value: getValue(translation),
        ...script,
      }
    : {
        '@class': 'TranslationUpdate',
        code: languageCode,
        trId: trContent.id!,
        value: getValue(translation),
      };

  return (
    <TranslationItemView
      label={label}
      value={getValue(translation)}
      upToDate={upToDate}
      showOptions={showOptions}
      itemClassName={
        depth != null
          ? cx(depthMarginStyle(depth), defaultMarginTop)
          : undefined
      }
      rowSpanClassName={rowSpanStyle(selectedLanguages.length)}
      disabled={!isLanguageEditable(languageCode, editableLanguages)}
      disabledButtons={editedTranslation == null}
      view={view}
      onUndo={() => setValue(languageCode)(undefined)}
      onSave={() => {
        LanguagesAPI.updateTranslation(translationObject).then(res => {
          setValue(languageCode)(undefined);
          store.dispatch(manageResponseHandler(res));
        });
      }}
      onValueChange={setValue(languageCode)}
      onOutdateOthers={() => {
        LanguagesAPI.outdateTranslations(translationObject).then(res => {
          setValue(languageCode)(undefined);
          store.dispatch(manageResponseHandler(res));
        });
      }}
      onOutdate={outdate => {
        LanguagesAPI.setTranslationStatus(translationObject, !outdate).then(
          res => {
            store.dispatch(manageResponseHandler(res));
          },
        );
      }}
    />
  );
}

type ExtractedAttributes = {
  [key: string]: ITranslatableContent;
} & IAttributes;

type TranslatableEntry = [
  string,
  { view?: { label?: string; type?: string } } | undefined,
];

interface TranslatableExpression {
  attributes: ExtractedAttributes;
  translatableEntries: TranslatableEntry[];
  offsetIndex: number;
}

interface ExpressionViewProps
  extends Pick<
    TranslationViewItemProps,
    'language' | 'selectedLanguages' | 'showOptions'
  > {
  expression: TranslatableExpression;
  fieldName: string;
  parentDescriptor: IVariableDescriptor;
  indexOffset: number;
}

function ExpressionView({
  expression,
  fieldName,
  parentDescriptor,
  language,
  selectedLanguages,
  showOptions,
}: ExpressionViewProps) {
  return (
    <div
      className={cx(
        flex,
        flexColumn,
        defaultMargin,
        defaultPadding,
        layoutStyle,
      )}
    >
      {expression.attributes.initExpression.script}
      <div>
        {expression.translatableEntries.map(([k, v], i) => {
          const translatable = expression.attributes[k];
          const viewLabel =
            v?.view?.label || expression.attributes.methodName || k;
          const view = v?.view?.type === 'i18nhtml' ? 'html' : 'string';
          const index = i + expression.offsetIndex;

          return (
            <TranslatableContentView
              key={String(parentDescriptor.id!) + fieldName + index + k}
              label={viewLabel}
              trContent={translatable}
              language={language}
              selectedLanguages={selectedLanguages}
              showOptions={showOptions}
              view={view}
              script={{
                fieldName,
                index,
                parentClass: parentDescriptor['@class'],
                parentId: parentDescriptor.id!,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ScriptViewProps extends Omit<TranslationViewItemProps, 'view'> {
  value: IScript;
}

async function AsyncScriptView({
  value,
  label,
  language,
  depth,
  selectedLanguages,
  showOptions,
}: ScriptViewProps) {
  const parentDescriptor = VariableDescriptor.select(value.parentId!)!;
  const parentSchema = (await getEditionConfig(parentDescriptor)) as {
    properties: { [key: string]: { view: { mode: ScriptMode } } };
  };
  const mode = parentSchema.properties[label].view.mode;

  const parsedExpressions = parse(value.content, { sourceType: 'script' })
    .program.body;

  const expressions: TranslatableExpression[] = [];
  let offsetIndex = 0;

  for (const expression of parsedExpressions) {
    const expressionCode = generate(program([expression])).code;
    const attributes = testCode(expressionCode, mode) as
      | ExtractedAttributes
      | string;

    if (typeof attributes !== 'string') {
      const schema = await generateSchema(attributes, [], mode);
      const translatableEntries = Object.entries(schema.properties).filter(
        ([k, v]) =>
          !isNaN(Number(k)) &&
          v &&
          (v.view?.type === 'i18nstring' || v.view?.type === 'i18nhtml'),
      ) as TranslatableEntry[];

      if (translatableEntries.length > 0) {
        expressions.push({
          attributes,
          translatableEntries,
          offsetIndex,
        });
      }

      offsetIndex += translatableEntries.length;
    }
  }

  return expressions.length > 0 ? (
    <div
      className={cx(
        flex,
        flexColumn,
        defaultMargin,
        inputStyle,
        defaultPadding,
        depth != null
          ? cx(depthMarginStyle(depth), defaultMarginTop)
          : undefined,
      )}
    >
      {label}
      {expressions.map(e => (
        <ExpressionView
          key={
            String(parentDescriptor.id!) +
            e.attributes.initExpression +
            e.offsetIndex
          }
          expression={e}
          fieldName={label}
          language={language}
          parentDescriptor={parentDescriptor}
          selectedLanguages={selectedLanguages}
          showOptions={showOptions}
          indexOffset={0}
        />
      ))}
    </div>
  ) : null;
}

const ScriptView = asyncSFC<ScriptViewProps>(AsyncScriptView);

interface SharedTranslationViewProps {
  selectedLanguages: IGameModelLanguage[];
  showOptions: boolean;
  depth: number;
}

interface AsyncTranslationViewProps extends SharedTranslationViewProps {
  variable: IMergeable;
  translations: { [key: string]: ITranslatableContent | IScript };
}
async function AsyncTranslationView({
  variable,
  translations,
  selectedLanguages,
  depth,
  showOptions,
}: AsyncTranslationViewProps) {
  const schema = (await getEditionConfig(variable)) as {
    properties: { [key: string]: { view: { type: string } } };
  };

  return (
    <>
      {Object.entries(translations).map(([k, v]) => {
        return (
          <React.Fragment key={k}>
            {selectedLanguages.map((language, index) => {
              return entityIs(v, 'TranslatableContent') ? (
                <TranslatableContentView
                  key={language.id!}
                  label={k}
                  trContent={v}
                  language={language}
                  depth={index === 0 ? depth : undefined}
                  selectedLanguages={selectedLanguages}
                  showOptions={showOptions}
                  view={
                    schema.properties[k].view.type === 'i18nhtml'
                      ? 'html'
                      : 'string'
                  }
                />
              ) : (
                <ScriptView
                  key={language.id!}
                  label={k}
                  value={v}
                  language={language}
                  depth={index === 0 ? depth : undefined}
                  selectedLanguages={selectedLanguages}
                  showOptions={showOptions}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}

const TranslationsView =
  asyncSFC<AsyncTranslationViewProps>(AsyncTranslationView);

interface TranslationViewProps extends SharedTranslationViewProps {
  variableId: number;
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

  return variable ? (
    <TranslationsView
      depth={depth}
      selectedLanguages={selectedLanguages}
      showOptions={showOptions}
      variable={variable}
      translations={translations}
    />
  ) : null;
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
  parentIds: number[];
  selectedLanguages: IGameModelLanguage[];
  depth?: number;
  showOptions: boolean;
}

function LanguagesVisitor({
  itemId,
  parentIds,
  selectedLanguages,
  depth = 0,
  showOptions,
}: LanguagesVisitorProps) {
  const translatableViewElement = React.useRef<HTMLDivElement>(null);
  const { item, editing } = useStore(s => {
    return {
      item: VariableDescriptor.select(itemId),
      editing:
        s.global.editing !== undefined &&
        (s.global.editing.type === 'Variable' ||
          s.global.editing.type === 'VariableFSM') &&
        s.global.editing.entity &&
        itemId === s.global.editing.entity.id,
    };
  }, deepDifferent);

  React.useEffect(() => {
    if (editing) {
      translatableViewElement.current?.scrollIntoView();
    }
  }, [editing]);

  const [show, setShow] = React.useState(false);
  const open = show || (itemId && parentIds.includes(itemId));

  if (item == null) {
    return null;
  }

  return (
    <>
      <div
        ref={translatableViewElement}
        className={cx(
          flex,
          flexRow,
          itemCenter,
          langaugeVisitorHeaderStyle,
          rowSpanStyle(selectedLanguages.length),
          depthMarginStyle(depth),
          { [selectedLangaugeVisitorHeaderStyle]: editing },
        )}
      >
        <IconComp
          icon={withDefault(getIcon(item), 'question')}
          className={css({ marginRight: '5px' })}
        />
        {editorLabel(item)}
        {variableIsList(item) && (
          <IconButton
            icon={open ? 'caret-down' : 'caret-right'}
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
      {open &&
        variableIsList(item) &&
        item.itemsIds.map(childrenId => (
          <LanguagesVisitor
            key={childrenId}
            itemId={childrenId}
            parentIds={parentIds}
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
  type: 'COPY' | 'TRANSLATE';
  language: IGameModelLanguage;
  sourceLanguage: IGameModelLanguage;
}

interface DefaultItem extends DropMenuItem<unknown> {
  type:
    | 'SAVE_TRANSLATIONS'
    | 'CLEAR_TRANSLATIONS'
    | 'CLEAR_OUTDATED'
    | 'CLEAR_ALL'
    | 'COPY_TRANSLATIONS'
    | 'AUTO_TRANSLATE';
  label: string;
}

interface CopyItem extends DropMenuItem<unknown> {
  type: 'COPY' | 'TRANSLATE';
  label: string;
  language: IGameModelLanguage;
}

type TranslationHeaderMenuItem = CopyItem | DefaultItem;

type LanguageAction = LanguageClearAction | LanguageCopyAction;

interface TranslationHeaderProps {
  language: IGameModelLanguage;
  languages: IGameModelLanguage[];
  translatableLanguages: string[];
  onSelect: (action: LanguageAction) => void;
}

function TranslationHeader({
  language,
  languages,
  translatableLanguages,
  onSelect,
}: TranslationHeaderProps) {
  const { editedTranslations, resetLanguage } =
    React.useContext(translationCTX);
  const i18nValues = useInternalTranslate(languagesTranslations);
  const i18nValues_basics = useInternalTranslate(commonTranslations);
  const editableLanguages = useEditableLanguages();

  const languageEditedTranslation = editedTranslations[language.code];
  const editedValues = [
    ...Object.values(languageEditedTranslation?.TranslationUpdate || []),
    ...Object.values(languageEditedTranslation?.InScriptUpdate || []),
  ];

  const availableLanguagesForTranslation = languages.filter(
    lang =>
      translatableLanguages.includes(language.code) &&
      lang.code !== language.code &&
      translatableLanguages.includes(lang.code.toUpperCase()),
  );

  const enabled = isLanguageEditable(language.code, editableLanguages);

  return (
    <div className={cx(flex, flexRow, itemCenter)}>
      <h3 className={css({ margin: '.5rem 0' })}>{languageLabel(language)}</h3>
      {enabled && (
        <>
          <DropMenu
            icon="ellipsis-h"
            items={
              [
                {
                  label: i18nValues.clearTranslations,
                  type: 'CLEAR_TRANSLATIONS',
                  items: [
                    {
                      label: i18nValues.outdatedTranslations,
                      type: 'CLEAR_OUTDATED',
                    },
                    {
                      label: i18nValues.allTranslations,
                      type: 'CLEAR_ALL',
                    },
                  ],
                },
                {
                  label: i18nValues.translateFrom,
                  type: 'AUTO_TRANSLATE',
                  disabled: availableLanguagesForTranslation.length === 0,
                  items: availableLanguagesForTranslation.map(lang => ({
                    label: lang.lang,
                    type: 'TRANSLATE',
                    language: lang,
                  })),
                },
                {
                  label: i18nValues.copyFrom,
                  type: 'COPY_TRANSLATIONS',
                  items: languages
                    .filter(lang => lang.id !== language.id)
                    .map(lang => ({
                      label: languageLabel(lang),
                      language: lang,
                      type: 'COPY',
                    })),
                },
              ] as TranslationHeaderMenuItem[]
            }
            onSelect={item => {
              if (item.type === 'COPY') {
                onSelect({
                  type: 'COPY',
                  language: language,
                  sourceLanguage: item.language,
                });
              } else if (item.type === 'TRANSLATE') {
                LanguagesAPI.initLanguage(
                  item.language.code,
                  language.code,
                ).then(res => {
                  resetLanguage(language.code);
                  store.dispatch(manageResponseHandler(res));
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
          <IconButton
            icon="save"
            tooltip={i18nValues_basics.save}
            disabled={editedValues.length === 0}
            onClick={() => {
              LanguagesAPI.batchUpdateTranslations(editedValues).then(res => {
                resetLanguage(language.code);
                store.dispatch(manageResponseHandler(res));
              });
            }}
            className={cx(itemCenter, css({ padding: 0 }))}
          />
        </>
      )}
    </div>
  );
}

interface EditedTranslations {
  [languageCode: string]: {
    TranslationUpdate: { [key: string]: ITranslationUpdate };
    InScriptUpdate: { [key: string]: IInScriptUpdate };
  };
}

export const translationCTX = React.createContext<{
  editedTranslations: EditedTranslations;
  updateTranslations: UpdateTranslationsFN;
  resetLanguage: (language: string) => void;
}>({
  editedTranslations: {},
  updateTranslations: () => {},
  resetLanguage: () => {},
});

export function TranslationEditor() {
  const [editedTranslations, setEditedTranslations] =
    React.useState<EditedTranslations>({});
  const [languageAction, setLanguageAction] = React.useState<LanguageAction>();
  const [showOptions, setShowOptions] = React.useState(false);
  const { root, parentIds } = useStore(s => {
    const parentIds: number[] = [];

    if (
      s.global.editing !== undefined &&
      (s.global.editing.type === 'Variable' ||
        s.global.editing.type === 'VariableFSM') &&
      s.global.editing.entity
    ) {
      let parentId = s.global.editing.entity.parentId;
      while (parentId != null) {
        parentIds.push(parentId);
        parentId = s.variableDescriptors[parentId]?.parentId;
      }
    }

    return {
      parentIds,
      root: GameModel.selectCurrent(),
    };
  }, deepDifferent);
  const languages = root.languages;
  const i18nValues = useInternalTranslate(languagesTranslations);
  const [selectedLanguages, setSelectedLanguages] = React.useState(
    languages.filter(language => language.active),
  );
  const { showModal, OkCancelModal } = useOkCancelModal();
  const translatableLanguages = useTranslatableLanguages();

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
    <translationCTX.Provider
      value={{
        editedTranslations,
        updateTranslations: translationObject => {
          setEditedTranslations(oet =>
            u(oet, oet => {
              if (translationObject.value == null) {
                if (translationObject['@class'] === 'TranslationUpdate') {
                  delete oet[translationObject.code].TranslationUpdate[
                    String(translationObject.trId)
                  ];
                } else {
                  delete oet[translationObject.code].InScriptUpdate[
                    String(translationObject.index) +
                      String(translationObject.index)
                  ];
                }
              } else {
                if (oet[translationObject.code] == null) {
                  oet[translationObject.code] = {
                    TranslationUpdate: {},
                    InScriptUpdate: {},
                  };
                }
                if (translationObject['@class'] === 'TranslationUpdate') {
                  oet[translationObject.code].TranslationUpdate[
                    String(translationObject.trId)
                  ] = translationObject as ITranslationUpdate;
                } else {
                  oet[translationObject.code].InScriptUpdate[
                    String(translationObject.index) +
                      String(translationObject.parentId)
                  ] = translationObject as IInScriptUpdate;
                }
              }
              return oet;
            }),
          );
        },
        resetLanguage: code => {
          setEditedTranslations(oet =>
            u(oet, oet => {
              oet[code] = { TranslationUpdate: {}, InScriptUpdate: {} };
              return oet;
            }),
          );
        },
      }}
    >
      <Toolbar className={expandWidth}>
        <Toolbar.Header className={cx(justifyStart, flexColumn)}>
          <div
            className={cx(
              flex,
              expandWidth,
              itemCenter,
              MediumPadding_notBottom,
            )}
          >
            <h2 className={css({ margin: 0 })}>
              {i18nValues.translationManagement}
            </h2>
            <Button
              onClick={() => setShowOptions(showOptions => !showOptions)}
              className={cx(
                css({ fontSize: '13px' }),
                secondaryButtonStyle,
                defaultMarginLeft,
              )}
            >
              <IconComp
                icon={showOptions ? 'eye-slash' : 'eye'}
                className={componentMarginRight}
              />
              {showOptions ? i18nValues.hideOptions : i18nValues.showOptions}
            </Button>
          </div>
          <div
            className={cx(
              flex,
              expandWidth,
              borderBottom,
              defaultPaddingLeft,
              defaultPaddingRight,
              defaultMarginTop,
            )}
          >
            {languages.map(language => (
              <>
                <CheckBox
                  value={selectedLanguages.includes(language)}
                  onChange={() => {
                    toggleLanguage(language);
                  }}
                  label={languageLabel(language)}
                  className={languageChoiceCbxStyle}
                  checkBoxClassName={cx(
                    css({ padding: 0 }),
                    componentMarginRight,
                  )}
                  key={language.code}
                  horizontal
                />
                {false &&
                <IconButton
                  icon="arrows-alt-h"
                  onClick={()=>{}}/>}
              </>
            ))}
          </div>
        </Toolbar.Header>
        <Toolbar.Content className={cx(flex, flexColumn)}>
          <div
            className={cx(
              translationContainerStyle(selectedLanguages.length),
              MediumPadding_sides,
              borderBottom,
            )}
          >
            {selectedLanguages.map(language => (
              <TranslationHeader
                key={language.id!}
                language={language}
                languages={languages}
                translatableLanguages={
                  Array.isArray(translatableLanguages)
                    ? translatableLanguages
                    : []
                }
                onSelect={action => {
                  showModal();
                  setLanguageAction(action);
                }}
              />
            ))}
          </div>
          <div
            className={cx(
              translationContainerStyle(selectedLanguages.length),
              forceScrollY,
              MediumPadding_sides,
            )}
          >
            {root.itemsIds.map(itemId => (
              <LanguagesVisitor
                key={itemId}
                itemId={itemId}
                parentIds={parentIds}
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
          </div>
        </Toolbar.Content>
      </Toolbar>
    </translationCTX.Provider>
  );
}
