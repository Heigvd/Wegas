import React from 'react';

enum STATUS {
    STOP = 'stop',
    RUN = 'run',
    END = 'end',
}

type PromiseProps<I, O> = (props: I) => Promise<O> | O;
function promised<P, O>(Comp: React.ComponentType<O>) {
    return (promiseProps: PromiseProps<P, O>) => {
        interface IAsyncState {
            result?: O;
            status: STATUS;
        }
        class Async extends React.Component<P, IAsyncState> {
            static getDerivedStateFromProps(props: P, state: IAsyncState) {
                return { status: STATUS.RUN };
            }
            mounted: boolean = true;
            constructor(props: P) {
                super(props);
                this.state = {
                    status: STATUS.STOP,
                };
            }
            _resolvePromise() {
                if (this.state.status !== STATUS.END) {
                    Promise.resolve(promiseProps(this.props)).then(result => {
                        if (this.mounted) {
                            this.setState({
                                result,
                                status: STATUS.END,
                            });
                        }
                    });
                }
            }
            componentDidMount() {
                this._resolvePromise();
            }
            componentDidUpdate() {
                this._resolvePromise();
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
