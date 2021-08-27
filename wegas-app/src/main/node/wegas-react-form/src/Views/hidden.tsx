import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';

type HiddenProps = WidgetProps & { schema: { const?: {} } };

class HiddenView extends React.Component<HiddenProps> {
    componentDidMount() {
        this.checkConst();
    }
    componentDidUpdate() {
        this.checkConst();
    }
    checkConst() {
        if ('const' in this.props.schema && this.props.schema.const !== this.props.value) {
            this.props.onChange(this.props.schema.const);
        }
    }
    render() {
        return null;
    }
}

export default HiddenView;
