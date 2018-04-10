/*
 * Wait for @types/react to support this.
 * Then remove this file.
 */

import * as React from 'react';

declare module 'react' {
    type Provider<T> = React.ComponentType<{
        value: T;
        children?: ReactNode;
    }>;
    type Consumer<T> = ComponentType<{
        children: (value: T) => ReactNode;
        unstable_observedBits?: number;
    }>;
    interface Context<T> {
        Provider: Provider<T>;
        Consumer: Consumer<T>;
    }
    function createContext<T>(defaultValue: T): Context<T>;
}
