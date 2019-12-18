import * as React from 'react';
import { SearchableItems } from '../Tree/searchable';
import { TreeSelect } from '../Tree/TreeSelect';
import { WidgetProps } from 'jsoninput/typings/types';
import { StoreConsumer } from '../../../data/store';
import { varIsList } from '../../../data/entities';
import { VariableDescriptor, GameModel } from '../../../data/selectors';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { CommonViewContainer, CommonView } from './commonView';
import { LabeledView, Labeled } from './labeled';
import { inputStyle } from './String';
import { css } from 'emotion';

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

interface Item {
  label: string;
  value: string;
  selectable: boolean;
  items?: Item[];
  className?: string;
}
function genVarItems(
  items: number[],
  selectableFn: (item: IVariableDescriptor) => boolean = () => true,
  classFilter: string[] = [],
): Item[] {
  function mapItem(i: number): Item {
    const item = VariableDescriptor.select(i)!;
    const child = varIsList(item)
      ? genVarItems(item.itemsIds, selectableFn, classFilter)
      : undefined;
    let select = selectableFn(item);
    if (classFilter.length > 0 && !classFilter.includes(item['@class'])) {
      select = false;
    }
    return {
      label: editorLabel(item),
      value: item.name!,
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
function getItems(
  items: Item[],
  key: keyof Item,
  val: any,
  limit: number = Infinity,
) {
  let ret: Item[] = [];
  for (const item of items) {
    if (item[key] === val) {
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
function labelForValue(items: Item[], value?: string) {
  if (value != null) {
    const i = getItems(items, 'value', value, 1);
    if (i.length > 0) {
      return i[0].label;
    }
  }
  return '';
}
interface TreeVariableSelectProps
  extends WidgetProps.BaseProps<
    CommonView &
      LabeledView & { items?: Item[]; classFilter?: WegasClassNames[] }
  > {
  value?: string;
}
export class TreeVSelect extends React.Component<
  TreeVariableSelectProps & { items: Item[] },
  { search: string; searching: boolean }
> {
  state = {
    searching: false,
    search: '',
  };
  handleOnSelect = (value: string) => {
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
              <input
                type="text"
                className={inputStyle}
                id={inputId}
                value={
                  this.state.searching
                    ? this.state.search || ''
                    : labelForValue(this.props.items, this.props.value)
                }
                onChange={this.handleSearch}
                onFocus={this.inputFocus}
                readOnly={this.props.view.readOnly}
                autoComplete="off"
              />
              {this.state.searching && (
                <div className={treeCss}>
                  <SearchableItems
                    match={(item, s) => {
                      return item.label.toLowerCase().includes(s.toLowerCase());
                    }}
                    search={this.state.search}
                    items={this.props.items}
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

export function TreeVariableSelect(
  props: TreeVariableSelectProps,
): JSX.Element {
  return (
    <StoreConsumer<{ items: number[] }>
      selector={() => ({ items: GameModel.selectCurrent().itemsIds, props })}
    >
      {({ state }) => {
        const items = genVarItems(
          state.items,
          undefined,
          props.view.classFilter,
        ).concat(props.view.items || []);
        return <TreeVSelect {...props} items={items} />;
      }}
    </StoreConsumer>
  );
}
