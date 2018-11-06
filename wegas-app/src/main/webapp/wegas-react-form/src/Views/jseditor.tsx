import * as React from 'react';
import commonView from '../HOC/commonView';
import labeled from '../HOC/labeled';
import JSEditor from '../Script/Views/asyncJSEditor';
import { debounce } from 'lodash-es';

class JSE extends React.Component<{
    id: string;
    value: string;
    view: { height?: string };
    onChange: (value: string) => void;
}> {
    onChangeDebounced: ((value: string) => void) & _.Cancelable;
    constructor(props: typeof JSE.prototype.props) {
        super(props);
        this.onChangeDebounced = debounce(this.onChange.bind(this), 200);
        this.flush = this.flush.bind(this);
    }
    onChange(value: string) {
        this.props.onChange(value);
    }
    componentWillUnmount() {
        this.flush();
    }
    flush() {
        this.onChangeDebounced.flush();
    }
    render() {
        const { id, value, view } = this.props;
        return (
            <div id={id}>
                <JSEditor
                    {...view}
                    width="100%"
                    minLines={3}
                    maxLines={10}
                    value={value}
                    onBlur={this.flush}
                    onChange={this.onChangeDebounced}
                />
            </div>
        );
    }
}

export default commonView(labeled(JSE));
