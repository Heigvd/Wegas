import React from 'react';
import classnames from 'classnames';
import Popover from '../../Components/Popover';
import TreeSelect from '../../Components/tree/TreeSelect';
import { getY } from '../../index';
import { WidgetProps } from "jsoninput/typings/types";
import { css } from "glamor";

const separatorCss = css({ borderTop: "solid 1px" });

const containerCss = css({
    color: '#6A95B6',
    display: 'inline-block',
    marginTop: '1.5em'
});

const iconCss = css({
    color: 'black',
    fontSize: '85%'
});

const treeCss = css({
    padding: '5px 10px',
    backgroundColor: 'white',
    boxShadow: '0 2px 5px black',
    borderRadius: '3px',
    width: 'auto'
});

const selectorLinkCss = css({
    position: 'relative',
    marginRight: '1em'
});

const pathCss = css({
    position: 'absolute',
    fontSize: '75%',
    whiteSpace: 'nowrap',
    bottom: '150%'
});

const labelCss = css({
    color: 'black'
});


type Item = {
    label: string;
    value?: string;
    className?: string;
    items?: Item[];
}

interface ITreeSelectProps extends WidgetProps.BaseProps {
    view: {
        selectable?: (item: Y.BaseCore) => boolean;
        additional: Item[];
        classFilter?: string | string[];
        // maxLevel?: number;
        // root?: string;
        // selectableLevels?: number[];
    };

    value?: string;
}
const variableFacade = getY().Wegas.Facade.Variable;
function defaultTrue() {
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
        return (
            <span className={`${labelCss}`}>
                <span className={`${target.getIconCss()} ${iconCss}`} />
                {' '}
                {target.getEditorLabel()}
            </span>
        );
    }
    return '';
}

function match(item: Item, search: string) {
    return item.label.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function buildPath(name?: string) {
    const variable = getY().Wegas.Facade.Variable.cache.find('name', name);
    const path = [];
    if (!variable) {
        return null;
    }
    let parent = variable.parentDescriptor;
    while (parent) {
        path.push(parent.getEditorLabel());
        parent = parent.parentDescriptor;
    }
    return path.reverse().join(' \u21E8 ');
}

function genVarItems(
    items: Y.BaseCore[],
    selectableFn: (item: Y.BaseCore) => boolean = defaultTrue,
    classFilter: string[]
): Item[] {
    function mapItem(item: Y.BaseCore) {
        const child = item.get('items') ?
            genVarItems(item.get('items'), selectableFn, classFilter) : undefined;
        let select = selectableFn(item);
        if (classFilter.length > 0 && !classFilter.includes(item.get('@class'))) {
            select = false;
        }
        return {
            label: item.get('label'),
            value: select ? item.get('name') : undefined,
            items: child
        };
    }
    return items.map(mapItem)
        .filter(i => !(i.value === undefined && (i.items === undefined || i.items.length === 0)));
}

class TreeVariableSelect extends React.Component<ITreeSelectProps, { search: string, searching: boolean }> {
    public static defaultProps = {
        value: ''
    };
    items: Item[];
    constructor(props: ITreeSelectProps) {
        super(props);
        this.state = {
            search: labelForVariable(props.value) ||
            this.labelForAdditional(props.value),
            searching: !props.value
        };
        this.handleOnSelect = this.handleOnSelect.bind(this);
        this.items = this.genItems();
    }
    handleOnSelect(v: string) {
        this.setState(
            {
                searching: false,
                search: labelForVariable(v) || this.labelForAdditional(v)
            },
            () => this.props.onChange(v)
        );
    }
    /**
     * @returns {Array} items generated from variable and additional
     */
    genItems() {
        const add = Array.isArray(this.props.view.additional)
            ? this.props.view.additional.map((i, index) => ({
                ...i,
                className: classnames(i.className, { [separatorCss.toString()]: index === 0 })
            }))
            : [];
        return genVarItems(
            variableFacade.data.concat(),
            this.props.view.selectable,
            normalizeClassFilter(this.props.view.classFilter)
        ).concat(add);
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
        const label = this.labelForAdditional(value);
        if (label) {
            return (
                <span>
                    <span className={`${iconCss} fa fa-globe `} /> {label}
                </span>
            );
        }
        return '';
    }
    render() {
        return (
            <div className={`${containerCss}`}>
                <Popover
                    show={this.state.searching}
                    onClickOutside={() =>
                        this.setState({
                            searching: false,
                            search: labelForVariable(this.props.value) ||
                            this.labelForAdditional(this.props.value) // Reset search
                        })}
                >
                    <input
                        ref={n => {
                            if (n) {
                                setTimeout(() => n.focus(), 50);
                            }
                        }}
                        value={this.state.search}
                        type="text"
                        onChange={ev =>
                            this.setState({
                                search: ev.target.value
                            })}
                    />
                    <div className={`${treeCss}`}>
                        <TreeSelect
                            match={match}
                            selected={this.props.value}
                            items={this.items}
                            search={this.state.search}
                            onSelect={this.handleOnSelect}
                        />
                    </div>
                </Popover>
                <a
                    tabIndex={0}
                    onFocus={() =>
                        this.setState({
                            searching: true
                        })}
                    className={`${selectorLinkCss}`}
                >
                    <div className={`${pathCss}`}>
                        {buildPath(this.props.value)}
                    </div>
                    {labelIconForVariable(this.props.value) ||
                        this.labelIconForAdditional(this.props.value) ||
                        'please select...'}
                </a>
            </div>
        );
    }
}


export default TreeVariableSelect;
