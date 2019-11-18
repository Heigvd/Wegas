import * as React from 'react';
import { omit } from 'lodash';
import { GlobalClassesClass } from './Hooks/types/scriptClassesGlobals';

interface ClassesContextProps extends GlobalClassesClass {
  classes: string[];
}
export const classesCtx = React.createContext<ClassesContextProps>({
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
    <classesCtx.Provider
      value={{
        addClass,
        removeClass,
        classes: Object.keys(classes),
      }}
    >
      {children}
    </classesCtx.Provider>
  );
}

/**
 * Provider for LangContext Handles stores language change
 */
export const ClassesProvider = React.memo(ClassesHandler);
