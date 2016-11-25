import React from 'react';
import TreeNode from './TreeNode';
import HandleUpDown from './HandleUpDown';
import searchable from './searchable';
import style from './Tree.css';

function noop() {
}

class TreeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: props.items,
            selected: props.selected
        };
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        let state = {};
        if (this.props.items !== nextProps.items) {
            state = {
                ...state,
                items: nextProps.items
            };
        }
        if (this.props.selected !== nextProps.selected) {
            state = {
                ...state,
                selected: nextProps.selected
            };
        }
        this.setState(state);
    }
    handleInputChange(ev) {
        this.setState({
            search: ev.target.value
        });
    }
    render() {
        const onSelect = (v) => {
            this.setState({
                selected: v
            }, () => this.props.onSelect(this.state.selected));
        };
        const onChildChange = i => child => this.setState({
            items: [
                ...this.state.items.slice(0, i),
                child,
                ...this.state.items.slice(i + 1, this.state.items.length)
            ]
        });
        const items = this.state.items;
        return (
            <HandleUpDown selector={`.${style.treeHead}`}>
                {items.map((item, index) => (
                    <TreeNode
                        key={index}
                        {...item}
                        selected={this.state.selected}
                        onSelect={onSelect}
                        onChange={onChildChange(index)}
                    />
                 ))}
            </HandleUpDown>
        );
    }
}

TreeSelect.defaultProps = {
    onSelect: noop
};
export default searchable(TreeSelect);
