import { cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { LanguagesAPI } from '../../../API/languages.api';
import { DropMenu } from '../../../Components/DropMenu';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { CheckBox } from '../../../Components/Inputs/Boolean/CheckBox';
import { useOkCancelModal } from '../../../Components/Modal';
import { Toolbar } from '../../../Components/Toolbar';
import {
  expandBoth,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { getDispatch } from '../../../data/Stores/store';

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

export function TranslationEditor() {
  const languages = useGameModel().languages;

  const [selectedLanguages, setSelectedLanguages] = React.useState(
    languages.filter(language => language.active),
  );

  const [languageAction, setLanguageAction] = React.useState<LanguageAction>();

  const { showModal, OkCancelModal } = useOkCancelModal();

  const languagesContent = React.useMemo(() => {
    const content: JSX.Element[] = [];
    selectedLanguages.forEach((language, i, a) => {
      content.push(
        <ReflexElement>
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
                    showModal();
                    setLanguageAction({
                      type: 'COPY',
                      language,
                      sourceLanguage: item.language,
                    });
                  } else if (
                    item.type === 'CLEAR_OUTDATED' ||
                    item.type === 'CLEAR_ALL'
                  ) {
                    showModal();
                    setLanguageAction({
                      type: item.type as LanguageClearAction['type'],
                      language,
                    });
                  }
                }}
              />
            </div>
          </div>
        </ReflexElement>,
      );
      if (i < a.length - 1) {
        content.push(<ReflexSplitter />);
      }
    });
    return content;
  }, [languages, selectedLanguages, showModal]);

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
                  getDispatch()(manageResponseHandler(res));
                });
              } else {
                LanguagesAPI.clearTranslations(
                  languageAction.language,
                  languageAction.type === 'CLEAR_OUTDATED',
                ).then(res => {
                  getDispatch()(manageResponseHandler(res));
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
