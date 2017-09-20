import React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import commonView from '../HOC/commonView';
import labeled from '../HOC/labeled';
import IconButton from '../Components/IconButton';
import Select from './select';
import { css } from 'glamor';

function filterChildren(
    properties: string[],
    children?: (
        | React.ComponentClass<{ editKey: string }>
        | React.SFC<{ editKey: string }>)[]
) {
    const child: React.ReactChild[] = [];
    React.Children.forEach(
        children,
        (c: React.ReactChild & { props: { editKey: string } }) => {
            if (properties.includes(c.props.editKey)) {
                child.push(c);
            }
        }
    );
    return child;
}
interface IKeyChoiceProps {
    id: string;
    view: {
        addKeyLabel?: string;
    };
}
function KeyChoice(props: WidgetProps.ObjectProps & IKeyChoiceProps) {
    const valueKeys = Object.keys(props.value || {});
    const keys = Object.keys(props.schema.properties || {}).filter(
        c => !valueKeys.includes(c)
    );
    return (
        <div>
            {filterChildren(
                valueKeys,
                props.children
            ).map((c: React.ReactElement<any>) => {
                return (
                    <div key={c.props.editKey}>
                        <IconButton
                            icon="fa fa-trash"
                            onClick={() => props.removeKey(c.props.editKey)}
                        />
                        <Select
                            id={props.id}
                            view={{
                                choices: keys.concat(c.props.editKey),
                                className: css({
                                    display: 'inline-block',
                                }).toString(),
                            }}
                            value={c.props.editKey}
                            onChange={(value: string) => {
                                const v = {
                                    ...props.value,
                                    [value]: undefined,
                                };
                                delete v[c.props.editKey];
                                props.onChange(v);
                            }}
                        />
                        {c}
                    </div>
                );
            })}
            <IconButton
                icon="fa fa-plus"
                onClick={() => props.addKey(keys[0])}
                label={props.view.addKeyLabel}
            />
        </div>
    );
}
export default commonView(labeled(KeyChoice));
