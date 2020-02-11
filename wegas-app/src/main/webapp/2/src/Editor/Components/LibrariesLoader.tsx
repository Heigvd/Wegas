import * as React from 'react';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { wlog } from '../../Helper/wegaslog';
import { clientScriptEval, useGlobals } from '../../Components/Hooks/useScript';

interface WegasLibraries {
  CSS: ILibraries;
  JS: ILibraries;
}

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
  const [libraries, setLibraries] = React.useState<WegasLibraries>({
    CSS: {},
    JS: {},
  });

  useGlobals();

  React.useEffect(() => {
    LibraryAPI.getAllLibraries('CSS')
      .then((libs: ILibraries) => {
        setLibraries(oldLibs => {
          return { ...oldLibs, CSS: libs };
        });
      })
      .catch(() => {
        wlog('Cannot get the scripts');
      });

    LibraryAPI.getAllLibraries('ClientScript')
      .then((libs: ILibraries) => {
        setLibraries(oldLibs => {
          return { ...oldLibs, JS: libs };
        });
      })
      .catch(() => {
        wlog('Cannot get the scripts');
      });
  }, []);

  React.useEffect(
    () =>
      Object.keys(libraries.JS).forEach(libKey => {
        try {
          clientScriptEval(libraries.JS[libKey].content);
        } catch (e) {
          wlog(libKey);
          wlog(e);
        }
      }),
    [libraries.JS],
  );

  return (
    <>
      {Object.keys(libraries.CSS).map(libKey => {
        return (
          <style className="WegasStyle" key={'CSS' + libKey}>
            {libraries.CSS[libKey].content}
          </style>
        );
      })}
      {props.children}
    </>
  );
}
