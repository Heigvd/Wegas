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
  getPageIndexItem,
  indexToTree,
  isPageItem,
} from '../../../Helper/pages';
import { createScript } from '../../../Helper/wegasEntites';
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

  const language = props.value
    ? (props.value.language.toLowerCase() as SrcEditorLanguages)
    : 'typescript';

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
                  <TempScriptEditor
                    initialValue={pageValue || ''}
                    returnType={['string']}
                    onChange={setPageValue}
                    onSave={value =>
                      props.onChange(
                        props.value
                          ? { ...props.value, content: value }
                          : createScript(value),
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
