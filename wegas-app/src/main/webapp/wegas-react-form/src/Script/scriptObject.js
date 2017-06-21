import PropTypes from 'prop-types';
import React from 'react';
import { css } from 'glamor';
import FormStyles from '../Views/form-styles';
import commonView from '../HOC/commonView';
/**
 * HOC Handle Wegas' script object
 * @param {React.Component} Comp Component to augment
 */

const labelStyle = css(FormStyles.labelStyle, {
    marginTop: '8px',
    marginRight: '2px',
    verticalAlign: '2px'
});

const containerStyle = css({
    marginTop: '15px',
    maxWidth: '100%'
});
function renderLabel(label) {
    if (label) {
        return (
            <span className={labelStyle}>
                {label}
            </span>
        );
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
        return (
            <div className={containerStyle}>
                {renderLabel(view.label)}
                <CommonComp
                    {...props}
                    value={val.content}
                    onChange={v =>
                        onChange({
                            '@class': 'Script',
                            content: v
                        })}
                />
            </div>
        );
    }
    ScriptObject.propTypes = {
        value: PropTypes.shape({
            content: PropTypes.string
        }),
        onChange: PropTypes.func.isRequired,
        view: PropTypes.object
    };
    ScriptObject.defaultProps = {
        value: { content: '' },
        view: {}
    };
    return ScriptObject;
}

export default scriptObject;
