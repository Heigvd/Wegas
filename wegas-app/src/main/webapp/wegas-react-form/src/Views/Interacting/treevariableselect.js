import React, { PropTypes } from 'react';
import TreeSelect from '../../Components/tree/TreeSelect';
import { getY } from '../../index';

const variableFacade = getY().Wegas.Facade.Variable;
function labelForVariable(name) {
    const target = getY().Wegas.Facade.Variable.cache.find('name', name);
    return target ? target.get('label') : '';
}

function genItems(items) {
    return items.map(i => ({
        label: i.get('label'),
        value: i.get('name'),
        items: i.get('items') && genItems(i.get('items'))
    }));
}

class TreeVariableSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: labelForVariable(props.value),
            searching: false
        };
    }
    renderSearch() {
        if (this.state.searching) {
            return (
                <div style={{ position: 'absolute', top: 0, zIndex: 1000, backgroundColor: 'white', boxShadow: '0 2px 5px black' }}>
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
                        match={function match(item, search) {
                            return item.label.toLowerCase().indexOf(search.toLowerCase()) > -1;
                        }}
                        selected={this.props.value}
                        items={genItems(variableFacade.data.concat())}
                        search={this.state.search}
                        onSelect={(v) => {
                            this.setState({
                                searching: false,
                                search: labelForVariable(v)
                            }, () => this.props.onChange(v));
                        }}
                    />
                </div>
            );
        }
        return null;
    }
    render() {
        const variable = variableFacade.cache.find('name', this.props.value);
        return (
            <div style={{ position: 'relative' }}>
                <input
                    value={(variable && variable.get('label')) || 'select...'}
                    tabIndex="0"
                    onFocus={() => this.setState({
                        searching: true
                    })}
                    onChange={() => {}}
                />
                {this.renderSearch()}
            </div>);
    }
}

TreeVariableSelect.propTypes = {
    view: PropTypes.shape({
        maxLevel: PropTypes.number,
        root: PropTypes.string,
        classFilter: PropTypes.oneOfType([
            PropTypes.arrayOf(PropTypes.string),
            PropTypes.string
        ]),
        selectableLevels: PropTypes.arrayOf(PropTypes.number)
    }),
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired
};
export default TreeVariableSelect;
