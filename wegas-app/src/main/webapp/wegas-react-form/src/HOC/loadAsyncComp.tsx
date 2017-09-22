import * as React from 'react';

function promiseComponent<P>(
    promisedComponent: Promise<React.ComponentType<P>>,
    Loader: React.ComponentType = () => <div />,
    Err: React.ComponentType = () => <div />
) {
    return class Async extends React.Component<
        P,
        { Comp: React.ComponentType }
    > {
        constructor(props: P) {
            super(props);
            this.state = {
                Comp: Loader,
            };
        }
        componentWillMount() {
            promisedComponent
                .then(Comp => {
                    this.setState({
                        Comp,
                    });
                })
                .catch(() => {
                    this.setState({ Comp: Err });
                });
        }
        render() {
            return <this.state.Comp {...this.props} />;
        }
    };
}

export default promiseComponent;
