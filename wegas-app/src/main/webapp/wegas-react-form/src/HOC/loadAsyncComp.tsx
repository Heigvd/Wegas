import * as React from 'react';
import { css, keyframes } from 'glamor';

const scale = keyframes({
    '0%': {
        transform: 'scale(0)',
        opacity: 1,
    },
    '100%': {
        transform: 'scale(1)',
        opacity: 0,
    },
});
const loaderStyle = css({
    width: '30px',
    height: '30px',
    backgroundColor: '#808080',
    borderRadius: '50%',
    margin: 'auto',
    animation: `${scale} 1s infinite ease-in-out`,
});
const SimpleLoader = () => <div {...loaderStyle} />;
/**
 * Resolve an asynchronous component on mount.
 * Promise is resolved only once.
 * Passes props through
 *
 * @param asyncCallback Calls this function when mounting
 * @param Loader Optional component to show will loading
 * @param Err Optional component to show on error
 */
function asyncComp<P>(
    asyncCallback: () => Promise<React.ComponentType<P>>,
    Loader: React.ComponentType = SimpleLoader,
    Err: React.ComponentType = () => <div />
) {
    return class AsyncComponent extends React.Component<
        P,
        { Comp: React.ComponentType }
    > {
        unmount: boolean = false;
        constructor(props: P) {
            super(props);
            this.state = { Comp: Loader };
        }
        componentWillMount() {
            asyncCallback()
                .then(Comp => {
                    if (!this.unmount) {
                        this.setState({ Comp });
                    }
                })
                .catch(() => {
                    if (!this.unmount) {
                        this.setState({ Comp: Err });
                    }
                });
        }
        componentWillUnmount() {
            this.unmount = true;
        }
        render() {
            return <this.state.Comp {...this.props} />;
        }
    };
}

export default asyncComp;
