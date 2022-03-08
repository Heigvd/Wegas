// @ts-ignore
import mainStyle from '!!raw-loader!../../css/defaultStyle.less';
import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import { ILibraries, LibraryAPI } from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import {
  safeClientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../../Components/Hooks/useScript';
import { store } from '../../data/Stores/store';
import { wlog, wwarn } from '../../Helper/wegaslog';

interface LibrariesContext {
  updateCSSLibraries: (name: string) => void;
  clientScripts: ILibraries;
}

export const librariesCTX = React.createContext<LibrariesContext>({
  updateCSSLibraries: () => {},
  clientScripts: {},
});

export function LibrariesLoader(props: React.PropsWithChildren<{}>) {
  const [jsLibs, setJSLibs] = React.useState<ILibraries>({});
  const [cssLibs, setCSSLibs] = React.useState<ILibraries>({});
  const [lessLibs, setLessLibs] = React.useState<string>();

  const globalContexts = useGlobalContexts();

  // It's VERY important to import less library dynamically to avoid breaking the import flow of the components of the layout when less in rendering
  import('less').then(less => {
    less
      .render(
        //   `.wegas {
        //   @MainColor: blue;
        //   @DisabledColor: grey;
        //   @TextColor: white;

        //   &.wegas-btn {
        //     background-color: @MainColor;
        //     color: @TextColor;
        //     border-style: none;
        //     padding-left: 5px;
        //     padding-right: 5px;
        //     padding-top: 2px;
        //     padding-bottom: 2px;
        //     cursor: pointer;
        //     &.disabled {
        //       background-color: @DisabledColor;
        //       cursor: initial;
        //     }
        //   }
        // }`,
        mainStyle,
      )
      .then(output => {
        setLessLibs(output.css);
      })
      .catch(error => {
        wlog(error);
      });
  });

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

    // Run global contexts before loading external client scripts
    setGlobals(globalContexts, store.getState());
    CurrentGM.properties.clientScriptUri?.split(';').map(scriptUrl => {
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
            safeClientScriptEval(
              res.text,
              undefined,
              () => wwarn(`In static client script : ${res.scriptUrl}`),
              undefined,
              {
                injectReturn: false,
                moduleName: scriptUrl,
              },
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
  useWebsocketEvent('LibraryUpdate-CSS', cssEventHandler);

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
  useWebsocketEvent('LibraryUpdate-ClientScript', clientScriptEventHandler);

  React.useEffect(() => {
    Object.entries(jsLibs).forEach(([key, lib]) =>
      safeClientScriptEval(
        lib.content,
        undefined,
        () => wwarn(`In client script  : ${key}`),
        undefined,
        {
          moduleName: `./${key}`,
          injectReturn: false,
        },
      ),
    );
  }, [jsLibs]);

  return (
    <>
      {/* <link rel="stylesheet/less" href={'../../css/defaultStyle.less'} /> */}
      <style type="text/css">{lessLibs}</style>
      {CurrentGM.properties.cssUri?.split(';').map(cssUrl => (
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
      <librariesCTX.Provider
        value={{
          updateCSSLibraries: name => cssEventHandler(name),
          clientScripts: jsLibs,
        }}
      >
        {props.children}
      </librariesCTX.Provider>
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
