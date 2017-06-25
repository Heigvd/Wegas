import React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';

function HiddenView(props: WidgetProps & { schema: { const?: {} } }) {
    if ('const' in props.schema && props.schema.const !== props.value) {
        props.onChange(props.schema.const);
    }
    return <noscript />; // Could be null, but Typescript doesn't allow it.
}

export default HiddenView;
