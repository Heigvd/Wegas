import * as React from 'react';
import { Toolbar } from './Toolbar';
import {
  ThemeColorModifiers,
  Theme,
  themeCTX,
  ThemeColors,
  ThemeEntries,
  themeVar,
  SelectedTheme,
  ThemeProvider,
} from './Theme';
import { cx, css } from 'emotion';
import {
  flex,
  grow,
  flexColumn,
  defaultPadding,
  flexRow,
  expandWidth,
  expandBoth,
  expandHeight,
  justifyCenter,
  autoScroll,
} from '../css/classes';
import { ColorChangeHandler, ChromePicker } from 'react-color';
import * as Color from 'color';
import { useOnClickOutside } from './Hooks/useOnClickOutside';
import { IconButton } from './Inputs/Buttons/IconButton';
import { Menu } from './Menu';
import { TextPrompt } from '../Editor/Components/TextPrompt';
import { ConfirmButton } from './Inputs/Buttons/ConfirmButton';
import { NumberSlider } from './Inputs/Number/NumberSlider';
import { MessageString } from '../Editor/Components/MessageString';
import {
  FonkyFlexContainer,
  FonkyFlexContent,
  FonkyFlexSplitter,
} from './Layouts/FonkyFlex';
import { JSONPageDeserializer } from './PageComponents/tools/JSONPageDeserializer';

const colorButton = (color: string, bgColor?: string) =>
  css({
    backgroundColor: color,
    width: '200px',
    height: '50px',
    borderStyle: 'solid',
    borderColor:
      Color(bgColor).lightness() === 0
        ? '#4C4C4C'
        : (Color(bgColor).isLight()
            ? Color(bgColor).darken(0.5)
            : Color(bgColor).lighten(0.5)
          ).toString(),
    borderWidth: '5px',
    borderRadius: themeVar.borderRadius,
    cursor: 'pointer',
  });

