import PropTypes from 'prop-types';
import React from 'react';
import debounce from 'lodash/debounce';

function debounced(wait) {
    return key => Comp => {
        class Debounced extends React.Component {
            constructor(props) {
                super(props);
                this.method = debounce(props[key], wait);
            }
            componentWillUnmount() {
                this.method.cancel();
            }
            render() {
                const newProps = Object.assign({}, this.props, { [key]: this.method });
                return <Comp {...newProps} />;
            }
        }
        Debounced.propTypes = {
            [key]: PropTypes.func.isRequired // eslint-disable-line react/no-unused-prop-types
        };
        return Debounced;
    };
}

export default debounced(600);
