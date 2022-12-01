import * as React from 'react';
import TreeNode, { treeHeadStyle } from './TreeNode';
import HandleUpDown from './HandleUpDown';

interface Item {
    label: string;
    value: string;
    selectable?: boolean;
    className?: string;
    items?: Item[];
}
interface TreeSelectProps {
    items: Item[];
    search: string;
    match: (item: Item, search: string) => boolean;
    selected?: string;
    onSelect: (item: string) => void;
}
class TreeSelect extends React.Component<TreeSelectProps, { items: Item[]; selected?: string }> {
    keyHandler: HandleUpDown | null = null;
    constructor(props: TreeSelectProps) {
        super(props);
        this.state = {
            items: props.items,
            selected: props.selected,
        };
        this.onSelect = this.onSelect.bind(this);
        this.onChildChange = this.onChildChange.bind(this);
    }
    componentWillReceiveProps(nextProps: TreeSelectProps) {
        let state = {};
        if (this.props.items !== nextProps.items) {
            state = {
                ...state,
                items: nextProps.items,
            };
        }
        if (this.props.selected !== nextProps.selected) {
            state = {
                ...state,
                selected: nextProps.selected,
            };
        }
        this.setState(state);
    }
    onSelect(v: string) {
        this.setState(
            {
                selected: v,
            },
            () => this.props.onSelect(this.state.selected!),
        );
    }
    onChildChange(i: number) {
        return (child: Item) =>
            this.setState({
                items: [
                    ...this.state.items.slice(0, i),
                    child,
                    ...this.state.items.slice(i + 1, this.state.items.length),
                ],
            });
    }
    focus() {
        if (this.keyHandler != null) {
            this.keyHandler.focus(1);
        }
    }
    render() {
        return (
            <HandleUpDown
                ref={n => (this.keyHandler = n)}
                selector={'.' + treeHeadStyle.toString()}
            >
                {[
                    this.state.items.map((item, index) => (
                        <TreeNode
                            key={item.value}
                            {...item}
                            selected={this.state.selected}
                            onSelect={this.onSelect}
                            onChange={this.onChildChange(index)}
                        />
                    )),
                ]}
            </HandleUpDown>
        );
    }
}
// function SearchTree(props: TreeSelectProps) {
//     return (
//         <Searchable
//             items={props.items}
//             match={p]rops.match}
//             search={props.search}
//             render={({ items }) => <TreeSelect ref={props.treeRef} {...props} items={items} />}
//         />
//     );
// }

export default TreeSelect;
