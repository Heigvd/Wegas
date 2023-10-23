import React from 'react';
import { css, cx } from '@emotion/css';
import FormStyles from '../Views/form-styles';

const prefixedLabelStyle = css(FormStyles.biggerLabelStyle, {
    display: 'block',
});

const labelTextStyle = css({
    // Leave some space between label (if any) and following widget:
    paddingRight: '8px',
    whiteSpace: 'nowrap',
});

interface ILabelProps {
    editKey?: string;
    view: {
        /**
         * Using 'true' is usefull for additional{Properties,Items}
         */
        label?: string | boolean;
        [propName: string]: undefined | {};
    };
}
let id = 0;
function idGenerator() {
    const gid = ++id;
    return `generated-label-id--${  gid}`;
}
export default function labeled<P extends { id: string }>(
    Comp: React.ComponentClass<P> | React.FunctionComponent<P>,
    cssContainer = '',
    suffixed = false,
): React.ComponentClass<P & ILabelProps> {
    class Labeled extends React.Component<P & ILabelProps> {
        id: string;
        constructor(props: P & ILabelProps) {
            super(props);
            this.id = props.id || idGenerator();
        }
        render() {
            const props = this.props;
            const label = props.view.label === true ? props.editKey : props.view.label;
            if (suffixed) {
                return (
                    <div className={cssContainer}>
                        <Comp {...props} id={this.id} />
                        <label htmlFor={this.id} className={FormStyles.biggerLabelStyle}>
                            {label}
                        </label>
                    </div>
                );
            }
            return (
                <div className={cssContainer}>
                    <label
                        htmlFor={this.id}
                        className={cx({
                            [prefixedLabelStyle] : true,
                            [labelTextStyle]: !!label
                        })}
                    >
                        {label}
                    </label>
                    <Comp {...props} id={this.id} />
                </div>
            );
        }
    }
    return Labeled;
}
