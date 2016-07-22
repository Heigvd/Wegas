import React, { PropTypes } from 'react';

function scriptObject(Comp) {
    function ScriptObject(props) {
        const { value, onChange, view } = props;
        return (
            <div>
                <span>{view.label}</span>
                <Comp
                    {...props}
                    value={value.content}
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
        value: { content: '' }
    };
    return ScriptObject;
}

export default scriptObject;
