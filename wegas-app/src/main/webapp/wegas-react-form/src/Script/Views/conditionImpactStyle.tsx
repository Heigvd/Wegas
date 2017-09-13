import { css } from 'glamor';

export const containerStyle = css({
    label: 'conditionImpactStyle',
    display: 'inline-block',
    verticalAlign: 'middle',
    '& input[type="checkbox"]': {
        marginLeft: '10px',
        verticalAlign: 'middle'
    }
});
