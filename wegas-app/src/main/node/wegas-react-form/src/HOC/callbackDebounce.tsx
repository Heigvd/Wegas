import React from 'react';
import debounce, { DebouncedFunc } from 'lodash-es/debounce';

interface IDebouncedProps {
    [key: string]: any;
}
function deb(wait: number) {
    return (key: string) =>
        function debounced<P>(Comp: React.ComponentType<P>) {
            class Debounced<F extends () => void> extends React.Component<P> {
                method: DebouncedFunc<F>;
                constructor(props: P & IDebouncedProps) {
                    super(props);
                    this.method = debounce<F>(props[key] as F, wait);
                }
                componentWillUnmount() {
                    this.method.flush();
                }
                componentWillReceiveProps(nextProps: P) {
                    if (nextProps[key] !== this.props[key]) {
                        this.method.flush();
                        this.method = debounce<F>(nextProps[key] as F, wait);
                    }
                }
                render() {
                    // tslint:disable-next-line:prefer-object-spread
                    const newProps = Object.assign({}, this.props, {
                        [key]: this.method,
                    });
                    return <Comp {...newProps} />;
                }
            }
            return Debounced;
        };
}
export default deb(600);
