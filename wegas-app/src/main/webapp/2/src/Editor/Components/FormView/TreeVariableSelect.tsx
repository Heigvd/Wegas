import * as React from 'react';
import { SearchableItems } from '../Tree/searchable';
import { TreeSelect, Item } from '../Tree/TreeSelect';
import { WidgetProps } from 'jsoninput/typings/types';
import { useStore } from '../../../data/store';
import { varIsList } from '../../../data/entities';
import { VariableDescriptor, GameModel } from '../../../data/selectors';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { CommonViewContainer, CommonView } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { css } from 'emotion';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import {
  scriptableClassNameToClassFilter,
  createScript,
} from '../../../Helper/wegasEntites';
import { scriptEditStyle } from './Script/Script';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { IVariableDescriptor, IScript } from 'wegas-ts-api';
import { SrcEditorLanguages } from '../ScriptEditors/editorHelpers';
import { Button } from '../../../Components/Inputs/Buttons/Button';

const treeCss = css({
  padding: '5px 10px',
  backgroundColor: 'white',
  boxShadow: '0 2px 5px black',
  borderRadius: '3px',
  position: 'absolute',
  zIndex: 1000,
  minWidth: '100%',
  maxWidth: '350%',
  maxHeight: '20em',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  overflow: 'auto',
  '*:focus': {
    outline: 'none',
  },
});

export interface TreeSelectItem<T> extends Item<T> {
  label: string;
  items?: TreeSelectItem<T>[];
}

export type StringOrT<FNT, T> = FNT extends undefined ? string : T;

export function genVarItems<T = string>(
  items: number[],
  selectableFn: (item: IVariableDescriptor) => boolean = () => true,
  classFilter: string[] = [],
  decorateFn?: (value: string) => T,
): TreeSelectItem<StringOrT<typeof decorateFn, T>>[] {
  function mapItem(i: number): TreeSelectItem<StringOrT<typeof decorateFn, T>> {
    const item = VariableDescriptor.select(i)!;
    const child = varIsList(item)
      ? genVarItems<T>(item.itemsIds, selectableFn, classFilter, decorateFn)
      : undefined;
    let select = selectableFn(item);
    if (classFilter.length > 0 && !classFilter.includes(item['@class'])) {
      select = false;
    }
    return {
      label: editorLabel(item),
      value: (decorateFn ? decorateFn(item.name!) : item.name!) as StringOrT<
        typeof decorateFn,
        T
      >,
      selectable: select,
      items: child,
    };
  }
  return items
    .map(mapItem)
    .filter(
      i =>
        !(
          i.value === undefined &&
          (i.items === undefined || i.items.length === 0)
        ),
    );
}
function getItems<T>(
  items: TreeSelectItem<T>[],
  key: keyof TreeSelectItem<T>,
  val: any,
  limit: number = Infinity,
) {
  let ret: TreeSelectItem<T>[] = [];
  for (const item of items) {
    if (JSON.stringify(item[key]) === JSON.stringify(val)) {
      ret.push(item);
    }
    if (ret.length >= limit) {
      ret.length = limit;
      return ret;
    }
    if (item.items != null) {
      ret = ret.concat(getItems(item.items, key, val, limit));
    }
    if (ret.length >= limit) {
      ret.length = limit;
      return ret;
    }
  }
  return ret;
}
function labelForValue<T>(items: TreeSelectItem<T>[], value?: T) {
  if (value != null) {
    const i = getItems(items, 'value', value, 1);
    if (i.length > 0) {
      return i[0].label;
    }
  }
  return '';
}
export interface TreeVSelectProps<T>
  extends WidgetProps.BaseProps<
    CommonView &
      LabeledView & {
        items?: TreeSelectItem<T>[];
        returnType?: WegasScriptEditorReturnTypeName[];
      }
  > {
  value?: T;
}

export class TreeVSelect<T> extends React.Component<
  TreeVSelectProps<T> & { items: TreeSelectItem<T>[] },
  { search: string; searching: boolean }
