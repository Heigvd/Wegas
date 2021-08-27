import React from 'react';
import classnames from 'classnames';
import TreeSelect from '../../Components/tree/TreeSelect';
import Searchable from '../../Components/tree/searchable';
import { getY } from '../../index';
import { WidgetProps } from 'jsoninput/typings/types';
import { css } from 'glamor';
import { inputStyle } from '../string';

const separatorCss = css({ borderTop: 'solid 1px' });

const containerCss = css({
    color: '#6A95B6',
    position: 'relative',
    display: 'inline-block',
    marginTop: '1.25em',
});

const iconCss = css({
    color: 'black',
    fontSize: '85%',
    margin: '0 6px 0 3px',
});

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
});

const pathCss = css({
    position: 'absolute',
    fontSize: '75%',
    whiteSpace: 'nowrap',
    top: '-1.3em',
});

interface Item {
    label: string;
    value: string;
    selectable?: boolean;
    expanded?: boolean;
    className?: string;
    items?: Item[];
}

interface ITreeSelectProps extends WidgetProps.BaseProps {
    view: {
        selectable?: (item: Y.BaseCore) => boolean;
        additional: Item[];
        classFilter?: string | string[];
        readOnly?: boolean;
        openIfEmpty?: boolean;
        // maxLevel?: number;
        // root?: string;
        // selectableLevels?: number[];
    };

    value?: string;
}
const GameModelDS = getY().Wegas.Facade.GameModel.cache;
function defaultTrue(): true {
    return true;
}
function normalizeClassFilter(classFilter: string | string[] = []): string[] {
    if (typeof classFilter === 'string') {
        return [classFilter];
    }
    return classFilter;
}
function labelForVariable(name?: string) {
    const target = getY().Wegas.Facade.Variable.cache.find('name', name);
    return target ? target.getEditorLabel() : '';
}
function labelIconForVariable(name?: string) {
    const target = getY().Wegas.Facade.Variable.cache.find('name', name);
    if (target) {
        return <span className={`${target.getIconCss()} ${iconCss}`} />;
    }
    return '';
}

function match(item: Item, search: string) {
    return item.label.toLowerCase().indexOf(search.toLowerCase()) > -1;
}
function buildNamedPath(name?: string) {
    const variable = getY().Wegas.Facade.Variable.cache.find('name', name);
    const path: string[] = [];
    if (!variable) {
        return [];
    }
    let parent = variable.getParent();
    while (parent.get('@class') !== 'GameModel') {
        path.push(parent.get('name'));
        parent = parent.getParent();
    }
    return path.reverse();
}
function buildLabelPath(name?: string) {
    return buildNamedPath(name)
        .map(value => getY().Wegas.Facade.Variable.cache.find('name', value).getEditorLabel())
        .join(' \u21E8 ');
}

function genVarItems(
    items: Y.BaseCore[],
    selectableFn: (item: Y.BaseCore) => boolean = defaultTrue,
    classFilter: string[],
): Item[] {
    function mapItem(item: any) {
        const child = item.get('items')
            ? genVarItems(item.get('items'), selectableFn, classFilter)
            : undefined;
        let select = selectableFn(item);
        if (classFilter.length > 0 && !classFilter.includes(item.get('@class'))) {
            select = false;
        }
        return {
            label: item.getEditorLabel(),
            value: item.get('name'),
            selectable: select,
            items: child,
        };
    }
    return items
        .map(mapItem)
        .filter(i => !(i.value === undefined && (i.items === undefined || i.items.length === 0)));
}
/**
 * expand items as needed for a given value path.
 * Used to expand nodes
 *
 * @param items items which may be mutated
 * @param valuePath path of value to find in the items tree
 */
function expandAsNeeded(items: Item[] = [], valuePath: string[]) {
    const p = items.find(i => i.value === valuePath[0]);
    if (p !== undefined) {
        p.expanded = true;
        expandAsNeeded(p.items, valuePath.slice(1));
    }
}
/**
 * @returns {Array} items generated from variable and additional
 */
function genItems(props: ITreeSelectProps) {
    const path = buildNamedPath(props.value);
    const add = Array.isArray(props.view.additional)
        ? props.view.additional.map((i, index) => ({
              ...i,
              className: classnames(i.className, {
                  [separatorCss.toString()]: index === 0,
              }),
          }))
        : [];
    const items = genVarItems(
        GameModelDS.getCurrentGameModel().get('items').concat(),
        props.view.selectable,
        normalizeClassFilter(props.view.classFilter),
    ).concat(add);
    expandAsNeeded(items, path);
    return items;
}
class TreeVariableSelect extends React.Component<
    ITreeSelectProps,
    { search: string; searching: boolean }
