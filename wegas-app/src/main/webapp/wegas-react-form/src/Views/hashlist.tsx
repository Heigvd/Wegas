import React, { CSSProperties } from 'react';
import TextField from './string';
import commonView from '../HOC/commonView';
import ObjectView from './object';
import IconButton from '../Components/IconButton';
import { WidgetProps } from 'jsoninput/typings/types';
import { AddStatementButton } from '../Script/Views/Button';
import { css } from 'glamor';

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
type HashListProps = WidgetProps.ObjectProps<{ keyLabel?: string }> & {
    id: string;
    view: {
        readOnly: boolean;
    };
};
function Row({
    children,
    editKey,
    keyLabel = 'Key',
    readOnly,
    removeKey,
    alterKey,
}: {
    editKey: string;
    children: React.ReactChild;
    keyLabel?: string;
    readOnly: boolean;
    alterKey: WidgetProps.ObjectProps['alterKey'];
    removeKey: WidgetProps.ObjectProps['removeKey'];
}) {
    function remove() {
        removeKey(editKey);
    }

    function onKeyChange(value: string) {
        try {
            alterKey(editKey, value);
        } catch {
            // duplicate key
        }
    }
    return (
        <div {...flex}>
            <div style={{ position: 'relative', flex: 1 }}>
                <TextField
                    id={editKey}
                    value={editKey}
                    blurOnly
                    onChange={onKeyChange}
                    view={{
                        label: keyLabel,
                        style: halfWidth,
                        readOnly: readOnly,
                    }}
                />
                <div style={halfWidth}>{children}</div>
            </div>
            {!readOnly ? (
                <IconButton
                    icon="fa fa-trash"
                    tooltip="Remove property"
                    className={String(bottom)}
                    onClick={remove}
                />
            ) : null}
        </div>
    );
}
function HashlistView({
    id,
    removeKey,
    alterKey,
    children,
    addKey,
    ...restProps
}: HashListProps) {
    function addChild() {
        addKey(KEY_DEFAULT_VALUE, '');
    }

    const newChildren = React.Children.map(children, child => {
        const key = child.props.editKey;

        return (
            <Row
                key={child.key}
                editKey={key}
                readOnly={restProps.view.readOnly}
                alterKey={alterKey}
                removeKey={removeKey}
            >
                {child}
            </Row>
        );
    });
    return (
        <ObjectView {...restProps}>
            {newChildren}
            <br />
            {!restProps.view.readOnly ? (
                <AddStatementButton
                    key="newkeyadd"
                    icon="fa fa-plus-circle"
                    tooltip="Add property value"
                    label="Property"
                    onClick={addChild}
                />
            ) : null}
        </ObjectView>
    );
}

export default commonView(HashlistView);
