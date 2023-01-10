import React, { CSSProperties } from 'react';
import { css } from '@emotion/css';
import classNames from 'classnames';
import FormStyles from '../Views/form-styles';

const containerStyle = css({
    label: 'commonView-containerStyle',
    position: 'relative',
    marginTop: '0.8em',
    clear: 'both',
});

const extraShortStyle = css({
    maxWidth: '5em',
});

const shortStyle = css({
    maxWidth: '11em',
});

const shortInlineStyle = css(
    {
        display: 'inline-block',
        marginRight: '2em',
    },
    shortStyle,
);
const extraShortInline = css(shortInlineStyle, extraShortStyle);
const shortNumberStyle = css({
    label: 'commonView shortNumberStyle',
    width: '75px',
});

const longStyle = css({
    width: '100%',
});

export const infoStyle = css(FormStyles.unselectable, {
    color: '#99a6b2',
    fontSize: '10px',
    fontStyle: 'italic',
});

const errorStyle = css({
    color: 'darkorange',
    fontSize: '75%',
    fontStyle: 'italic',
    float: 'left',
});

const borderTopStyle = css({
    borderTop: '3px solid #6aacf1',
    paddingTop: '0.5em',
    marginTop: '1em',
});

const indentStyle = css({
    label: 'commonView indentStyle',
    marginLeft: '44px !important',
});

interface ICommonViewProps {
    errorMessage?: string[];
    schema?: {
        type?: string | string[];
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
const nullRx = /null,|,null/;
export default function commonView<E>(
    Comp: React.ComponentType<E & ICommonViewProps>,
): React.FunctionComponent<E & ICommonViewProps> {
    function CommonView(props: E & ICommonViewProps) {
        const { errorMessage = [], view = {} } = props;
        const errors = errorMessage.map(v => {
            const cleanError = v.replace(nullRx, '');
            return <span key={v}>{cleanError}</span>;
        });
        const { layout } = view;
        const { schema } = props;
        const isLiteralNumberInput = layout === undefined && schema && schema.type === 'number';
        return (
            <div
                className={classNames(view.className, `${containerStyle}`, {
                    [`${shortNumberStyle}`]: isLiteralNumberInput === true,
                    [`${shortStyle}`]: layout === 'short',
                    [`${shortInlineStyle}`]: layout === 'shortInline',
                    [`${longStyle}`]: layout === 'long',
                    [`${extraShortStyle}`]: layout === 'extraShort',
                    [`${extraShortInline}`]: layout === 'extraShortInline',
                    [`${borderTopStyle}`]: view.borderTop,
                    hasBorderTop: view.borderTop,
                    [`${indentStyle}`]: view.indent,
                })}
                style={view.style}
            >
                <Comp {...props} />
                <div className={infoStyle.toString()}>{view.description}</div>
                <div className={errorStyle.toString()}>{errors}</div>
            </div>
        );
    }
    return CommonView;
}
