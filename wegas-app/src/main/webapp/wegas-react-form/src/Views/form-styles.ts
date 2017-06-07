import { css } from 'glamor';

export namespace FormStyles {

    export const defaultEditorWidth: string = '30em';
    export const textInputWidth: string = '30em';
    export const textareaWidth: string = '30em';

    export const labelColor: string = '#6A95B6';
    export const labelFontSize: string = '15px';
    export const labelBigFontSize: string = '16px'; // = labelFontSize * 125%

    export const unselectable = css({
        userSelect: 'none',
        cursor: 'default'
    });

    export const labelStyle = css(
        FormStyles.unselectable,
        {
            fontSize: FormStyles.labelFontSize,
            color: FormStyles.labelColor,
        }
    )
}

export default FormStyles;
