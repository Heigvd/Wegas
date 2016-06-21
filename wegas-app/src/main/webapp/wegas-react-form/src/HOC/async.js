import React from 'react';
const STATUS = {
    STOP: 0,
    RUN: 1,
    END: 2
};

function promised(Comp) {
    return (promising) => {
        class Async extends React.Component {
            constructor() {
                super();
                this.state = {
                    status: STATUS.STOP
                };
            }
            componentWillMount() {
                this.setState({ status: STATUS.RUN });
                promising(this.props).then((result) => {
                    this.setState({
                        result,
                        status: STATUS.END
                    });
                });
            }
            componentWillReceiveProps(nextProps) {
                this.setState({ status: STATUS.RUN });
                promising(nextProps).then((result) => {
                    this.setState({
                        result,
                        status: STATUS.END
                    });
                });
            }
            shouldComponentUpdate(nextProps, nextState) {
                return nextState.status === STATUS.END;
            }
            render() {
                if (this.state.status === STATUS.END) {
                    if (typeof this.state.result === 'object') {
                        return <Comp {...this.props} {...this.state.result} />;
                    }
                    return <Comp {...this.props} />;
                }
                return null;
            }
        }
        return Async;
    };
}

export default promised;
