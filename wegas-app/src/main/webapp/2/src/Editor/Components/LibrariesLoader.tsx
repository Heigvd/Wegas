import * as React from 'react';
import { LibraryAPI, ILibraries } from '../../API/library.api';
import { wlog, wwarn } from '../../Helper/wegaslog';
import {
  useGlobals,
  safeClientScriptEval,
} from '../../Components/Hooks/useScript';
import { useWebsocket } from '../../API/websocket';
import { IGameModelContent } from 'wegas-ts-api';
import * as less from 'less';

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

  React.useEffect(() => {
    less.watch();
    less
      // .render(require('../../css/defaultStyle.less').default, {
      .render(
        `.wegas {
        @MainColor: blue;
        @DisabledColor: grey;
        @TextColor: white;
      
        &.wegas-btn {
          background-color: @MainColor;
          color: @TextColor;
          border-style: none;
          padding-left: 5px;
          padding-right: 5px;
          padding-top: 2px;
          padding-bottom: 2px;
          cursor: pointer;
          &.disabled {
            background-color: @DisabledColor;
            cursor: initial;
          }
        }
      }`,
      )
      .then(output => output.css)
      .catch(error => {
        wlog(error);
        return '';
      });
  }, []);

  return (
    <>
      {/* <link rel="stylesheet/less" href={'../../css/defaultStyle.less'} /> */}
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
      {/* <style type="text/css">
        {less
          .render(require('../../css/defaultStyle.less').default, {
            syncImport: true,
          })
          .then(output => output.css)
          .catch(error => {
            wlog(error);
            return '';
          })}
      </style> */}
    </>
  );
}
