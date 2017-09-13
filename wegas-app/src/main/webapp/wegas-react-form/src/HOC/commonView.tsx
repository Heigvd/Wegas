import React, { CSSProperties } from 'react';
import { css } from 'glamor';
import classNames from 'classnames';
import FormStyles from '../Views/form-styles';

const containerStyle = css({
    label: 'commonView-containerStyle',
    position: 'relative',
    marginTop: '0.8em',
    maxWidth: '600px'
});

const extraShortStyle = css({
    maxWidth: '5em'
});

const shortStyle = css({
    maxWidth: '10em'
});

const shortInlineStyle = css(
    {
        display: 'inline-block',
        marginRight: '4em',
        verticalAlign: 'top'
    },
    shortStyle
);

const shortNumberStyle = css(
    {
        label: 'commonView shortNumberStyle',
        width: '75px'
    }
);

const longStyle = css({
    maxWidth: FormStyles.defaultEditorWidth
});

const infoStyle = css(FormStyles.unselectable, {
    color: '#99a6b2',
    fontSize: '10px',
    fontStyle: 'italic'
});

const errorStyle = css({
    color: 'darkorange',
    fontSize: '75%',
    fontStyle: 'italic',
    float: 'left'
});

// Used e.g. inside "Choices" (answers to questions):
const borderTopStyle = css({
    borderTop: '2px solid #6a95b6',
    paddingTop: '1em',
    width: FormStyles.defaultEditorWidth
});

const indentStyle = css({
    marginLeft: '22px !important'
});

interface ICommonViewProps {
    errorMessage?: string[];
    schema?: {
        type?: string;
    };
    view: {
        description?: string;
        className?: string;
        style?: CSSProperties;
        layout?: string;
        borderTop?: boolean;
        indent?: boolean;
        [propName: string]: undefined | {};
    };
}
export default function commonView<E>(
    Comp: React.SFC<E> | React.ComponentClass<E>
): React.SFC<E & ICommonViewProps> {
    function CommonView(props: E & ICommonViewProps) {
        const { errorMessage = [], view = {} } = props;
        const errors = errorMessage.map(v =>
            <span key={v}>
                {v}
            </span>
        );
        const layout = view.layout,
              schema = props.schema;
        const isLiteralNumberInput = layout === undefined && schema && schema.type === 'number';
        return (
            <div
                className={classNames(view.className, `${containerStyle}`, {
                    [`${shortNumberStyle}`]: isLiteralNumberInput === true,
                    [`${shortStyle}`]: layout === 'short',
                    [`${shortInlineStyle}`]: layout === 'shortInline',
                    [`${longStyle}`]: layout === 'long',
                    [`${extraShortStyle}`]: layout === 'extraShort',
                    [`${borderTopStyle}`]: view.borderTop,
                    [`${indentStyle}`]: view.indent
                })}
                style={view.style}
            >
                <Comp {...props} />
                <div className={infoStyle.toString()}>
                    {view.description}
                </div>
                <div className={errorStyle.toString()}>
                    {errors}
                </div>
            </div>
        );
    }
    return CommonView;
}
