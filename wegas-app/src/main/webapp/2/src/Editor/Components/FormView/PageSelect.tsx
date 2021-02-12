import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView, CommonViewContainer } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { createScript } from '../../../Helper/wegasEntites';
import { useStore } from '../../../data/Stores/store';
import {
  indexToTree,
  isPageItem,
  getPageIndexItem,
} from '../../../Helper/pages';
import { useScript } from '../../../Components/Hooks/useScript';
import { DropMenu } from '../../../Components/DropMenu';
import { cx, css } from 'emotion';
import { flex, flexRow, grow } from '../../../css/classes';
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

function pageIndexSelector(s: State) {
  return s.pages.index;
}

export default function PageSelect(props: PageSelectProps) {
  const [pageValue, setPageValue] = React.useState<string>();
  const [srcMode, setSrcMode] = React.useState(false);
  const index = useStore(pageIndexSelector);
  const pageId = useScript<string>(pageValue);

  React.useEffect(() => {
    if (props.value === undefined) {
      setPageValue('');
    } else {
      setPageValue(props.value.content);
    }
  }, [props.value]);

  const onPageChange = React.useCallback(
    (value?: string) => {
      const content = updateScript(JSON.stringify(value || ''), props.value);
      setPageValue(content.content);
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
              <Button
                icon="code"
                onClick={() => setSrcMode(sm => !sm)}
                className={css({ flex: '0 1 auto' })}
              />
              {srcMode ? (
                <div className={cx(scriptEditStyle, grow)}>
                  <WegasScriptEditor
                    value={pageValue}
                    returnType={['string']}
                    onChange={setPageValue}
                    onSave={value =>
                      props.onChange(
                        props.value
                          ? { ...props.value, content: value }
                          : createScript(value),
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
                  items={indexToTree(index)}
                  onSelect={item => {
                    isPageItem(item.value) && onPageChange(item.value.id);
                  }}
                  label={
                    (pageId != null && getPageIndexItem(index, pageId)?.name) ||
                    'Unknown page'
                  }
                  containerClassName={grow}
                />
              )}
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
