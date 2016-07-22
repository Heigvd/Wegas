import React, { PropTypes } from 'react';
import { parse, print, types } from 'recast';

class ViewSrc extends React.Component {
    constructor(props) {
        super(props);
        this.state = { src: false };
    }
    render() {
        let child;
        if (this.state.src) {
            child = (
                <textarea
                    defaultValue={this.props.value}
                    onChange={event => this.props.onChange(event.target.value)}
                />
            );
        } else {
            child = this.props.children;
        }
        return (
            <div>
                <span
                    onClick={() => this.setState({
                        src: !this.state.src
                    })}
                >TOGGLE SOURCE</span>
                {child}
            </div>
        );
    }
}
ViewSrc.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    children: PropTypes.element
};

function parsed(Comp) {
    function Parsed(props) {
        const { value, onChange, ...restProps } = props;
        let ast;
        try {
            ast = parse(value);
        } catch (e) {
            // should show code string instead of falling back to an empty program
            ast = types.builders.file(types.builders.program([]));
        }
        return (
            <ViewSrc value={value} onChange={onChange}>
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
        value: PropTypes.string,
        onChange: PropTypes.func,
        children: PropTypes.node
    };
    return Parsed;
}
export default parsed;
