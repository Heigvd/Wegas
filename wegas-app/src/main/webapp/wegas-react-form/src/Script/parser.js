import React, { PropTypes } from 'react';
import { parse, print, types } from 'recast';
import classNames from 'classnames';
import styles from '../css/string.css';
/**
 * Toggle view between parsed and code
 */
class ViewSrc extends React.Component {
    constructor(props) {
        super(props);
        this.state = { src: false };
    }
    render() {
        let child;
        if (this.state.src || this.props.error) {
            child = [(
                <textarea
                    key="code"
                    className={styles.textarea}
                    defaultValue={this.props.value}
                    onChange={event => this.props.onChange(event.target.value)}
                />
            ), (<div key="error">{this.props.error || <br />}</div>)];
        } else {
            child = this.props.children;
        }
        return (<span>
            <i
                className={classNames('fa fa-code', styles.icon)}
                onClick={() => this.setState({
                    src: !this.state.src
                })}
            />
            <div>
                {child}
            </div>
        </span>
        );
    }
}
ViewSrc.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    children: PropTypes.element.isRequired,
    error: PropTypes.string
};
/**
 * HOC Parse code into AST and reverse onChange
 * @param {React.Component} Comp Component to augment
 */
function parsed(Comp) {
    /**
     * @param {{value:string, onChange:(code:string)=>void}} props Component props
     */
    function Parsed(props) {
        const { value, onChange, ...restProps } = props;
        let error = '';
        let ast;
        try {
            ast = parse(value);
        } catch (e) {
            error = e.description;
            // should show code string instead of falling back to an empty program
            ast = types.builders.file(types.builders.program([]));
        }
        return (
            <ViewSrc value={value} onChange={onChange} error={error}>
                <Comp
                    {...restProps}
                    code={ast.program.body}
                    onChange={(v) => {
                        ast.program.body = v;
                        onChange(print(ast).code);
                    }}
                />
            </ViewSrc>
        );
    }
    Parsed.propTypes = {
        value: PropTypes.string.isRequired,
        onChange: PropTypes.func
    };
    Parsed.defaultProps = {
        value: ''
    };
    return Parsed;
}
export default parsed;
