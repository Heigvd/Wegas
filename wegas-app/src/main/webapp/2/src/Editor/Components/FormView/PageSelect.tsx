import * as React from 'react';
import Select from './Select';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { SrcEditorLanguages } from '../ScriptEditors/SrcEditor';
import { useStore } from '../../../data/store';
import { TreeSelect } from '../Tree/TreeSelect';
import { indexToTree, isPageItem } from '../../../Helper/pages';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: IScript;
  onChange: (code: IScript) => void;
}

export default function PageSelect(props: PageSelectProps) {
  const [pageValue, setPageValue] = React.useState('');
  const [srcMode, setSrcMode] = React.useState(false);
  const index = useStore(s => s.pages.index);

  React.useEffect(() => {
    if (props.value === undefined) {
      setPageValue('');
    } else {
      setPageValue(props.value.content);
    }
  }, [props.value]);

  const onPageChange = React.useCallback(
    (value?: string) => {
      const content = value ? value : '';
      props.onChange(
        props.value
          ? { ...props.value, content }
          : { '@class': 'Script', content, language: 'Javascript' },
      );
    },
    [props],
  );

  return (
    <>
      <IconButton icon="code" onClick={() => setSrcMode(sm => !sm)} />
      {srcMode ? (
        <div className={scriptEditStyle}>
          <WegasScriptEditor
            value={props.value ? props.value.content : ''}
            returnType={['string']}
            onChange={value =>
              props.onChange(
                props.value
                  ? { ...props.value, content: value }
                  : {
                      '@class': 'Script',
                      content: value,
                      language: 'Javascript',
                    },
              )
            }
            language={
              props.value
                ? (props.value.language.toLowerCase() as SrcEditorLanguages)
                : 'javascript'
            }
            minimap={false}
            noGutter={true}
          />
        </div>
      ) : (
        <>
          {/* <StringInput value={getPageIndexItem(index,pageValue)?.name || "Unknown page"} /> */}
          <TreeSelect
            items={indexToTree(index)}
            onSelect={item => isPageItem(item) && onPageChange(item.id)}
          />
        </>
        // <Select
        //   {...omit(props, ['onChange', 'value'])}
        //   onChange={onPageChange}
        //   value={pageValue}
        //   view={{
        //     ...props.view,
        //     choices: Object.entries(pages).map(([k, p]) => ({
        //       label: computePageLabel(k, p.name),
        //       value: k,
        //     })),
        //   }}
        // />
      )}
    </>
  );
}
