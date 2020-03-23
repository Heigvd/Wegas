import * as React from 'react';
import Select from './Select';
import { GameModel } from '../../../data/selectors';
import { PageAPI } from '../../../API/pages.api';
import { WidgetProps } from 'jsoninput/typings/types';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { scriptEditStyle } from './Script/Script';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { SrcEditorLanguages } from '../ScriptEditors/SrcEditor';
import { omit } from 'lodash-es';
import { returnPages, computePageLabel } from '../Page/PageEditor';

export interface PageSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: IScript;
  onChange: (code: IScript) => void;
}

export default function PageSelect(props: PageSelectProps) {
  const [pages, setPages] = React.useState<PagesWithName>({});
  const [pageValue, setPageValue] = React.useState('');
  const [srcMode, setSrcMode] = React.useState(false);

  React.useEffect(() => {
    const gameModelId = GameModel.selectCurrent().id!;
    PageAPI.getAll(gameModelId).then(pages => {
      const index = pages['index'];
      setPages(() => returnPages(pages, index.root));
    });
  });

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
        <Select
          {...omit(props, ['onChange', 'value'])}
          onChange={onPageChange}
          value={pageValue}
          view={{
            ...props.view,
            choices: Object.entries(pages).map(([k, p]) => ({
              label: computePageLabel(k, p.name),
              value: k,
            })),
          }}
        />
      )}
    </>
  );
}
