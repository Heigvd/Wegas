import React, { PropTypes } from 'react';
import TreeSelect from '../../Components/tree/TreeSelect';
import { getY } from '../../index';

const variableFacade = getY().Wegas.Facade.Variable;
function defaultTrue() {
    return true;
}

function labelForVariable(name) {
    const target = getY().Wegas.Facade.Variable.cache.find('name', name);
    return target ? target.getEditorLabel() : '';
}

function match(item, search) {
    return item.label.toLowerCase().indexOf(search.toLowerCase()) > -1;
}

function buildPath(name) {
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

function genVarItems(items, selectableFn = defaultTrue) {
    return items.map(i => ({
        label: i.get('label'),
        value: selectableFn(i) ? i.get('name') : undefined,
        items: i.get('items') && genVarItems(i.get('items'), selectableFn)
    }));
}

class TreeVariableSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: labelForVariable(props.value) || this.labelForAdditional(props.value),
            searching: false
        };
        this.handleOnSelect = this.handleOnSelect.bind(this);
    }
    handleOnSelect(v) {
        this.setState({
            searching: false,
            search: labelForVariable(v) || this.labelForAdditional(v)
        }, () => this.props.onChange(v));
    }
    /**
     * @returns {Array} items generated from variable and additional
     */
    genItems() {
        return genVarItems(variableFacade.data.concat(),
            this.props.view.selectable)
            .concat(this.props.view.additional);
    }
    labelForAdditional(value) {
        const found = this.props.view.additional.find(i => i.value === value);
        if (found) {
            return found.label || value;
        }
        return '';
    }
    renderSearch() {
        if (this.state.searching) {
            return (
                <div style={{ position: 'absolute', top: 0, zIndex: 1000, backgroundColor: 'white', boxShadow: '0 2px 5px black', borderRadius: '3px' }}>
                    <input
                        ref={(n) => {
                            if (n) {
                                n.focus();
                            }
                        }}
                        value={this.state.search}
                        type="text"
                        onChange={ev => this.setState({
                            search: ev.target.value
                        })}
                    />
                    <TreeSelect
                        match={match}
                        selected={this.props.value}
                        items={this.genItems()}
                        search={this.state.search}
                        onSelect={this.handleOnSelect}
                    />
                </div>
            );
        }
        return null;
    }
    render() {
        return (
            <div style={{ position: 'relative' }}>
                <a
                    tabIndex="0"
                    onFocus={() => this.setState({
                        searching: true
                    })}
                >
                    <div style={{ fontSize: '75%', opacity: 0.5 }}>
                        {buildPath(this.props.value)} </div>
                    {labelForVariable(this.props.value) || this.labelForAdditional(this.props.value) || 'select...'}
                </a>
                {this.renderSearch()}
            </div>);
    }
}

TreeVariableSelect.propTypes = {
    view: PropTypes.shape({
        selectable: PropTypes.func,
        additional: PropTypes.arrayOf(PropTypes.shape(TreeSelect.propTypes.items))
    // maxLevel: PropTypes.number,
    // root: PropTypes.string,
    // classFilter: PropTypes.oneOfType([
    //     PropTypes.arrayOf(PropTypes.string),
    //     PropTypes.string
    // ]),
    // selectableLevels: PropTypes.arrayOf(PropTypes.number)
    }),
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};
TreeVariableSelect.defaultProps = {
    view: {
        additional: []
    }
};
export default TreeVariableSelect;