const page1JSON = {
  type: 'FlexList',
  props: {
    children: [
      {
        type: 'FlexList',
        props: {
          name: 'Entete',
          children: [
            {
              type: 'Text',
              props: {
                script: {
                  '@class': 'Script',
                  content: "Variable.find(gameModel,'infoboxPhaseActuelle')",
                  language: 'JavaScript',
                },
                className: 'infoboxPhaseActuelle',
                options: {},
                style: {
                  'text-align': 'center',
                },
              },
            },
            {
              type: 'Phases',
              props: {
                phase: {
                  '@class': 'Script',
                  content: "Variable.find(gameModel,'phaseMSG')",
                  language: 'JavaScript',
                },
                options: {},
                style: {
                  width: '50%',
                },
                phaseMax: {
                  '@class': 'Script',
                  content: "Variable.find(gameModel,'phaseMax')",
                  language: 'JavaScript',
                },
                phaseMin: {
                  '@class': 'Script',
                  content: "Variable.find(gameModel,'phaseInitiale')",
                  language: 'JavaScript',
                },
              },
            },
            {
              type: 'Button',
              props: {
                action: {
                  '@class': 'Script',
                  content: 'Event.fire("PhaseSuivante");',
                  language: 'JavaScript',
                },
                label: 'Phase suivante',
                options: {
                  upgrades: {
                    disableIf: {
                      '@class': 'Script',
                      content:
                        'Variable.find(gameModel, "desactiverBoutonPhaseSuivante").getValue(self) || Variable.find(gameModel, "phaseMaxPlayer").getValue(self) <= Variable.find(gameModel, "phaseMSG").getValue(self);',
                      language: 'JavaScript',
                    },
                  },
                },
                style: {},
              },
            },
          ],
          options: {},
          layout: {
            justifyContent: 'space-evenly',
            alignItems: 'center',
          },
          style: {},
        },
      },
      {
        type: 'LinearLayout',
        props: {
          children: [
            {
              type: 'FlexList',
              props: {
                name: 'Nav bar',
                children: [
                  {
                    type: 'IconButton',
                    props: {
                      icon: 'hotel',
                      label: 'Accueil',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      prefixedLabel: false,
                      options: {
                        actions: {
                          openPage: {
                            pageId: {
                              '@class': 'Script',
                              content: '"2"',
                              language: 'TypeScript',
                            },
                            pageLoaderName: {
                              '@class': 'Script',
                              content: '"Main page loader"',
                              language: 'TypeScript',
                            },
                          },
                        },
                      },
                      style: {},
                      name: 'Accueil',
                    },
                  },
                  {
                    type: 'IconButton',
                    props: {
                      icon: 'envelope',
                      label: 'Mail',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      prefixedLabel: false,
                      options: {
                        upgrades: {
                          unreadCount: {
                            '@class': 'Script',
                            content: "Variable.find(gameModel,'inbox')",
                            language: 'JavaScript',
                          },
                        },
                        actions: {
                          openPage: {
                            pageId: {
                              '@class': 'Script',
                              content: '"3"',
                              language: 'TypeScript',
                            },
                            pageLoaderName: {
                              '@class': 'Script',
                              content: '"Main page loader"',
                              language: 'TypeScript',
                            },
                          },
                        },
                      },
                      style: {},
                    },
                  },
                  {
                    type: 'IconButton',
                    props: {
                      icon: 'list-ul',
                      label: 'Actions',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      prefixedLabel: false,
                      options: {
                        upgrades: {
                          unreadCount: {
                            '@class': 'Script',
                            content:
                              "\tconst currentPhase = Variable.find(gameModel,'phaseMSG').getValue(self)\n\tconst currentPeriod = 1;\n\tlet items = []\n\tconst q = Variable.find(gameModel,'questions').items[currentPhase - 1];\t\n\tif (q) {\n\t\tq.items.map((item,i)=>{\n\t\t\tif (item['@class'] === 'QuestionDescriptor' || item['@class'] === 'WhQuestionDescriptor') \n\t\t\t{ \n\t\t\t\titems.push(item); \n\t\t\t} else if (i == currentPeriod - 1 && item['@class'] === 'ListDescriptor') { \n\t\t\t\titems = items.concat(item.flatten());\n\t\t\t}\n\t\t});\n\t}\nitems;",
                            language: 'JavaScript',
                          },
                        },
                        actions: {
                          openPage: {
                            pageId: {
                              '@class': 'Script',
                              content: '"4"',
                              language: 'TypeScript',
                            },
                            pageLoaderName: {
                              '@class': 'Script',
                              content: '"Main page loader"',
                              language: 'TypeScript',
                            },
                          },
                        },
                      },
                      style: {},
                    },
                  },
                  {
                    type: 'IconButton',
                    props: {
                      icon: 'clock',
                      label: 'Historique',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      prefixedLabel: false,
                      options: {
                        actions: {
                          openPage: {
                            pageId: {
                              '@class': 'Script',
                              content: '"5"',
                              language: 'TypeScript',
                            },
                            pageLoaderName: {
                              '@class': 'Script',
                              content: '"Main page loader"',
                              language: 'TypeScript',
                            },
                          },
                        },
                      },
                      style: {},
                    },
                  },
                  {
                    type: 'IconButton',
                    props: {
                      icon: 'exclamation',
                      label: 'Final',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      options: {
                        layout: {
                          order: -1,
                        },
                        actions: {
                          openPage: {
                            pageLoaderName: {
                              '@class': 'Script',
                              content: '"Main page loader"',
                              language: 'TypeScript',
                            },
                            pageId: {
                              '@class': 'Script',
                              content: '"6"',
                              language: 'TypeScript',
                            },
                          },
                        },
                      },
                      prefixedLabel: false,
                      style: {},
                    },
                  },
                ],
                layout: {
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  flexDirection: 'column',
                },
                options: {},
                style: {},
              },
            },
            {
              type: 'PageLoader',
              props: {
                options: {},
                style: {
                  height: '100%',
                },
                selectedPageId: {
                  '@class': 'Script',
                  content: '"2"',
                  language: 'TypeScript',
                },
                name: 'Main page loader',
                initialSelectedPageId: {
                  '@class': 'Script',
                  content: '"2"',
                  language: 'TypeScript',
                },
              },
            },
            {
              type: 'FlexList',
              props: {
                children: [
                  {
                    type: 'Boxes',
                    props: {
                      options: {},
                      style: {},
                      name: '',
                      script: {
                        '@class': 'Script',
                        content: "Variable.find(gameModel,'timeCards')",
                        language: 'JavaScript',
                      },
                      label: 'Budget temps',
                      hideBoxValue: true,
                      showLabelValue: true,
                    },
                  },
                  {
                    type: 'Gauge',
                    props: {
                      options: {},
                      script: {
                        '@class': 'Script',
                        content: "Variable.find(gameModel,'timeCards')",
                        language: 'JavaScript',
                      },
                      label: 'Budget temps',
                      style: {
                        width: '100%',
                      },
                      followNeedle: false,
                    },
                  },
                  {
                    type: 'Gauge',
                    props: {
                      label: 'Liquidités',
                      script: {
                        '@class': 'Script',
                        content: "Variable.find(gameModel,'caisse')",
                        language: 'JavaScript',
                      },
                      options: {},
                      style: {
                        width: '100%',
                      },
                    },
                  },
                  {
                    type: 'Gauge',
                    props: {
                      label: 'Dépenses mensuelles engagées',
                      script: {
                        '@class': 'Script',
                        content:
                          "Variable.find(gameModel,'depensesMensuelles')",
                        language: 'JavaScript',
                      },
                      options: {},
                      style: {
                        width: '100%',
                      },
                    },
                  },
                ],
                layout: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  alignContent: 'space-evenly',
                },
                options: {},
                style: {},
              },
            },
          ],
          name: 'corps',
          flexValues: [456.934, 2034.57, 509.244],
          options: {},
          style: {
            height: '100%',
            overflow: 'auto',
          },
          noSplitter: true,
          noResize: true,
        },
      },
    ],
    style: {
      width: '100%',
      height: '100%',
      overflow: 'auto',
    },
    name: 'Main list',
    layout: {
      flexDirection: 'column',
    },
    options: {},
  },
};

