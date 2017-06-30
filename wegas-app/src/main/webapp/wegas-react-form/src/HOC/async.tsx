import React from 'react';

enum STATUS {
    STOP = 'stop',
    RUN = 'run',
    END = 'end'
}

type PromiseProps<I, O> = (props: I) => Promise<O> | O;
function promised<P, O>(Comp: React.ComponentClass<{}> | React.SFC<{}>) {
    return (promising: PromiseProps<P, O>) => {
        interface IAsyncState {
            result?: O;
            status: STATUS;
        }
        class Async extends React.Component<P, IAsyncState> {
            constructor(props: P) {
                super(props);
                this.state = {
                    status: STATUS.STOP
                };
            }
            componentWillMount() {
                this.setState({ status: STATUS.RUN });
                Promise.resolve(promising(this.props)).then(result => {
                    this.setState({
                        result,
                        status: STATUS.END
                    });
                });
            }
            componentWillReceiveProps(nextProps: P) {
                this.setState({ status: STATUS.RUN });
                Promise.resolve(promising(nextProps)).then(result => {
                    this.setState({
                        result,
                        status: STATUS.END
                    });
                });
            }
            shouldComponentUpdate(nextProps: P, nextState: IAsyncState) {
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
