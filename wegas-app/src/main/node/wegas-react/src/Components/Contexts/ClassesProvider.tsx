import { omit } from 'lodash';
import * as React from 'react';

export interface ClassesContext extends GlobalClassesClass {
  classes: Record<string, string>;
}
export const classesCTX = React.createContext<ClassesContext>({
  addClass: () => {},
  removeClass: () => {},
  classes: {},
});

function ClassesHandler({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const [classes, setClasses] = React.useState({});

  function addClass(className: string, label: string) {
    setClasses(oc => ({ ...oc, [className]: label }));
  }
  function removeClass(className: string) {
    setClasses(oc => omit(oc, className));
  }
  return (
    <classesCTX.Provider
      value={{
        addClass,
        removeClass,
        classes: classes,
      }}
    >
      {children}
    </classesCTX.Provider>
  );
}

/**
 * Provider for Classes Handles stores classes change
 * The add and remove method are exposed in the client script context
 * Enables client scripts to inject classes names which will be available dynamically in the react context
 */
export const ClassesProvider = React.memo(ClassesHandler);