const titleStyle = css({
  backgroundColor: themeVar.primaryHoverColor,
  textAlign: 'center',
  padding: '2px',
});

function PageExamples() {
  return (
    <FonkyFlexContainer
      vertical
      className={cx(
        expandBoth,
        css({
          borderStyle: 'solid',
          borderWidth: '5px',
          borderColor: themeVar.primaryLighterColor,
        }),
      )}
    >
      <FonkyFlexContent>
        <FonkyFlexContainer className={expandHeight}>
          <FonkyFlexContent>
            <div className={cx(flex, flexColumn, justifyCenter, expandHeight)}>
              <div className={titleStyle}>Mode : Normal</div>
              <div className={cx(grow, autoScroll)}>
                <ThemeProvider contextName="editor">
                  <JSONPageDeserializer wegasComponent={page1JSON} />
                </ThemeProvider>
              </div>
            </div>
          </FonkyFlexContent>
          <FonkyFlexSplitter notDraggable />
          <FonkyFlexContent>
            <div className={cx(flex, flexColumn, justifyCenter, expandHeight)}>
              <div className={titleStyle}>Mode : Lighter</div>
              <div className={cx(grow, autoScroll)}>
                <ThemeProvider contextName="default">
                  <JSONPageDeserializer wegasComponent={page1JSON} />
                </ThemeProvider>
              </div>
            </div>
          </FonkyFlexContent>
        </FonkyFlexContainer>
      </FonkyFlexContent>
      <FonkyFlexSplitter notDraggable />
      <FonkyFlexContent>
        <FonkyFlexContainer className={expandHeight}>
          <FonkyFlexContent>
            <div className={cx(flex, flexColumn, justifyCenter, expandHeight)}>
              <div className={titleStyle}>Mode : Dark</div>
              <div className={cx(grow, autoScroll)}>
                <ThemeProvider contextName="player">
                  <JSONPageDeserializer wegasComponent={page1JSON} />
                </ThemeProvider>
              </div>
            </div>
          </FonkyFlexContent>
          <FonkyFlexSplitter notDraggable />
          <FonkyFlexContent>
            <div className={cx(flex, flexColumn, justifyCenter, expandHeight)}>
              <div className={titleStyle}>Mode : Dark lighter</div>
              <div className={cx(grow, autoScroll)}>
                <ThemeProvider contextName="player">
                  <JSONPageDeserializer wegasComponent={page1JSON} />
                </ThemeProvider>
              </div>
            </div>
          </FonkyFlexContent>
        </FonkyFlexContainer>
      </FonkyFlexContent>
    </FonkyFlexContainer>
  );
}