> {
  state = {
    searching: false,
    search: '',
  };
  handleOnSelect = (value: T) => {
    this.setState(
      {
        searching: false,
      },
      () => this.props.onChange(value),
    );
  };
  handleSearch = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      search: ev.target.value,
    });
  };
  inputFocus = () => {
    this.setState({ searching: true });
  };
  render(): React.ReactNode {
    const { items: valueItems = [] } = this.props;
    const { items: viewItems = [] } = this.props.view;
    const allItems = [...valueItems, ...viewItems];
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode, inputId }) => (
            <div
              onBlur={ev => {
                const me = ev.currentTarget;
                requestAnimationFrame(() => {
                  if (!me.contains(document.activeElement)) {
                    this.setState({
                      searching: false,
                    });
                  }
                });
              }}
            >
              {labelNode}
              <SimpleInput
                id={inputId}
                value={
                  this.state.searching
                    ? this.state.search || ''
                    : labelForValue(allItems, this.props.value)
                }
                onChange={v =>
                  this.setState({
                    search: String(v),
                  })
                }
                onFocus={this.inputFocus}
                readOnly={this.props.view.readOnly}
              />
              {this.state.searching && (
                <div className={treeCss}>
                  <SearchableItems
                    match={(item, s) => {
                      return item.label.toLowerCase().includes(s.toLowerCase());
                    }}
                    search={this.state.search}
                    items={allItems}
                    render={({ items }) => (
                      <TreeSelect
                        selected={this.props.value}
                        items={items}
                        onSelect={this.handleOnSelect}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}

export type TreeVariableSelectProps = TreeVSelectProps<string>;

export function TreeVariableSelect(
  props: TreeVariableSelectProps,
): JSX.Element {
  const items = useStore(() => GameModel.selectCurrent().itemsIds);

  const varItems = genVarItems(
    items,
    undefined,
    scriptableClassNameToClassFilter(props.view.returnType),
  );
  const filteredItems: TreeSelectItem<string>[] = props.view.items
    ? [
        {
          label: 'Variables',
          items: varItems,
          value: 'Variables',
          selectable: false,
        },
        ...props.view.items,
      ]
    : varItems;
  return <TreeVSelect {...props} items={filteredItems} />;
}

export interface ScripableVariableSelectProps
  extends Omit<TreeVariableSelectProps, 'value' | 'onChange'> {
  value?: IScript;
  onChange: (code: IScript) => void;
}

export function ScripableVariableSelect(
  props: ScripableVariableSelectProps,
): JSX.Element {
  const script = props.value ? props.value.content : '';
  const [srcMode, setSrcMode] = React.useState(false);
  const [treeValue, setTreeValue] = React.useState('');

  /**
   * Effect that forces srcMode in case the script is too complex to be parsed
   */
  React.useEffect(() => {
    if (props.value === undefined) {
      setTreeValue('');
    } else {
      const regexStart = /^(Variable\.find\(gameModel,("|')?)/;
      const regexEnd = /(("|')?\))(;?)$/;
      const simpleVarFindRegex = new RegExp(
        regexStart.source + `.*` + regexEnd.source,
      );
      if (props.value.content.match(simpleVarFindRegex)) {
        setTreeValue(
          props.value.content.replace(regexStart, '').replace(regexEnd, ''),
        );
      } else {
        setSrcMode(true);
        setTreeValue('');
      }
    }
  }, [props.value]);

  const onTreeChange = React.useCallback(
    (value?: string) => {
      const script = `Variable.find(gameModel,'${value}')`;
      props.onChange(
        props.value
          ? { ...props.value, content: script }
          : createScript(script),
      );
    },
    [props],
  );

  return (
    <>
      <Button icon="code" onClick={() => setSrcMode(sm => !sm)} />
      {srcMode ? (
        <div className={scriptEditStyle}>
          <WegasScriptEditor
            value={script}
            returnType={props.view.returnType}
            onChange={value =>
              props.onChange(
                props.value
                  ? { ...props.value, content: value }
                  : createScript(value),
              )
            }
            language={
              props.value
                ? (props.value.language.toLowerCase() as SrcEditorLanguages)
                : 'javascript'
            }
            minimap={false}
            noGutter
            resizable
          />
        </div>
      ) : (
        <TreeVariableSelect
          {...props}
          value={treeValue}
          onChange={onTreeChange}
        />
      )}
    </>
  );
}
