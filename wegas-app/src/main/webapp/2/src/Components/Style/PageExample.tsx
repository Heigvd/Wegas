import * as React from 'react';
import { ThemeProvider, ThemeContext } from './Theme';
import { JSONPageDeserializer } from '../PageComponents/tools/JSONPageDeserializer';

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
                containerStyle: {
                  width: '50%',
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
                disableIf: {
                  '@class': 'Script',
                  content:
                    'Variable.find(gameModel, "desactiverBoutonPhaseSuivante").getValue(self) || Variable.find(gameModel, "phaseMaxPlayer").getValue(self) <= Variable.find(gameModel, "phaseMSG").getValue(self);',
                  language: 'JavaScript',
                },
              },
            },
          ],
          layout: {
            justifyContent: 'space-evenly',
            alignItems: 'center',
          },
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
                      name: 'Accueil',
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
                      unreadCount: {
                        '@class': 'Script',
                        content: "Variable.find(gameModel,'inbox')",
                        language: 'JavaScript',
                      },
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
                      unreadCount: {
                        '@class': 'Script',
                        content:
                          "\tconst currentPhase = Variable.find(gameModel,'phaseMSG').getValue(self)\n\tconst currentPeriod = 1;\n\tlet items = []\n\tconst q = Variable.find(gameModel,'questions').items[currentPhase - 1];\t\n\tif (q) {\n\t\tq.items.map((item,i)=>{\n\t\t\tif (item['@class'] === 'QuestionDescriptor' || item['@class'] === 'WhQuestionDescriptor') \n\t\t\t{ \n\t\t\t\titems.push(item); \n\t\t\t} else if (i == currentPeriod - 1 && item['@class'] === 'ListDescriptor') { \n\t\t\t\titems = items.concat(item.flatten());\n\t\t\t}\n\t\t});\n\t}\nitems;",
                        language: 'JavaScript',
                      },
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
                  {
                    type: 'IconButton',
                    props: {
                      label: 'Historique',
                      action: {
                        '@class': 'Script',
                        content: '',
                        language: 'JavaScript',
                      },
                      icon: 'clock',
                      prefixedLabel: false,
                      openPage: {
                        pageLoaderName: {
                          '@class': 'Script',
                          content: '"Main page loader"',
                          language: 'TypeScript',
                        },
                        pageId: {
                          '@class': 'Script',
                          content: '"5"',
                          language: 'TypeScript',
                        },
                      },
                    },
                  },
                ],
                layout: {
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  flexDirection: 'column',
                },
              },
            },
            {
              type: 'PageLoader',
              props: {
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
              },
            },
          ],
          name: 'corps',
          flexValues: [730.97, 1538.11, 733.084],
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
  },
};

interface PageExamples {
  contextName?: ThemeContext;
  modeName?: string;
}

export function PageExamples({
  contextName = 'player',
  modeName,
}: PageExamples) {
  return (
    <ThemeProvider contextName={contextName} modeName={modeName}>
      <JSONPageDeserializer wegasComponent={page1JSON} />
    </ThemeProvider>
  );
}
