import React, { PropTypes } from 'react';

function scriptObject(Comp) {
    function ScriptObject(props) {
        const { value, onChange, view } = props;
        const val = value || {};
        return (
            <div
                style={{
                    marginTop: '15px',
                    maxWidth: '30.3em',
                    borderTop: 'solid 2px #4A8C9C',
                    marginLeft: '50px' }}
            >
                <span
                    style={{
                        fontFamily: 'Rockwell',
                        fontSize: '15.5px',
                        color: '#6A95B6',
                        marginTop: '8px',
                        marginRight: '10px',
                        display: 'inline-block' }}
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
        value: { content: '' }
    };
    return ScriptObject;
}

export default scriptObject;
