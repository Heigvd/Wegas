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
  expandBoth,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
} from '../../../css/classes';
import { manageResponseHandler } from '../../../data/actions';
import { entityIs, scriptableEntityIs } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { instantiate } from '../../../data/scriptable';
import { GameModel, VariableDescriptor } from '../../../data/selectors';
import { getDispatch, useStore } from '../../../data/Stores/store';
import getEditionConfig, { getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';
import { Schema } from 'jsoninput';
import { wlog } from '../../../Helper/wegaslog';

const listStyle = css({
  padding: '4px',
});

const langaugeVisitorHeaderStyle = css({
  borderBottom: `solid 1px ${themeVar.colors.HeaderColor}`,
});

// const schemas = {
//   label: {
//     description: 'com.wegas.core.i18n.persistence.TranslatableContent',
//     properties: {
//       '@class': {
//         const: 'TranslatableContent',
//         required: false,
//         type: 'string',
//         view: {
//           index: 0,
//           type: 'hidden',
//         },
//       },
//       id: {
//         featureLevel: 'ADVANCED',
//         index: -1000,
//         required: false,
//         type: 'number',
//         view: {
//           featureLevel: 'ADVANCED',
//           index: -1000,
//           label: 'id',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       parentId: {
//         featureLevel: 'INTERNAL',
//         index: -980,
//         required: false,
//         type: 'number',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -980,
//           label: 'Parent ID',
//           layout: 'shortInline',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       parentType: {
//         featureLevel: 'INTERNAL',
//         index: -990,
//         required: false,
//         type: 'string',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -990,
//           label: 'Parent Type',
//           layout: 'shortInline',
//           readOnly: true,
//           type: 'string',
//         },
//       },
//       refId: {
//         featureLevel: 'INTERNAL',
//         index: -800,
//         required: false,
//         type: 'string',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -800,
//           label: 'RefID',
//           readOnly: true,
//           type: 'string',
//         },
//       },
//       version: {
//         featureLevel: 'ADVANCED',
//         required: true,
//         type: 'number',
//         value: 0,
//         view: {
//           featureLevel: 'ADVANCED',
//           index: 0,
//           label: 'Version',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       translations: {
//         additionalProperties: {
//           description: 'com.wegas.core.i18n.persistence.Translation',
//           properties: {
//             '@class': {
//               const: 'Translation',
//               required: false,
//               type: 'string',
//               view: {
//                 index: 0,
//                 type: 'hidden',
//               },
//             },
//             lang: {
//               required: true,
//               type: 'string',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Language',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             parentId: {
//               featureLevel: 'INTERNAL',
//               index: -980,
//               required: false,
//               type: 'number',
//               view: {
//                 featureLevel: 'INTERNAL',
//                 index: -980,
//                 label: 'Parent ID',
//                 layout: 'shortInline',
//                 readOnly: true,
//                 type: 'number',
//               },
//             },
//             parentType: {
//               featureLevel: 'INTERNAL',
//               index: -990,
//               required: false,
//               type: 'string',
//               view: {
//                 featureLevel: 'INTERNAL',
//                 index: -990,
//                 label: 'Parent Type',
//                 layout: 'shortInline',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             refId: {
//               index: -800,
//               required: false,
//               type: 'string',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: -800,
//                 label: 'RefID',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             status: {
//               required: true,
//               type: 'string',
//               value: '',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Status',
//               },
//             },
//             translation: {
//               required: true,
//               type: 'string',
//               value: '',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Text',
//               },
//             },
//           },
//           required: false,
//           type: 'object',
//         },
//         required: true,
//         type: 'object',
//         value: [],
//         view: {
//           featureLevel: 'DEFAULT',
//           index: 0,
//           label: 'Translations',
//           type: 'hashlist',
//         },
//       },
//     },
//     required: true,
//     type: 'object',
//     index: -470,
//     value: {
//       '@class': 'TranslatableContent',
//       translations: {},
//       version: 0,
//     },
//     view: {
//       description: 'Displayed to players',
//       featureLevel: 'DEFAULT',
//       index: -470,
//       label: 'Label',
//       type: 'i18nstring',
//     },
//   },
//   description: {
//     description: 'com.wegas.core.i18n.persistence.TranslatableContent',
//     properties: {
//       '@class': {
//         const: 'TranslatableContent',
//         required: false,
//         type: 'string',
//         view: {
//           index: 0,
//           type: 'hidden',
//         },
//       },
//       id: {
//         featureLevel: 'ADVANCED',
//         index: -1000,
//         required: false,
//         type: 'number',
//         view: {
//           featureLevel: 'ADVANCED',
//           index: -1000,
//           label: 'id',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       parentId: {
//         featureLevel: 'INTERNAL',
//         index: -980,
//         required: false,
//         type: 'number',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -980,
//           label: 'Parent ID',
//           layout: 'shortInline',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       parentType: {
//         featureLevel: 'INTERNAL',
//         index: -990,
//         required: false,
//         type: 'string',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -990,
//           label: 'Parent Type',
//           layout: 'shortInline',
//           readOnly: true,
//           type: 'string',
//         },
//       },
//       refId: {
//         featureLevel: 'INTERNAL',
//         index: -800,
//         required: false,
//         type: 'string',
//         view: {
//           featureLevel: 'INTERNAL',
//           index: -800,
//           label: 'RefID',
//           readOnly: true,
//           type: 'string',
//         },
//       },
//       version: {
//         featureLevel: 'ADVANCED',
//         required: true,
//         type: 'number',
//         value: 0,
//         view: {
//           featureLevel: 'ADVANCED',
//           index: 0,
//           label: 'Version',
//           readOnly: true,
//           type: 'number',
//         },
//       },
//       translations: {
//         additionalProperties: {
//           description: 'com.wegas.core.i18n.persistence.Translation',
//           properties: {
//             '@class': {
//               const: 'Translation',
//               required: false,
//               type: 'string',
//               view: {
//                 index: 0,
//                 type: 'hidden',
//               },
//             },
//             lang: {
//               required: true,
//               type: 'string',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Language',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             parentId: {
//               featureLevel: 'INTERNAL',
//               index: -980,
//               required: false,
//               type: 'number',
//               view: {
//                 featureLevel: 'INTERNAL',
//                 index: -980,
//                 label: 'Parent ID',
//                 layout: 'shortInline',
//                 readOnly: true,
//                 type: 'number',
//               },
//             },
//             parentType: {
//               featureLevel: 'INTERNAL',
//               index: -990,
//               required: false,
//               type: 'string',
//               view: {
//                 featureLevel: 'INTERNAL',
//                 index: -990,
//                 label: 'Parent Type',
//                 layout: 'shortInline',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             refId: {
//               index: -800,
//               required: false,
//               type: 'string',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: -800,
//                 label: 'RefID',
//                 readOnly: true,
//                 type: 'string',
//               },
//             },
//             status: {
//               required: true,
//               type: 'string',
//               value: '',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Status',
//               },
//             },
//             translation: {
//               required: true,
//               type: 'string',
//               value: '',
//               view: {
//                 featureLevel: 'DEFAULT',
//                 index: 0,
//                 label: 'Text',
//               },
//             },
//           },
//           required: false,
//           type: 'object',
//         },
//         required: true,
//         type: 'object',
//         value: [],
//         view: {
//           featureLevel: 'DEFAULT',
//           index: 0,
//           label: 'Translations',
//           type: 'hashlist',
//         },
//       },
//     },
//     required: true,
//     type: 'object',
//     index: 1,
//     value: {
//       '@class': 'TranslatableContent',
//       translations: {},
//       version: 0,
//     },
//     view: {
//       featureLevel: 'DEFAULT',
//       index: 1,
//       label: 'Description',
//       type: 'i18nhtml',
//     },
//   },
// };

// interface TranslationViewProps {
//   variable: IVariableDescriptor;
// }

// function TranslationView({ variable }: TranslationViewProps) {
//   const translations = Object.entries(variable)
//     .filter(([, v]) => entityIs(v, 'TranslatableContent'))
//     .reduce((o, [k, v]) => ({ ...o, [k]: v }), {});
//   const schema = Object.keys(translations).reduce(
//     (o, key) => ({ ...o, [key]: schemas[key as keyof typeof schemas] }),
//     {},
//   );

//   return (
//     <div>
//       <JSONForm
//         value={translations}
//         schema={{
//           description: 'custom.translation.schema',
//           properties: schema,
//         }}
//         onChange={val => {
//           // setVal(val);
//           // onChange && onChange(val);
//         }}
//       />
//     </div>
//   );
// }

interface LanguagesVisitorProps {
  itemId: number | undefined;
}

function LanguagesVisitor({ itemId }: LanguagesVisitorProps) {
  const [schema, setSchema] = React.useState<Schema>();
  const item = useStore(() => instantiate(VariableDescriptor.select(itemId)));

  if (item == null) {
    return null;
  }

  getEditionConfig(item.getEntity()).then(setSchema);

  wlog(schema);

  return (
    <div className={cx(flex, flexColumn)}>
      <div
        className={cx(flex, flexRow, expandWidth, langaugeVisitorHeaderStyle)}
      >
        <IconComp icon={withDefault(getIcon(item.getEntity()), 'question')} />
        {editorLabel(item.getEntity())}
      </div>
      <div>
        {Object.entries(item.getEntity())
          .filter(([, v]) => entityIs(v, 'TranslatableContent'))
          .map(([k, v]) => (
            <div key={v.id}>{k}</div>
          ))}
      </div>
      {/* <TranslationView variable={item.getEntity()} /> */}
      {scriptableEntityIs(item, 'ListDescriptor') && (
        <div className={cx(flex, flexColumn, listStyle)}>
          {item.getItemsIds().map(childrenId => (
            <LanguagesVisitor key={childrenId} itemId={childrenId} />
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

export function TranslationEditor() {
  // const languages = useGameModel().languages;

  const { languages, root } = useStore(() => {
    return {
      languages: GameModel.selectCurrent().languages,
      root: GameModel.selectCurrent(),
    };
  });

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
            {root.itemsIds.map(itemId => (
              <LanguagesVisitor key={itemId} itemId={itemId} />
            ))}
          </div>
        </ReflexElement>,
      );
      if (i < a.length - 1) {
        content.push(<ReflexSplitter />);
      }
    });
    return content;
  }, [languages, root.itemsIds, selectedLanguages, showModal]);

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
