import PropTypes from 'prop-types';
import React from 'react';
/**
 * HOC Handle Wegas's script object
 * @param {React.Component} Comp Component to augment
 */
function scriptObject(Comp) {
    /**
     * @template Script
     * @param {{value:Script,onChange:(script:Script)=>void, view:Object}} props Component's props
     */
    function ScriptObject(props) {
        const { value, onChange, view } = props;
        const val = value || { content: '' };
        return (
            <div
                style={{
                    marginTop: '15px',
                    maxWidth: '100%',
                    marginRight: '10px'
                }}
            >
                <span
                    style={{
                        fontSize: '15px',
                        color: '#6A95B6',
                        marginTop: '8px',
                        marginRight: '10px',
                        display: 'inline-block'
                    }}
                >
                    {view.label}
                </span>
                <Comp
                    {...props}
                    value={val.content}
                    onChange={v => onChange({
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
