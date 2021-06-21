import { css, cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { LanguagesAPI } from '../../../API/languages.api';
import { DropMenu } from '../../../Components/DropMenu';
import { CheckBox } from '../../../Components/Inputs/Boolean/CheckBox';
import { useOkCancelModal } from '../../../Components/Modal';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  autoScroll,
  expandBoth,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
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
import { IGameModel } from '../../../../../../../../../wegas-ts-api/target/wegas-ts-api/dist';
import { ConfirmButton } from '../../../Components/Inputs/Buttons/ConfirmButton';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';

const listStyle = css({
  padding: '4px',
});

const langaugeVisitorHeaderStyle = css({
  borderBottom: `solid 1px ${themeVar.colors.HeaderColor}`,
});

interface TranslationViewProps {
  variableId: number;
  languageCode: string;
}

function TranslationView({ variableId, languageCode }: TranslationViewProps) {
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
    [key: string]: string | undefined;
  }>(
    Object.keys(translations).reduce((o, k) => ({ ...o, [k]: undefined }), {}),
  );

  return (
    <div>
      {Object.entries(translations).map(([k, v]) => {
        const value = unsafeTranslate(v, languageCode);
        return (
          <div key={k}>
            {k}
            {k === 'text' ? (
              <LightWeightHTMLEditor
                value={
                  editedTranslations[k] == null
                    ? value == null
                      ? ''
                      : value
                    : editedTranslations[k]
                }
                onChange={value =>
                  setEditedTranslations(ot => ({
                    ...ot,
                    [k]: value === '' ? undefined : value,
                  }))
                }
              />
            ) : (
              <SimpleInput
                value={
                  editedTranslations[k] == null
                    ? value == null
                      ? ''
                      : value
                    : editedTranslations[k]
                }
                onChange={value =>
                  setEditedTranslations(ot => ({
                    ...ot,
                    [k]: String(value) === '' ? undefined : String(value),
                  }))
                }
              />
            )}
            <div className={cx(flex, flexRow)}>
              <ConfirmButton
                className={grow}
                icon="outdent"
                tooltip="Outdate other languages"
              />
              <Toggler
                value={
                  v.translations[languageCode] == null ||
                  v.translations[languageCode].status == null
                    ? true
                    : !v.translations[languageCode].status.includes('outdated')
                }
                onChange={value => {
                  LanguagesAPI.setTranslationStatus(
                    languageCode,
                    v.id!,
                    editedTranslations[k]!,
                    !value,
                  ).then(res => {
                    store.dispatch(manageResponseHandler(res));
                  });
                }}
                hint="Mark as outdated"
              />
              <Button
                icon="undo"
                tooltip="Undo modifications"
                disabled={editedTranslations[k] == null}
                onClick={() =>
                  setEditedTranslations(ot => ({ ...ot, [k]: undefined }))
                }
              />
              <Button
                icon="save"
                tooltip="Save modifications"
                disabled={editedTranslations[k] == null}
                onClick={() => {
                  LanguagesAPI.updateTranslation(
                    languageCode,
                    v.id!,
                    editedTranslations[k]!,
                  ).then(res => {
                    setEditedTranslations(ot => ({ ...ot, [k]: undefined }));
                    store.dispatch(manageResponseHandler(res));
                  });
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LanguagesVisitorProps {
  itemId: number | undefined;
  languageCode: string;
}

function LanguagesVisitor({ itemId, languageCode }: LanguagesVisitorProps) {
  const item = useStore(() => VariableDescriptor.select(itemId), deepDifferent);

  if (item == null) {
    return null;
  }

  return (
    <div className={cx(flex, flexColumn)}>
      <div
        className={cx(flex, flexRow, expandWidth, langaugeVisitorHeaderStyle)}
      >
        <IconComp icon={withDefault(getIcon(item), 'question')} />
        {editorLabel(item)}
      </div>
      <TranslationView variableId={item.id!} languageCode={languageCode} />
      {entityIs(item, 'ListDescriptor') && (
        <div className={cx(flex, flexColumn, listStyle)}>
          {item.itemsIds.map(childrenId => (
            <LanguagesVisitor
              key={childrenId}
              itemId={childrenId}
              languageCode={languageCode}
            />
          ))}
        </div>
      )}
    </div>
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

interface TranslationsListProps {
  language: IGameModelLanguage;
  languages: IGameModelLanguage[];
  onSelect: (action: LanguageAction) => void;
  scroll: number;
  onScroll: (scroll: number) => void;
  root: Readonly<IGameModel>;
}

function TranslationsList({
  language,
  languages,
  onSelect,
  scroll,
  onScroll,
  root,
}: TranslationsListProps) {
  const scrollTimer = React.useRef<NodeJS.Timeout>();

  return (
    <div className={cx(expandBoth, flex, flexColumn)}>
      <div className={cx(expandWidth, flex, flexRow)}>
        <h3 className={grow}>{languageLabel(language)}</h3>
        <DropMenu
          icon="cog"
          items={[
            {
              label: 'Clear translations',
              type: 'CLEAR_TRANSLATIONS',
              language,
              items: [
                {
                  label: 'Outdated translations',
                  language,
                  type: 'CLEAR_OUTDATED',
                },
                {
                  label: 'All translations',
                  language,
                  type: 'CLEAR_ALL',
                },
              ],
            },
            {
              label: 'Copy translations',
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
        />
      </div>
      <div
        className={cx(flex, flexColumn, grow, autoScroll)}
        ref={element => {
          if (element != null && scroll != null) {
            element.scrollTop = scroll;
          }
        }}
        onScroll={e => {
          const target = e.target as HTMLDivElement;
          if (scrollTimer.current != null) {
            clearTimeout(scrollTimer.current);
          }
          scrollTimer.current = setTimeout(() => {
            onScroll(target.scrollTop);
          }, 50);
        }}
      >
        {root.itemsIds.map(itemId => (
          <LanguagesVisitor
            key={itemId}
            itemId={itemId}
            languageCode={language.code}
          />
        ))}
      </div>
    </div>
  );
}

export function TranslationEditor() {
  const [languageAction, setLanguageAction] = React.useState<LanguageAction>();
  const { languages, root } = useStore(() => {
    return {
      languages: GameModel.selectCurrent().languages,
      root: GameModel.selectCurrent(),
    };
  });

  // const languages = GameModel.selectCurrent().languages;
  // const root = GameModel.selectCurrent();

  const [scroll, setScroll] = React.useState(0);
  const [selectedLanguages, setSelectedLanguages] = React.useState(
    languages.filter(language => language.active),
  );
  const { showModal, OkCancelModal } = useOkCancelModal();

  // Awfull workaround, must be done in an other way
  const languagesContent = React.useMemo(() => {
    const content: JSX.Element[] = [];
    selectedLanguages.forEach((language, i, a) => {
      content.push(
        <ReflexElement>
          <TranslationsList
            language={language}
            languages={languages}
            root={root}
            onSelect={action => {
              showModal();
              setLanguageAction(action);
            }}
            scroll={scroll}
            onScroll={setScroll}
          />
        </ReflexElement>,
      );
      if (i < a.length - 1) {
        content.push(<ReflexSplitter />);
      }
    });
    return content;
  }, [languages, root, scroll, selectedLanguages, showModal]);

  function toggleLanguage(language: IGameModelLanguage) {
    setSelectedLanguages(selectedLanguages =>
      selectedLanguages.find(lang => lang.id === language.id)
        ? selectedLanguages.filter(lang => lang.id !== language.id)
        : [...selectedLanguages, language],
    );
  }

  return (
    <Toolbar>
      <Toolbar.Header>
        <h2 className={grow}>Translation management</h2>
        <DropMenu
          icon="cog"
          items={languages.map(language => ({
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
          }))}
          onSelect={({ language }) => toggleLanguage(language)}
        />
      </Toolbar.Header>
      <Toolbar.Content>
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
              ? `Are you sure that you want to copy translations from ${languageLabel(
                  languageAction.sourceLanguage,
                )} to ${languageLabel(
                  languageAction.language,
                )}. Translations will be overriden!`
              : `Are you sure that you want to delete all ${
                  languageAction.type === 'CLEAR_OUTDATED' ? 'outdated' : ''
                } translations of ${languageLabel(languageAction.language)}`}
          </OkCancelModal>
        )}
        <ReflexContainer orientation="vertical">
          {languagesContent}
        </ReflexContainer>
      </Toolbar.Content>
    </Toolbar>
  );
}
