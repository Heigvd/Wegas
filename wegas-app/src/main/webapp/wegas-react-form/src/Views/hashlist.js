import PropTypes from 'prop-types';
import React from 'react';
import TextField from './string';
import commonView from '../HOC/commonView';
import ObjectView from './object';
import IconButton from '../Components/IconButton';

const halfWidth = {
    display: 'inline-block',
    position: 'relative',
    width: '50%'
};
const minusStyle = {
    float: 'left',
    marginTop: '12px'
};
class HashlistView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            newInputValue: ''
        };
        this.child = [];
        this.addChild = this.addChild.bind(this);
        this.onAdderChange = this.onAdderChange.bind(this);
    }
    onAdderChange(value) {
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
            this.child[newInputValue].querySelector('input').focus();
        }, 20);
    }
    render() {
        const { removeKey, alterKey, children, ...restProps } = this.props;
        const newChildren = React.Children.map(children, child => {
            function remove() {
                removeKey(child.props.editKey);
            }

            function onKeyChange(value) {
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
                                this.child[child.props.editKey] = node;
                            }}
                        >
                            {child}
                        </div>
                    </div>
                </div>
            );
        });

        return (
            <ObjectView {...restProps}>
                {newChildren}
                <TextField
                    key="newkeyinput"
                    value={this.state.newInputValue}
                    onChange={this.onAdderChange}
                    view={{
                        label: this.props.view.keyLabel || 'Key',
                        style: halfWidth
                    }}
                />
                <IconButton
                    key="newkeyadd"
                    icon="fa fa-plus-circle"
                    tooltip="Add property value"
                    onClick={this.addChild}
                />
            </ObjectView>
        );
    }
}
HashlistView.propTypes = {
    addKey: PropTypes.func.isRequired,
    removeKey: PropTypes.func.isRequired,
    alterKey: PropTypes.func.isRequired,
    children: PropTypes.node,
    view: PropTypes.shape({
        keyLabel: PropTypes.string
    })
};
export default commonView(HashlistView);
