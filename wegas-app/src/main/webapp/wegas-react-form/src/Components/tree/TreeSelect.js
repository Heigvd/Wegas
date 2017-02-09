import React, { PropTypes } from 'react';
import TreeNode from './TreeNode';
import HandleUpDown from './HandleUpDown';
import searchable from './searchable';
import style from './Tree.css';

class TreeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: props.items,
            selected: props.selected
        };
        this.onSelect = this.onSelect.bind(this);
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
    onSelect(v) {
        this.setState({
            selected: v
        }, () => this.props.onSelect(this.state.selected));
    }
    onChildChange(i) {
        return child => this.setState({
            items: [
                ...this.state.items.slice(0, i),
                child,
                ...this.state.items.slice(i + 1, this.state.items.length)
            ]
        });
    }
    render() {
        const items = this.state.items;
        return (
            <HandleUpDown selector={`.${style.treeHead}`}>
                {items.map((item, index) => (
                    <TreeNode
                        key={index}
                        {...item}
                        selected={this.state.selected}
                        onSelect={this.onSelect}
                        onChange={this.onChildChange(index)}
                    />
                 ))}
            </HandleUpDown>);
    }
}

TreeSelect.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.string
    })).isRequired,
    selected: PropTypes.string,
    onSelect: PropTypes.func.isRequired
};
export default searchable(TreeSelect);
