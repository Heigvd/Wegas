import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { DropMenu } from '../../../Components/DropMenu';
import { useScript } from '../../../Components/Hooks/useScript';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { flex, flexRow, grow } from '../../../css/classes';
import { State } from '../../../data/Reducer/reducers';
import { useStore } from '../../../data/Stores/store';
import {
  isPageLoaderComponent,
  isWegasComponent,
  PageLoaderComponentProps,
  visitComponents,
} from '../../../Helper/pages';
import { createScript } from '../../../Helper/wegasEntites';
import { MessageString } from '../MessageString';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { TempScriptEditor } from '../ScriptEditors/TempScriptEditor';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';

const updateScript = (scriptContent: string, currentScript?: IScript) =>
  currentScript
    ? { ...currentScript, content: scriptContent }
    : createScript(scriptContent, 'TypeScript');

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: IScript;
  onChange: (code: IScript) => void;
}

function pageLoadersSelector(s: State) {
  const loaders: DropMenuItem<{ pageId: string } & PageLoaderComponentProps>[] =
    [];
  Object.entries(s.pages)
    .filter(([, v]) => isWegasComponent(v))
    .map(([k, v]) =>
      // TS does not understand PageIndexes have been filtered out
      visitComponents(v as unknown as WegasComponent, c => {
        if (isPageLoaderComponent(c)) {
          loaders.push({
            label: c.props.name,
            value: {
              pageId: k,
              ...c.props,
            },
          });
        }
      }),
    );
  return loaders;
}

export default function PageLoaderSelect({
  onChange,
  view,
  errorMessage,
  value,
}: PageSelectProps) {
  const [loaderValue, setPageLoader] = React.useState<string>();
  const [srcMode, setSrcMode] = React.useState(false);
  const pageLoaders = useStore(pageLoadersSelector);
  const pageLoaderName = useScript<string>(loaderValue);

  React.useEffect(() => {
    setPageLoader(value ? value.content : '');
  }, [value]);

  const onPageLoaderChange = React.useCallback(
    (newValue?: string) => {
      const content = updateScript(JSON.stringify(newValue || ''), value);
      setPageLoader(content.content);
      onChange(content);
    },
    [onChange, value],
  );

  const language = value
    ? (value.language.toLowerCase() as SrcEditorLanguages)
    : 'typescript';

  return (
    <CommonViewContainer view={view} errorMessage={errorMessage}>
      <Labeled {...view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div className={cx(flex, flexRow)} id={inputId}>
              {pageLoaders.length === 0 ? (
                <MessageString value="No page loader found" />
              ) : (
                <>
                  <Button
                    icon="code"
                    onClick={() => setSrcMode(sm => !sm)}
                    className={css({ flex: '0 1 auto' })}
                  />
                  {srcMode ? (
                    <div className={cx(scriptEditStyle, grow)}>
                      <TempScriptEditor
                        initialValue={loaderValue || ''}
                        returnType={['string']}
                        onChange={setPageLoader}
                        onSave={newValue =>
                          onChange(
                            value
                              ? { ...value, content: newValue }
                              : createScript(newValue, 'TypeScript'),
                          )
                        }
                        language={language}
                        minimap={false}
                        noGutter
                        resizable
                      />
                    </div>
                  ) : (
                    <DropMenu
                      items={pageLoaders}
                      onSelect={item => {
                        onPageLoaderChange(item.value.name);
                      }}
                      label={pageLoaderName}
                      containerClassName={grow}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
