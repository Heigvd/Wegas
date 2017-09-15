import React, { CSSProperties } from 'react';
import TextField from './string';
import commonView from '../HOC/commonView';
import ObjectView from './object';
import IconButton from '../Components/IconButton';
import { WidgetProps } from 'jsoninput/typings/types';
import { AddStatementButton } from '../Script/Views/Button';

const halfWidth: CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    width: '50%'
};
type HashListProps = WidgetProps.ObjectProps & { id: string };
class HashlistView extends React.Component<
    HashListProps,
    { newInputValue: string }
> {
    child: { [key: string]: HTMLElement };
    constructor(props: HashListProps) {
        super(props);
        this.state = {
            newInputValue: ''
        };
        this.child = {};
        this.addChild = this.addChild.bind(this);
        this.onAdderChange = this.onAdderChange.bind(this);
    }
    onAdderChange(value: string) {
        this.setState({
            newInputValue: value
        });
    }
    addChild() {
        const newInputValue = this.state.newInputValue;
        this.setState({
            newInputValue: ''
        });
        this.props.addKey(newInputValue);
        setTimeout(() => {
            const input = this.child[newInputValue].querySelector('input');
            if (input !== null) {
                input.focus();
            }
        }, 20);
    }
    render() {
        const { id, removeKey, alterKey, children, ...restProps } = this.props;
        const newChildren = React.Children.map(
            children,
            (child: React.ReactElement<any>) => {
                function remove() {
                    removeKey(child.props.editKey);
                }

                function onKeyChange(value: string) {
                    alterKey(child.props.editKey, value);
                }

                return (
                    <div key={child.props.editKey}>
                        <IconButton
                            icon="fa fa-trash"
                            tooltip="Remove property"
                            onClick={remove}
                        />
                        <div style={{ position: 'relative' }}>
                            <TextField
                                id={id}
                                value={child.props.editKey}
                                onChange={onKeyChange}
                                view={{
                                    label: this.props.view.keyLabel || 'Key',
                                    style: halfWidth
                                }}
                            />
                            <div
                                style={halfWidth}
                                ref={node => {
                                    if (node !== null) {
                                        this.child[child.props.editKey] = node;
                                    }
                                }}
                            >
                                {child}
                            </div>
                        </div>
                    </div>
                );
            }
        );
        /*
        <TextField
            id={id}
            key="newkeyinput"
            value={this.state.newInputValue}
            onChange={this.onAdderChange}
            view={{
                label: this.props.view.keyLabel || 'Key',
                style: halfWidth
            }}
        />
        */

        return (
            <ObjectView {...restProps}>
                {newChildren}
                <br/>
                <AddStatementButton
                    key="newkeyadd"
                    icon="fa fa-plus-circle"
                    tooltip="Add property value"
                    label="Property"
                    onClick={this.addChild}
                />
            </ObjectView>
        );
    }
}
export default commonView(HashlistView);
