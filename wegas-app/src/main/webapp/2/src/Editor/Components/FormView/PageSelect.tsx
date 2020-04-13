import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { SrcEditorLanguages } from '../ScriptEditors/SrcEditor';
import { createScript } from '../../../Helper/wegasEntites';
import { useStore } from '../../../data/store';
import {
  indexToTree,
  isPageItem,
  getPageIndexItem,
} from '../../../Helper/pages';
import { useScript } from '../../../Components/Hooks/useScript';
import { Menu } from '../../../Components/Menu';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: IScript;
  onChange: (code: IScript) => void;
}

const updateScript = (scriptContent: string, currentScript?: IScript) =>
  currentScript
    ? { ...currentScript, content: scriptContent }
    : createScript(scriptContent, 'TypeScript');

export default function PageSelect(props: PageSelectProps) {
  const [pageValue, setPageValue] = React.useState<string>('');
  const [srcMode, setSrcMode] = React.useState(false);
  const index = useStore(s => s.pages.index);
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
    <>
      <IconButton icon="code" onClick={() => setSrcMode(sm => !sm)} />
      {srcMode ? (
        <div className={scriptEditStyle}>
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
            noGutter={true}
          />
        </div>
      ) : (
        <>
          <Menu
            items={indexToTree(index)}
            onSelect={item => {
              isPageItem(item.value) && onPageChange(item.value.id);
            }}
            label={getPageIndexItem(index, pageId)?.name || 'Unknown page'}
          />
        </>
      )}
    </>
  );
}
