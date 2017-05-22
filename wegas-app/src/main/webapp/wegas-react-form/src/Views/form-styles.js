import React from 'react';
import { css } from 'glamor';

export default class FormStyles {}

FormStyles.textInputWidth = '33em';
FormStyles.textareaWidth = '30em';

FormStyles.labelColor = '#6A95B6';
FormStyles.labelFontSize = '15px';

FormStyles.unselectable = css({
    userSelect: 'none',
    cursor: 'default'
});

FormStyles.labelStyle = css(
    FormStyles.unselectable,
    {
        fontSize: FormStyles.labelFontSize,
        color: FormStyles.labelColor,
    }
);

Object.freeze(FormStyles);
