import  * as React from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
//import 'react-select/less/default.less';
import { connect } from 'react-redux';

// @connect(state => ({
//     status: state.logIds.get('status'),
//     logIds: state.logIds.get('value')
// }))
class LogIdSelector extends React.Component {
    onChange(selected) {
        if (selected) {
            setTimeout(
                () => this.props.history.push(`/${selected.value}`),
                200
            ); // @hack already...
        }
    }

    render() {
        const { logIds } = this.props;
        const options = logIds.map(logId => ({
            value: logId,
            label: logId,
        }));
        return (
            <ReactSelect
                multi={false}
                name="logids"
                onChange={this.onChange.bind(this)}
                options={options}
            />
        );
    }
}
export default connect(state => ({
    status: state.logIds.status,
    logIds: state.logIds.value,
}))(LogIdSelector);
