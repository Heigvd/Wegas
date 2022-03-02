import { css, cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { IScript, IVariableDescriptor } from 'wegas-ts-api';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import {
  inputStyle,
  SimpleInput,
} from '../../../Components/Inputs/SimpleInput';
import {
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
} from '../../../css/classes';
import { varIsList } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { GameModel, VariableDescriptor } from '../../../data/selectors';
import { useStore } from '../../../data/Stores/store';
import {
  createScript,
  scriptableClassNameToClassFilter,
} from '../../../Helper/wegasEntites';
import { WegasScriptEditor } from '../ScriptEditors/WegasScriptEditor';
import { SearchableItems } from '../Tree/searchable';
import { TreeSelect } from '../Tree/TreeSelect';
import { VariableScriptPath } from '../Variable/VariableScriptPath';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';
import { scriptEditStyle } from './Script/Script';
import { computeReturnType, ScriptableView } from './ScriptableString';

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

export type StringOrT<FNT, T> = FNT extends undefined ? string : T;

export function genVarItems<T = string>(
  items: number[],
  selectableFn: (item: IVariableDescriptor) => boolean = () => true,
  classFilter: string[] = [],
  decorateFn?: (value: string) => T,
): TreeSelectItem<StringOrT<typeof decorateFn, T>>[] {
  function mapItem(
    i: number,
  ): TreeSelectItem<StringOrT<typeof decorateFn, T>> | undefined {
    const item = VariableDescriptor.select(i);
    if (item == null) {
      return undefined;
    }
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
  function itemFilter(
    item: TreeSelectItem<T> | undefined,
  ): item is TreeSelectItem<T> {
    return (
      item != null &&
      !(
        item.value === undefined &&
        (item.items === undefined || item.items.length === 0)
      )
    );
  }

  return items.map(mapItem).filter(itemFilter);
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

interface LabeledTreeVSelectView<T> extends ScriptableView {
  items?: TreeSelectItem<T>[];
  returnType?: WegasScriptEditorReturnTypeName[];
}

export interface LabeledTreeVSelectProps<T>
  extends WidgetProps.BaseProps<LabeledTreeVSelectView<T>> {
  value?: T;
}

interface SearcherProps<T>
  extends WidgetProps.BaseProps<
    CommonView &
      LabeledView & {
        items?: TreeSelectItem<T>[];
      }
  > {
  value?: T;
  items?: TreeSelectItem<T>[];
  labelNode?: React.ReactNode;
  inputId?: string;
  ChildrenComp: React.FunctionComponent<{
    selected?: T;
    onSelect: (selected: T) => void;
    items: Item<T>[];
  }>;
}

export function Searcher<T>({
  onChange,
  value,
  items: valueItems = [],
  labelNode,
  inputId,
  view,
  ChildrenComp,
}: SearcherProps<T>) {
  const [searching, setSearching] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const allItems = [...valueItems, ...(view.items || [])];

  return (
    <div
      onBlur={ev => {
        const me = ev.currentTarget;
        requestAnimationFrame(() => {
          if (!me.contains(document.activeElement)) {
            setSearching(false);
          }
        });
      }}
    >
      {labelNode}
      <div className={cx(flex, flexRow, itemCenter, inputStyle)}>
        <SimpleInput
          id={inputId}
          value={searching ? search || '' : labelForValue(allItems, value)}
          onChange={v => setSearch(String(v))}
          onFocus={() => setSearching(true)}
          readOnly={view.readOnly}
          className={cx(css({ borderStyle: 'none' }, grow))}
        />
        <Button
          icon={searching ? 'caret-up' : 'caret-down'}
          onClick={() => setSearching(searching => !searching)}
        />
      </div>
      {searching && (
        <div className={treeCss}>
          <SearchableItems
            match={(item, s) => {
              return item.label.toLowerCase().includes(s.toLowerCase());
            }}
            search={search}
            items={allItems}
            render={({ items }) => (
              <ChildrenComp
                selected={value}
                items={items}
                onSelect={(value: T) => {
                  setSearching(false);
                  onChange(value);
                }}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}

function isValueScript(value: any): value is { type: string; script: string } {
  return (
    typeof value === 'object' && 'type' in value && value.type === 'variable'
  );
}

export interface TreeVSelectProps<T> extends LabeledTreeVSelectProps<T> {
  labelNode?: React.ReactNode;
  inputId?: string;
}

export function TreeVSelect<T>(
  props: TreeVSelectProps<T> & { items: TreeSelectItem<T>[] },
) {
  return (
    <div className={cx(flex, flexColumn)}>
      {isValueScript(props.value) && (
        <VariableScriptPath script={props.value.script} />
      )}
      <Searcher {...props} ChildrenComp={TreeSelect} />
    </div>
  );
}

export class LabeledTreeVSelect<T> extends React.Component<
  LabeledTreeVSelectProps<T> & { items: TreeSelectItem<T>[] }
> {
  render(): React.ReactNode {
    return (
      <CommonViewContainer
        view={this.props.view}
        errorMessage={this.props.errorMessage}
      >
        <Labeled {...this.props.view}>
          {({ labelNode, inputId }) => (
            <TreeVSelect
              {...this.props}
              labelNode={labelNode}
              inputId={inputId}
            />
          )}
        </Labeled>
      </CommonViewContainer>
    );
  }
}

export type TreeVariableSelectProps = TreeVSelectProps<string> & {
  noLabel?: boolean;
};

export function TreeVariableSelect(
  props: TreeVariableSelectProps,
): JSX.Element {
  const varItems = useStore(
    () =>
      genVarItems(
        GameModel.selectCurrent().itemsIds,
        undefined,
        scriptableClassNameToClassFilter(props.view.returnType),
      ),
    deepDifferent,
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
  return props.noLabel ? (
    <TreeVSelect
      {...props}
      items={filteredItems}
      labelNode={undefined}
      inputId={undefined}
    />
  ) : (
    <LabeledTreeVSelect {...props} items={filteredItems} />
  );
}

export interface LabeledScripableVariableSelectProps
  extends Omit<TreeVariableSelectProps, 'value' | 'onChange'> {
  value?: IScript;
  onChange: (code: IScript) => void;
}

export interface ScripableVariableSelectProps
  extends LabeledScripableVariableSelectProps {
  labelNode?: React.ReactNode;
  inputId?: string;
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
    if (!props.value || !props.value.content) {
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
      <div className={cx(flex, flexRow, itemCenter)}>
        {props.labelNode}
        <Button
          icon={
            srcMode
              ? ['circle', { icon: 'code', color: 'white', size: 'xs' }]
              : 'code'
          }
          onClick={() => setSrcMode(sm => !sm)}
        />
      </div>
      {srcMode ? (
        <div className={scriptEditStyle}>
          <WegasScriptEditor
            value={script}
            returnType={computeReturnType(
              props.view.returnType,
              props.view.required,
            )}
            onChange={value =>
              props.onChange(
                props.value
                  ? { ...props.value, content: value }
                  : createScript(value),
              )
            }
            language="typescript"
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
          inputId={props.inputId}
          noLabel
        />
      )}
    </>
  );
}

export function LabeledScripableVariableSelect(
  props: LabeledScripableVariableSelectProps,
): JSX.Element {
  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ labelNode, inputId }) => (
          <ScripableVariableSelect
            {...props}
            labelNode={labelNode}
            inputId={inputId}
          />
        )}
      </Labeled>
    </CommonViewContainer>
  );
}
