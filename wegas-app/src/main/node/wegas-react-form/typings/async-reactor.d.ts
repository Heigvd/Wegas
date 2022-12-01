declare module 'async-reactor' {
    import { ComponentClass, SFC } from 'react';
    type Comps = ComponentClass<any> | SFC<any>;
    export function asyncReactor(
        component: Function,
        loaderComponent?: Comps,
        errorComponent?: Comps,
    ): ComponentClass<any>;
}
