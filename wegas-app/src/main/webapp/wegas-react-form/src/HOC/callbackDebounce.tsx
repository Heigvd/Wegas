import React from 'react';
import debounce from 'lodash-es/debounce';
interface IDebouncedProps {
    [key: string]: any;
}
function deb(wait: number) {
    return (key: string) =>
        function debounced<P>(Comp: React.ComponentClass<P>) {
            class Debounced<F extends Function> extends React.Component<P> {
                method: F & _.Cancelable;
                constructor(props: P & IDebouncedProps) {
                    super(props);
                    this.method = debounce<F>(props[key] as F, wait);
                }
                componentWillUnmount() {
                    this.method.cancel();
                }
                render() {
                    const newProps = Object.assign({}, this.props, {
                        [key]: this.method
                    });
                    return <Comp {...newProps} />;
                }
            }
            return Debounced;
        };
}

export default deb(600);
