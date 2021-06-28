import { IconName } from '@fortawesome/fontawesome-svg-core';
import { css, cx } from 'emotion';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import {
  defaultPadding,
  expandBoth,
  flex,
  flexColumn,
  flexRow,
  itemCenter,
  justifyCenter,
  justifyEnd,
} from '../../../css/classes';
import { useThemeStore } from '../../../data/Stores/themeStore';
import FileBrowser from '../../../Editor/Components/FileBrowser/FileBrowser';
import { borderBottom } from '../../../Editor/Components/FormView/commonView';
import { Selector } from '../../../Editor/Components/FormView/Select';
import { IconComp, icons } from '../../../Editor/Components/Views/FontAwesome';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { internalTranslate } from '../../../i18n/internalTranslator';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { DropMenu } from '../../DropMenu';
import HTMLEditor from '../../HTML/HTMLEditor';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { Toggler } from '../../Inputs/Boolean/Toggler';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { NumberBox } from '../../Inputs/Number/NumberBox';
import { NumberInput } from '../../Inputs/Number/NumberInput';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { SimpleInput } from '../../Inputs/SimpleInput';
import { HTMLText } from '../../Outputs/HTMLText';
import { StandardGauge } from '../../Outputs/StandardGauge';
import { Toolbar } from '../../Toolbar';
import { SelectedThemes, themeVar } from '../ThemeVars';

const MIN_VALUE = 0;
const MAX_VALUE = 10;
const COMPONENT_STATES = ['disabled', 'readOnly'] as const;

const reflexElementStyle = cx(flex, justifyCenter, itemCenter);

const previewPageHeaderStyle = css({
  paddingLeft: '1em',
});

const previewPageStyle = css({
  padding: '1em',
  border: '2px solid ' + themeVar.colors.PrimaryColor,
});

interface PreviewState {
  numericVar: number;
  textVar: string;
  booleanVar: boolean;
  iconVar: IconName;
  disabled: boolean;
  readOnly: boolean;
  context: keyof SelectedThemes;
}

export default function Preview() {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(editorTabsTranslations, lang);
  const [previewState, setPreviewState] = React.useState<PreviewState>({
    numericVar: 2,
    textVar: 'Lorem Ipsum',
    iconVar: 'dog',
    booleanVar: true,
    disabled: false,
    readOnly: false,
    context: 'editor',
  });

  const { numericVar, textVar, booleanVar, iconVar, disabled, readOnly } =
    previewState;

  const previewClassName = useThemeStore(
    s => s.themes[s.editedThemeName].modeClasses[s.editedModeName],
  );

  return (
    <Toolbar className={defaultPadding}>
      <Toolbar.Header className={cx(flex, justifyEnd, borderBottom)}>
        <DropMenu
          icon="cog"
          items={[
            {
              label: i18nValues.themeEditor.componentState,
              value: 'componentState',
              items: COMPONENT_STATES.map(feature => ({
                value: feature,
                label: (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      setPreviewState(o => ({
                        ...o,
                        [feature]: !o[feature],
                      }));
                    }}
                    className={cx(flex, flexRow, itemCenter)}
                  >
                    <CheckBox
                      value={previewState[feature]}
                      onChange={() =>
                        setPreviewState(o => ({ ...o, [feature]: !o[feature] }))
                      }
                    />
                    {i18nValues.themeEditor.states(feature)}
                  </div>
                ),
              })),
            },
          ]}
          onSelect={() => {}}
        />
      </Toolbar.Header>
      <Toolbar.Content className={cx(flex, flexColumn)}>
        <div className={previewPageHeaderStyle}>
          <h2>{i18nValues.themeEditor.previewPage}</h2>
        </div>
        <div className={cx(previewPageStyle, expandBoth)}>
          <ReflexContainer orientation="vertical" className={previewClassName}>
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement className={reflexElementStyle}>
                  <StandardGauge
                    value={numericVar}
                    min={MIN_VALUE}
                    max={MAX_VALUE}
                    disabled={disabled}
                  />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <NumberBox
                    value={numericVar}
                    minValue={MIN_VALUE}
                    maxValue={MAX_VALUE}
                    onChange={v =>
                      setPreviewState(o => ({ ...o, numericVar: v }))
                    }
                    showLabelValue
                    disabled={disabled}
                  />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <NumberInput
                    value={numericVar}
                    onChange={v =>
                      setPreviewState(o => ({ ...o, numericVar: v }))
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <NumberSlider
                    value={numericVar}
                    min={MIN_VALUE}
                    max={MAX_VALUE}
                    steps={MAX_VALUE - MIN_VALUE}
                    onChange={v =>
                      setPreviewState(o => ({ ...o, numericVar: v }))
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement className={reflexElementStyle}>
                  <HTMLText text={textVar} disabled={disabled} />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <SimpleInput
                    value={textVar}
                    onChange={v =>
                      setPreviewState(o => ({ ...o, textVar: String(v) }))
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                  />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <HTMLEditor
                    value={textVar}
                    onChange={v =>
                      setPreviewState(o => ({ ...o, textVar: String(v) }))
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                    noRootBlock
                  />
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement>
              <ReflexContainer orientation="horizontal">
                <ReflexElement>
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className={reflexElementStyle}>
                      <IconComp
                        icon={{ icon: iconVar, size: '5x' }}
                        disabled={disabled}
                      />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className={reflexElementStyle}>
                      <Selector
                        value={iconVar}
                        choices={Object.keys(icons).map(v => ({
                          value: v,
                          label: v,
                        }))}
                        onChange={v =>
                          setPreviewState(o => ({
                            ...o,
                            iconVar: v.target.value as IconName,
                          }))
                        }
                        disabled={disabled}
                        readOnly={readOnly}
                      />
                    </ReflexElement>
                  </ReflexContainer>
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement>
                  <ReflexContainer orientation="vertical">
                    <ReflexElement className={reflexElementStyle}>
                      <Toggler
                        value={booleanVar}
                        onChange={v =>
                          setPreviewState(o => ({ ...o, booleanVar: v }))
                        }
                        disabled={disabled}
                        readOnly={readOnly}
                      />
                    </ReflexElement>
                    <ReflexSplitter />
                    <ReflexElement className={reflexElementStyle}>
                      <CheckBox
                        value={booleanVar}
                        onChange={v =>
                          setPreviewState(o => ({ ...o, booleanVar: v }))
                        }
                        disabled={disabled}
                        readOnly={readOnly}
                      />
                    </ReflexElement>
                  </ReflexContainer>
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <FileBrowser disabled={disabled} readOnly={readOnly} />
                </ReflexElement>
                <ReflexSplitter />
                <ReflexElement className={reflexElementStyle}>
                  <ConfirmButton label={i18nValues.themeEditor.clickMe} />
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
          </ReflexContainer>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
