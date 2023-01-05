import { css } from '@emotion/css';

// tslint:disable-next-line:no-namespace
export namespace FormStyles {
    export const labelColor: string = '#888'; // was bluish '#6A95B6';
    export const labelFontSize: string = '15px';
    export const labelBigFontSize: string = '15px'; // = labelFontSize * 115%

    export const unselectable = css({
        userSelect: 'none',
        cursor: 'default',
    });

    export const labelStyle = css(FormStyles.unselectable, {
        fontSize: FormStyles.labelFontSize,
        color: FormStyles.labelColor,
    });

    export const biggerLabelStyle = css(FormStyles.labelStyle, {
        fontSize: '115%',
        marginBottom: '3px',
    });

    export const disabled = css(FormStyles.unselectable, {
        color: 'darkslategrey',
        backgroundColor: 'lightgrey',
        border: '1px solid #BFBFBF',
        padding: '4px',
    });
}

export default FormStyles;
