import React, { PropTypes } from 'react';
import ReactSelect from 'react-select';
import 'react-select/less/default.less';
import { connect } from 'react-redux';

// @connect(state => ({
//     status: state.logIds.get('status'),
//     logIds: state.logIds.get('value')
// }))
class LogIdSelector extends React.Component {

    onChange(value) {
        if (value) {
            setTimeout(() => this.context.history.pushState(null, `/${value}`), 200); // @hack already...
        }
    }

    render() {
        const { logIds } = this.props;
        const options = logIds.map((logId) => ({
            value: logId,
            label: logId,
        }));
        return (
            <ReactSelect multi={ false }
                         name="logids"
                         onChange={ this.onChange.bind(this) }
                         options={ options } />
            );
    }
}
LogIdSelector.contextTypes = {
    history: PropTypes.object,
};
export default connect(state => ({
    status: state.logIds.status,
    logIds: state.logIds.value,
}))(LogIdSelector);
