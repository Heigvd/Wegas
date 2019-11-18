import * as React from 'react';
import { omit } from 'lodash';

interface ClassesContext extends GlobalClassesClass {
  classes: string[];
}
export const classesCTX = React.createContext<ClassesContext>({
  addClass: () => {},
  removeClass: () => {},
  classes: [],
});

function ClassesHandler({ children }: React.PropsWithChildren<{}>) {
  const [classes, setClasses] = React.useState({});

  function addClass(className: string) {
    setClasses(oc => ({ ...oc, [className]: className }));
  }
  function removeClass(className: string) {
    setClasses(oc => omit(oc, className));
  }
  return (
    <classesCTX.Provider
      value={{
        addClass,
        removeClass,
        classes: Object.keys(classes),
      }}
    >
      {children}
    </classesCTX.Provider>
  );
}

/**
 * Provider for LangContext Handles stores language change
 */
export const ClassesProvider = React.memo(ClassesHandler);
