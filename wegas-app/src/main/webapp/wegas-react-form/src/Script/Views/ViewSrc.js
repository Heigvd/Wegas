import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from '../../css/string.css';
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
                <textarea
                    key="code"
                    className={styles.textarea}
                    defaultValue={this.props.value}
                    onChange={event => this.props.onChange(event.target.value)}
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
export default ViewSrc;