interface MyColorPickerProps {
  color: string;
  bgColor?: string;
  onChange?: ColorChangeHandler;
}

function MyColorPicker({ color, bgColor, onChange }: MyColorPickerProps) {
  const [displayed, setDisplayed] = React.useState(false);
  const pickerZone = React.useRef(null);
  useOnClickOutside(pickerZone, () => {
    setDisplayed(false);
  });

  return (
    <div className={flex} ref={pickerZone}>
      <div
        className={cx(
          colorButton(
            color,
            Color(bgColor).lightness() < 20
              ? Color(bgColor).lighten(50).toString()
              : bgColor,
          ),
          grow,
        )}
        onClick={() => setDisplayed(old => !old)}
      />
      {displayed && (
        <ChromePicker
          // className={grow}
          color={color}
          onChangeComplete={onChange}
        />
      )}
    </div>
  );
}

interface ThemeEditorModal {
  type: 'close' | 'newTheme';
}

interface ThemeEditorErrorModal {
  type: 'error';
  label?: string;
}

type ThemeEditorState = ThemeEditorModal | ThemeEditorErrorModal;

export default function ThemeEditor() {
  const [modalState, setModalState] = React.useState<ThemeEditorState>({
    type: 'close',
  });
  const {
    themeState,
    addNewTheme,
    deleteTheme,
    setSelectedTheme,
    setThemeEntry,
    setThemeColor,
    setThemeModifer,
  } = React.useContext(themeCTX);
  const [currentModifiedTheme, setModifiedTheme] = React.useState<string>(
    themeState.selectedTheme['editor'],
  );
  const [selectedSection, setSelectedSection] = React.useState<
    { [key in keyof Theme]?: boolean }
  >(
    Object.keys(themeState.themes[currentModifiedTheme]).reduce(
      (o, k: keyof Theme) => ({ ...o, [k]: true }),
      {},
    ),
  );

  const currentEntries = themeState.themes[currentModifiedTheme].entries;
  const currentValues = themeState.themes[currentModifiedTheme].colors;
  const currentModifiers = themeState.themes[currentModifiedTheme].modifiers;

  return (
    <Toolbar>
      <Toolbar.Header className={flex}>
        <div className={grow}>
          <div>
            {modalState.type === 'newTheme' ? (
              <TextPrompt
                placeholder="Theme name"
                defaultFocus
                onAction={(success, value) => {
                  if (value === '') {
                    setModalState({
                      type: 'error',
                      label: 'The theme must have a name',
                    });
                  } else {
                    if (success) {
                      addNewTheme(value);
                      setModifiedTheme(value);
                      setModalState({ type: 'close' });
                    }
                  }
                }}
                onBlur={() => setModalState({ type: 'close' })}
                applyOnEnter
              />
            ) : (
              <IconButton
                icon="plus"
                tooltip="Add a new theme"
                onClick={() => setModalState({ type: 'newTheme' })}
              />
            )}
            <Menu
              label={currentModifiedTheme}
              items={Object.keys(themeState.themes).map(k => ({
                value: k,
                label: k,
              }))}
              onSelect={({ value }) => setModifiedTheme(value)}
            />
            <ConfirmButton
              icon="trash"
              tooltip="Delete the theme"
              onAction={success => {
                if (success) {
                  deleteTheme(currentModifiedTheme);
                  setModifiedTheme(old => {
                    const newThemes = Object.keys(themeState.themes).filter(
                      k => k !== old,
                    );
                    if (newThemes.length === 0) {
                      return 'default';
                    }
                    return newThemes[0];
                  });
                }
              }}
              onBlur={() => setModalState({ type: 'close' })}
            />
            {modalState.type === 'error' && (
              <MessageString
                type="error"
                value={modalState.label}
                onLabelVanish={() => setModalState({ type: 'close' })}
              />
            )}
          </div>
          <div>
            <Menu
              label={'Contexts'}
              items={Object.keys(themeState.selectedTheme).map(
                (k: keyof typeof themeState.selectedTheme) => ({
                  value: k,
                  label: (
                    <>
                      <span
                        style={{ minWidth: '100px' }}
                      >{`${k}'s theme :`}</span>
                      <Menu
                        label={themeState.selectedTheme[k]}
                        items={Object.keys(themeState.themes).map(k => ({
                          value: k,
                          label: k,
                        }))}
                        onSelect={({ value }) => setSelectedTheme(value, k)}
                      />
                    </>
                  ),
                }),
              )}
              onSelect={() => {}}
            />
          </div>
        </div>
        <Menu
          label={'Theme editor content'}
          items={Object.keys(themeState.themes[currentModifiedTheme]).map(
            (k: keyof Theme) => ({
              value: k,
              label: (
                <>
                  <input
                    type="checkbox"
                    defaultChecked={selectedSection[k]}
                    onChange={() =>
                      setSelectedSection(o => ({ ...o, [k]: !o[k] }))
                    }
                    onClick={e => e.stopPropagation()}
                  />
                  {k}
                </>
              ),
            }),
          )}
          onSelect={({ value: k }) =>
            setSelectedSection(o => ({ ...o, [k]: !o[k] }))
          }
        />
      </Toolbar.Header>
      <Toolbar.Content>
        <div className={cx(flex, flexRow, expandWidth)}>
          <div className={css({ width: '50%' })}>
            <FonkyFlexContainer className={expandHeight}>
              {selectedSection.colors && (
                <FonkyFlexContent>
                  <div className={cx(flex, grow, flexColumn, defaultPadding)}>
                    {Object.keys(currentValues).map((k: keyof ThemeColors) => (
                      <p key={k}>
                        <label
                          className={cx(
                            // titleStyle,
                            css({ display: 'flex', alignItems: 'center' }),
                          )}
                          htmlFor={k}
                          title={k}
                        >
                          {k} :
                        </label>
                        <MyColorPicker
                          color={currentValues[k]}
                          bgColor={
                            themeState.themes[themeState.selectedTheme.editor]
                              .colors.backgroundColor
                          }
                          onChange={color => {
                            setThemeColor(currentModifiedTheme, k, color.hex);
                          }}
                        />
                      </p>
                    ))}
                  </div>
                </FonkyFlexContent>
              )}
              {selectedSection.colors &&
                (selectedSection.modifiers || selectedSection.entries) && (
                  <FonkyFlexSplitter />
                )}
              {selectedSection.modifiers && (
                <FonkyFlexContent>
                  <div className={cx(flex, grow, flexColumn, defaultPadding)}>
                    {Object.keys(currentModifiers).map(
                      (k: keyof ThemeColorModifiers) => (
                        <p key={k}>
                          <label
                            className={cx(
                              css({ display: 'flex', alignItems: 'center' }),
                            )}
                            htmlFor={k}
                            title={k}
                          >
                            {k} :
                          </label>
                          <NumberSlider
                            max={1}
                            min={0}
                            value={currentModifiers[k]}
                            onChange={v =>
                              setThemeModifer(currentModifiedTheme, k, v)
                            }
                          />
                        </p>
                      ),
                    )}
                  </div>
                </FonkyFlexContent>
              )}
              {selectedSection.modifiers && selectedSection.entries && (
                <FonkyFlexSplitter />
              )}
              {selectedSection.entries && (
                <FonkyFlexContent>
                  <div className={cx(flex, grow, flexColumn, defaultPadding)}>
                    {Object.keys(currentEntries).map(
                      (k: keyof ThemeEntries) => (
                        <p key={k}>
                          <label
                            className={cx(
                              css({ display: 'flex', alignItems: 'center' }),
                            )}
                            htmlFor={k}
                            title={k}
                          >
                            {k} :
                          </label>
                          <NumberSlider
                            max={15}
                            min={0}
                            steps={15}
                            value={Number(currentEntries[k].replace('px', ''))}
                            onChange={v =>
                              setThemeEntry(currentModifiedTheme, k, v + 'px')
                            }
                            displayValues={val => val + 'px'}
                          />
                        </p>
                      ),
                    )}
                  </div>
                </FonkyFlexContent>
              )}
            </FonkyFlexContainer>
          </div>
          <div className={css({ width: '50%' })}>
            <PageExamples />
          </div>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
