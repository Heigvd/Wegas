import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import FormStyles from '../Views/form-styles';
import commonView from '../HOC/commonView';
import validator from './validator';
/**
 * HOC Handle Wegas' script object
 * @param {React.Component} Comp Component to augment
 */

const labelStyle = css(FormStyles.labelStyle, {
    margin: '8px 2px 15px 0',
    verticalAlign: '2px',
    display: 'inline-block',
});
const warnStyle = css({
    color: 'orange',
    verticalAlign: '+2px',
    padding: '0 10px', // Create plenty of space for facilitating the hover
});
const containerStyle = css({
    marginTop: '15px',
    maxWidth: '100%',
    '& > div': {
        display: 'inline', // Have the "view source" icon displayed to the right of the section title
    },
});
function renderLabel(label) {
    if (label) {
        return <span className={labelStyle}>{label}</span>;
    }
    return null;
}
function scriptObject(Comp) {
    const CommonComp = commonView(Comp);
    /**
     * @template Script
     * @param {{value:Script,onChange:(script:Script)=>void, view:Object}} props Component's props
     */
    function ScriptObject(props) {
        const { value, onChange, view } = props;
        const val = value || { content: '' };
        let warn;
        try {
            warn = validator(val.content).join('\n');
        } catch (e) {
            // There was an error. certainly a parse error.
            // It's handled elsewhere
            warn = '';
        }
        return (
            <div className={containerStyle}>
                {renderLabel(view.label)}
                {warn.length ? (
                    <span
                        {...warnStyle}
                        className="fa fa-warning"
                        title={warn}
                    />
                ) : null}
                <CommonComp
                    {...props}
                    value={val.content}
                    onChange={v =>
                        onChange({
                            '@class': 'Script',
                            content: v,
                        })}
                />
            </div>
        );
    }
    ScriptObject.propTypes = {
        value: PropTypes.shape({
            content: PropTypes.string,
        }),
        onChange: PropTypes.func.isRequired,
        view: PropTypes.object,
    };
    ScriptObject.defaultProps = {
        value: { content: '' },
        view: {},
    };
    return ScriptObject;
}

export default scriptObject;
