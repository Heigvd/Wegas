import React, {CSSProperties} from 'react';
import TextField from './string';
import commonView from '../HOC/commonView';
import ObjectView from './object';
import IconButton from '../Components/IconButton';
import {WidgetProps} from 'jsoninput/typings/types';
import {AddStatementButton} from '../Script/Views/Button';
import {css} from 'glamor';

const KEY_DEFAULT_VALUE = '';
const halfWidth: CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    width: '50%',
};
const flex = css({
    display: 'flex',
    flexDirection: 'row',
});
const bottom = css({
    alignSelf: 'flex-end',
});
type HashListProps = WidgetProps.ObjectProps<{keyLabel?: string}> & {
    id: string;
    view: {
        readOnly: boolean;
    };
};
class HashlistView extends React.Component<
    HashListProps,
    {newInputValue: string}
    > {
    child: {[key: string]: HTMLElement};
    constructor(props: HashListProps) {
        super(props);
        this.state = {
            newInputValue: '',
        };
        this.child = {};
        this.addChild = this.addChild.bind(this);
    }
    addChild() {
        this.props.addKey(KEY_DEFAULT_VALUE, '');

        setTimeout(() => {
            const input = this.child[KEY_DEFAULT_VALUE].querySelector('input');
            if (input !== null) {
                input.focus();
            }
        }, 20);
    }
    render() {
        const {id, removeKey, alterKey, children, ...restProps} = this.props;
        const newChildren = React.Children.map(children, child => {
            const c = child as React.ReactElement<{editKey: string; schema : {view: {label: string}}}>;
            function remove() {
                removeKey(c.props.editKey);
            }

            function onKeyChange(value: string) {
                try {
                    alterKey(c.props.editKey, value);
                } catch (_) {
                    // duplicate key
                }
            }
            const readOnly = restProps.view.readOnly;

            return (
                <div {...flex} key={c.props.editKey}>
                    <div
                        style={{position: 'relative', flex: 1}}
                        ref={node => {
                            if (node !== null) {
                                this.child[c.props.editKey] = node;
                            }
                        }}
                    >
                        <TextField
                            id={id}
                            value={c.props.editKey}
                            blurOnly
                            onChange={onKeyChange}
                            view={{
                                label: this.props.view.keyLabel || 'Key',
                                style: halfWidth,
                                readOnly: readOnly
                            }}
                        />
                        <div style={halfWidth}>{child}</div>
                    </div>
                    {!readOnly ?
                        <IconButton
                            icon="fa fa-trash"
                            tooltip="Remove property"
                            className={String(bottom)}
                            onClick={remove}
                        />
                        : null}
                </div>
            );
        });
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
            <ObjectView {...restProps as any}>
                {newChildren}
                <br />
                {!this.props.view.readOnly ?
                    <AddStatementButton
                        key="newkeyadd"
                        icon="fa fa-plus-circle"
                        tooltip="Add property value"
                        label="Property"
                        onClick={this.addChild}
                    />
                    : null}
            </ObjectView>
        );
    }
}
export default commonView(HashlistView);
