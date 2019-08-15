import * as React from 'react';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { wlog } from '../../Helper/wegaslog';

interface WegasLibraries {
  CSS: ILibraries;
  JS: ILibraries;
}

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
  const [libraries, setLibraries] = React.useState<WegasLibraries>({
    CSS: {},
    JS: {},
  });

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
      {Object.keys(libraries.JS).map(libKey => {
        return (
          <script
            className="WegasScript"
            key={'JS' + libKey}
            type="text/javascript"
          >
            {libraries.JS[libKey].content}
          </script>
        );
      })}
    </>
  );
}
