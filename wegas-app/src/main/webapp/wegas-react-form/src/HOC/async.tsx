import React from 'react';

enum STATUS {
    STOP = 'stop',
    RUN = 'run',
    END = 'end',
}

type PromiseProps<I, O> = (props: I) => Promise<O> | O;
function promised<P, O>(Comp: React.ComponentType<O>) {
    return (promising: PromiseProps<P, O>) => {
        interface IAsyncState {
            result?: O;
            status: STATUS;
        }
        class Async extends React.Component<P, IAsyncState> {
            mounted: boolean = true;
            constructor(props: P) {
                super(props);
                this.state = {
                    status: STATUS.STOP,
                };
            }
            componentWillMount() {
                this.setState({ status: STATUS.RUN });
                Promise.resolve(promising(this.props)).then(result => {
                    if (this.mounted) {
                        this.setState({
                            result,
                            status: STATUS.END,
                        });
                    }
                });
            }
            componentWillReceiveProps(nextProps: P) {
                this.setState({ status: STATUS.RUN });
                Promise.resolve(promising(nextProps)).then(result => {
                    if (this.mounted) {
                        this.setState({
                            result,
                            status: STATUS.END,
                        });
                    }
                });
            }
            shouldComponentUpdate(nextProps: P, nextState: IAsyncState) {
                return nextState.status === STATUS.END;
            }
            componentWillUnmount() {
                this.mounted = false;
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
