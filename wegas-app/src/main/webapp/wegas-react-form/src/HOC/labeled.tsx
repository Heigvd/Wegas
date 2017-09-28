import React from 'react';
import { css } from 'glamor';
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
    view: {
        label?: string;
        [propName: string]: undefined | {};
    };
}
let id = 0;
function idGenerator() {
    const gid = ++id;
    return 'generated-label-id--' + gid;
}
export default function labeled<P extends { id: string }>(
    Comp: React.ComponentClass<P> | React.SFC<P>,
    cssContainer = '',
    suffixed = false
) {
    class Labeled extends React.Component<P & ILabelProps> {
        id: string;
        constructor(props: P & ILabelProps) {
            super(props);
            this.id = idGenerator();
        }
        render() {
            const props = this.props;

            if (suffixed) {
                return (
                    <div className={cssContainer}>
                        <Comp id={this.id} {...props} />
                        <label
                            htmlFor={this.id}
                            {...FormStyles.biggerLabelStyle}
                        >
                            {props.view.label}
                        </label>
                    </div>
                );
            }
            return (
                <div className={cssContainer}>
                    <label
                        htmlFor={this.id}
                        {...prefixedLabelStyle}
                        className={props.view.label ? `${labelTextStyle}` : ''}
                    >
                        {props.view.label}
                    </label>
                    <Comp id={this.id} {...props} />
                </div>
            );
        }
    }
    return Labeled;
}
