import React, { PropTypes } from 'react';
import Popover from '../../Components/Popover';
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
    function mapItem(item) {
        return {
            label: item.get('label'),
            value: selectableFn(item) ? item.get('name') : undefined,
            items: item.get('items') && genVarItems(item.get('items'), selectableFn)
        };
    }
    return items.map(mapItem);
}

class TreeVariableSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: labelForVariable(props.value) || this.labelForAdditional(props.value),
            searching: !props.value
        };
        this.handleOnSelect = this.handleOnSelect.bind(this);
        this.items = this.genItems();
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
    render() {
        return (
            <div>
                <Popover
                    show={this.state.searching}
                    onClickOutside={() => this.setState({ searching: false })}
                >
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
                    <div
                        style={{
                            padding: '5px 10px',
                            backgroundColor: 'white',
                            boxShadow: '0 2px 5px black',
                            borderRadius: '3px'
                        }}
                    >
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
                    tabIndex="0"
                    onFocus={() => this.setState({
                        searching: true
                    })}
                >
                    <div style={{ fontSize: '75%', opacity: 0.5 }}>
                        {buildPath(this.props.value)} </div>
                    {labelForVariable(this.props.value) || this.labelForAdditional(this.props.value) || 'select...'}
                </a>
            </div>
        );
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
