import * as React from 'react';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { wlog, wwarn } from '../../Helper/wegaslog';
import {
  useGlobals,
  safeClientScriptEval,
} from '../../Components/Hooks/useScript';
import { useWebsocket } from '../../API/websocket';

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
  const [libs, setLibs] = React.useState<{ CSS: ILibraries; JS: ILibraries }>({
    CSS: {},
    JS: {},
  });

  useGlobals();

  // Effect triggers on first rendering only
  React.useEffect(() => {
    LibraryAPI.getAllLibraries('CSS')
      .then((cssLibs: ILibraries) => {
        setLibs(oldLibs => ({ ...oldLibs, CSS: cssLibs }));
      })
      .catch(() => {
        wlog('Cannot get the scripts');
      });

    LibraryAPI.getAllLibraries('ClientScript')
      .then((jsLibs: ILibraries) => {
        setLibs(oldLibs => ({ ...oldLibs, js: jsLibs }));
      })
      .catch(() => {
        wlog('Cannot get the scripts');
      });

    CurrentGM.properties.clientScriptUri.split(';').map(scriptUrl => {
      if (scriptUrl !== '') {
        fetch(scriptUrl)
          .then(res => {
            if (res.ok) {
              return res.text().then(text => ({ text, scriptUrl }));
            } else {
              throw Error(res.status + ' : ' + res.statusText);
            }
          })
          .then(res => {
            safeClientScriptEval(res.text, () =>
              wwarn(`In static client script : ${res.scriptUrl}`),
            );
          })
          .catch(e => {
            wlog(e);
          });
      }
    });
  }, []);

  const cssEventHandler = React.useCallback((updatedLibraryName: string) => {
    LibraryAPI.getLibrary('CSS', updatedLibraryName).then(
      (library: IGameModelContent) => {
        setLibs(oldLibs => ({
          ...oldLibs,
          CSS: { ...oldLibs.CSS, [updatedLibraryName]: library },
        }));
      },
    );
  }, []);
  useWebsocket('LibraryUpdate-CSS', cssEventHandler);

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          setLibs(oldLibs => ({
            ...oldLibs,
            CSS: { ...oldLibs.CSS, [updatedLibraryName]: library },
          }));
        },
      );
    },
    [],
  );
  useWebsocket('LibraryUpdate-ClientScript', clientScriptEventHandler);

  React.useEffect(() => {
    Object.entries(libs.JS).forEach(([key, lib]) =>
      safeClientScriptEval(lib.content, () =>
        wwarn(`In client script  : ${key}`),
      ),
    );
  }, [libs]);

  return (
    <>
      {Object.entries(libs.CSS).map(([key, lib]) => {
        return (
          <style className="WegasStyle" key={'CSS' + key}>
            {lib.content}
          </style>
        );
      })}
      {props.children}
    </>
  );
}
