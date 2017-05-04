import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../../css/string.css';
import debounced from '../../HOC/callbackDebounce';
import JSEditor from './asyncJSEditor';

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
            child = [
                <JSEditor
                    key="editor"
                    value={this.props.value}
                    width="100%"
                    height="200px"
                    focus
                    onChange={v => this.props.onChange(v)}
                />,
                <div key="error">{this.props.error || <br />}</div>
            ];
        } else {
            child = this.props.children;
        }
        return (
            <span>
                <i
                    className={classNames('fa fa-code', styles.icon)}
                    onClick={() =>
                        this.setState({
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

export default debounced('onChange')(ViewSrc);
