import * as React from 'react';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { wlog, wwarn } from '../../Helper/wegaslog';
import {
  useGlobals,
  safeClientScriptEval,
} from '../../Components/Hooks/useScript';
import { useWebsocket } from '../../API/websocket';
import { IGameModelContent } from 'wegas-ts-api/typings/WegasEntities';

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
  const [jsLibs, setJSLibs] = React.useState<ILibraries>({});
  const [cssLibs, setCSSLibs] = React.useState<ILibraries>({});

  useGlobals();

  // Effect triggers on first rendering only
  React.useEffect(() => {
    LibraryAPI.getAllLibraries('CSS')
      .then((newCSSLibs: ILibraries) => {
        setCSSLibs(oldLibs => ({ ...oldLibs, ...newCSSLibs }));
      })
      .catch(() => {
        wlog('Cannot get the scripts');
      });

    LibraryAPI.getAllLibraries('ClientScript')
      .then((newJSLibs: ILibraries) => {
        setJSLibs(oldLibs => ({ ...oldLibs, ...newJSLibs }));
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
        setCSSLibs(oldLibs => ({
          ...oldLibs,
          [updatedLibraryName]: library,
        }));
      },
    );
  }, []);
  useWebsocket('LibraryUpdate-CSS', cssEventHandler);

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          setJSLibs(oldLibs => ({
            ...oldLibs,
            [updatedLibraryName]: library,
          }));
        },
      );
    },
    [],
  );
  useWebsocket('LibraryUpdate-ClientScript', clientScriptEventHandler);

  React.useEffect(() => {
    Object.entries(jsLibs).forEach(([key, lib]) =>
      safeClientScriptEval(lib.content, () =>
        wwarn(`In client script  : ${key}`),
      ),
    );
  }, [jsLibs]);

  return (
    <>
      {CurrentGM.properties.cssUri.split(';').map(cssUrl => (
        <link
          key={cssUrl}
          className="WegasStaticStyle"
          rel="stylesheet"
          type="text/css"
          href={cssUrl}
        />
      ))}
      {Object.entries(cssLibs).map(([key, lib]) => (
        <style className="WegasStyle" key={key}>
          {lib.content}
        </style>
      ))}
      {props.children}
    </>
  );
}