> {
    public static defaultProps = {
        value: '',
    };
    tree: TreeSelect | null = null;
    items: Item[];
    constructor(props: ITreeSelectProps) {
        super(props);
        this.state = {
            search: '',
            searching: Boolean(props.view.openIfEmpty) && !props.value,
        };
        this.handleOnSelect = this.handleOnSelect.bind(this);
        this.items = genItems(props);
    }
    handleOnSelect(v: string) {
        this.setState(
            {
                searching: false,
                search: '',
            },
            () => this.props.onChange(v),
        );
    }
    componentWillReceiveProps(nextProps: ITreeSelectProps) {
        this.items = genItems(nextProps);
    }

    labelForAdditional(value?: string) {
        if (!Array.isArray(this.props.view.additional)) {
            return '';
        }
        const found = this.props.view.additional.find(i => i.value === value);
        if (found) {
            return found.label || value;
        }
        return '';
    }
    labelIconForAdditional(value?: string) {
        if (!value) {
            return <span className={`${iconCss}`} />;
        }
        return <span className={`${iconCss} fa fa-globe `} />;
    }
    render() {
        if (this.props.view.readOnly) {
            return (
                <div
                    className={`${containerCss}`}
                    onBlur={ev => {
                        const me = ev.currentTarget;
                        setTimeout(() => {
                            if (!me.contains(document.activeElement)) {
                                this.setState({ searching: false });
                            }
                        }, 20);
                    }}
                >
                    <div className={`${pathCss}`} title="Folder containing this variable">
                        {buildLabelPath(this.props.value)}
                    </div>
                    {labelIconForVariable(this.props.value) ||
                        this.labelIconForAdditional(this.props.value)}
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                        <input
                            {...inputStyle}
                            style={{
                                // Make input long enought.
                                minWidth:
                                    (
                                        labelForVariable(this.props.value) ||
                                        this.labelForAdditional(this.props.value)
                                    ).length /
                                        2 +
                                    'rem',
                            }}
                            value={
                                this.state.searching
                                    ? this.state.search
                                    : labelForVariable(this.props.value) ||
                                      this.labelForAdditional(this.props.value)
                            }
                            placeholder="Please select ..."
                            type="text"
                            readOnly
                        />
                    </div>
                </div>
            );
        } else {
            return (
                <div
                    className={`${containerCss}`}
                    onBlur={ev => {
                        const me = ev.currentTarget;
                        setTimeout(() => {
                            if (!me.contains(document.activeElement)) {
                                this.setState({ searching: false });
                            }
                        }, 20);
                    }}
                >
                    <div className={`${pathCss}`} title="Folder containing this variable">
                        {buildLabelPath(this.props.value)}
                    </div>
                    {labelIconForVariable(this.props.value) ||
                        this.labelIconForAdditional(this.props.value)}
                    <div style={{ display: 'inline-block', position: 'relative' }}>
                        <input
                            {...inputStyle}
                            style={{
                                // Make input long enought.
                                minWidth:
                                    (
                                        labelForVariable(this.props.value) ||
                                        this.labelForAdditional(this.props.value)
                                    ).length /
                                        2 +
                                    'rem',
                            }}
                            value={
                                this.state.searching
                                    ? this.state.search
                                    : labelForVariable(this.props.value) ||
                                      this.labelForAdditional(this.props.value)
                            }
                            placeholder="Please select ..."
                            type="text"
                            onFocus={() => this.setState({ searching: true })}
                            onChange={ev =>
                                this.setState({
                                    search: ev.target.value,
                                })
                            }
                            onKeyDown={e => {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (this.tree != null) {
                                        this.tree.focus();
                                    }
                                }
                            }}
                        />

                        {this.state.searching ? (
                            <div className={`${treeCss}`}>
                                <Searchable
                                    match={match}
                                    search={this.state.search}
                                    items={this.items}
                                    render={({ items }) => (
                                        <TreeSelect
                                            ref={n => (this.tree = n)}
                                            match={match}
                                            selected={this.props.value}
                                            items={items}
                                            search={this.state.search}
                                            onSelect={this.handleOnSelect}
                                        />
                                    )}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            );
        }
    }
}
export default TreeVariableSelect;
