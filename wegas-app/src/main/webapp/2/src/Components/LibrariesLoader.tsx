import * as React from 'react';
import { LibraryAPI } from '../API/library.api';

interface WegasLibraries {
  CSS: ILibraries;
  JS: ILibraries;
}

export function LibrariesLoader() {
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
        alert('Cannot get the scripts');
      });

    LibraryAPI.getAllLibraries('ClientScript')
      .then((libs: ILibraries) => {
        setLibraries(oldLibs => {
          return { ...oldLibs, JS: libs };
        });
      })
      .catch(() => {
        alert('Cannot get the scripts');
      });
  }, []);
  console.log(libraries);
  return (
    <>
      {Object.keys(libraries.CSS).map(libKey => {
        return (
          <style key={'CSS' + libKey}>{libraries.CSS[libKey].content}</style>
        );
      })}
      {Object.keys(libraries.JS).map(libKey => {
        return (
          <script key={'JS' + libKey} type="text/javascript">
            {libraries.JS[libKey].content}
          </script>
        );
      })}
    </>
  );
}
