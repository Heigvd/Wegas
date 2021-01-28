import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { createScript } from '../../../Helper/wegasEntites';
import { useStore } from '../../../data/Stores/store';
import {
  isWegasComponent,
  visitComponents,
  isPageLoaderComponent,
  PageLoaderComponentProps,
} from '../../../Helper/pages';
import { useScript } from '../../../Components/Hooks/useScript';
import { DropMenu, DropMenuItem } from '../../../Components/DropMenu';
import { cx, css } from 'emotion';
import { flex, flexRow, grow } from '../../../css/classes';
import { MessageString } from '../MessageString';
import { IScript } from 'wegas-ts-api';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { State } from '../../../data/Reducer/reducers';

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
  const loaders: DropMenuItem<
    { pageId: string } & PageLoaderComponentProps
  >[] = [];
  Object.entries(s.pages)
    .filter(([, v]) => isWegasComponent(v))
    .map(([k, v]) =>
      visitComponents(v, c => {
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

export default function PageLoaderSelect(props: PageSelectProps) {
  const [loaderValue, setPageLoader] = React.useState<string>();
  const [srcMode, setSrcMode] = React.useState(false);
  const pageLoaders = useStore(pageLoadersSelector);
  const pageLoaderName = useScript<string>(loaderValue);

  React.useEffect(() => {
    setPageLoader(props.value ? props.value.content : '');
  }, [props.value]);

  const onPageLoaderChange = React.useCallback(
    (value?: string) => {
      const content = updateScript(JSON.stringify(value || ''), props.value);
      setPageLoader(content.content);
      props.onChange(content);
    },
    [props],
  );

  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
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
                      <WegasScriptEditor
                        value={loaderValue}
                        returnType={['string']}
                        onChange={setPageLoader}
                        onSave={value =>
                          props.onChange(
                            props.value
                              ? { ...props.value, content: value }
                              : createScript(value, 'TypeScript'),
                          )
                        }
                        language={
                          props.value
                            ? (props.value.language.toLowerCase() as SrcEditorLanguages)
                            : 'typescript'
                        }
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
