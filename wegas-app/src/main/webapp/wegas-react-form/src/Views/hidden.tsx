import { WidgetProps } from 'jsoninput/typings/types';

function HiddenView(props: WidgetProps & { schema: { const?: {} } }) {
    if ('const' in props.schema && props.schema.const !== props.value) {
        props.onChange(props.schema.const);
    }
    return null;
}

export default HiddenView;
