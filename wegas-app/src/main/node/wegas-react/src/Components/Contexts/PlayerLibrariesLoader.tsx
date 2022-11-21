import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import {
  ILibraries,
  LibraryAPI,
} from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import { ActionCreator } from '../../data/actions';
import { useIsReadyForClientScript } from '../../data/selectors/InitStatusesSelector';
import { setReloadingStatus } from '../../data/Stores/pageContextStore';
import { store } from '../../data/Stores/store';
import { clearEffects, runEffects } from '../../Helper/pageEffectsManager';
import { getLogger } from '../../Helper/wegaslog';
import { clearModule } from '../Hooks/sandbox';
import {
  printWegasScriptError,
  safeClientScriptEval,
  setGlobals,
  useGlobalContexts,
} from '../Hooks/useScript';


const librariesLoaderLogger = getLogger('ClientLibrariesLoader');

function executeClientLibrary(
  libraryName: string,
  libraryContent: string,
) {
  let error = '';
  safeClientScriptEval(
    libraryContent,
    undefined,
    e => {
      error = printWegasScriptError(e);
    },
    undefined,
    {
      moduleName: `./${libraryName}`,
      injectReturn: false,
    },
  );
  if (error) {
    librariesLoaderLogger.warn(error);
  }
}

/**
 *Execute all client script
 */
function execAllScripts(scripts: ILibraries) {
  // set PageStore reloading status to true to prevent usePagesContextStateStore  hooks to be triggered
  setReloadingStatus(true);
  clearEffects();

  Object.entries(scripts).forEach(([libName, lib]) => {
    executeClientLibrary(libName, lib.content);
  });

  runEffects();
  // resumes pagesStore status, hooks will be triggered
  setReloadingStatus(false);
}

export default function PlayerLibrariesLoader(
  props: React.PropsWithChildren<UnknownValuesObject>,
) {
  const globalContexts = useGlobalContexts();

  // Refreshing globals when global contexts changes should any global changes trigger a new script reevalutation???
  // Should the store state also be a trigger???
  React.useEffect(() => {
    setGlobals(globalContexts, store.getState());
  }, [globalContexts]);


  const [_clientScripts, setClientScripts] = React.useState<ILibraries>({});

  const isReadyForClientScript = useIsReadyForClientScript();


  // Effect triggers on first rendering only
  React.useEffect(() => {
    if (isReadyForClientScript) {
      LibraryAPI.getAllLibraries('ClientScript')
        .then((libraries: ILibraries) => {
          execAllScripts(libraries);
          setClientScripts(libraries);

          // initial client script evaluation done !
          store.dispatch(
            ActionCreator.INIT_STATE_SET('clientScriptsEvaluationDone', true),
          );
        })
        .catch(() => {
          librariesLoaderLogger.warn('Cannot get client scripts');
        });
    }
  }, [isReadyForClientScript]);

  const clientScriptEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('ClientScript', updatedLibraryName).then(
        (library: IGameModelContent) => {
          setClientScripts(currentCs => {
            const newCs = {...currentCs,
              [updatedLibraryName]: library
            };
            execAllScripts(newCs);
            return newCs;
          });
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-ClientScript', clientScriptEventHandler);


  const clientScriptDestroyEventHandler = React.useCallback(
    (name: string) => {
      setClientScripts((current)  => {
        delete current[name];
        return current;
      });
      clearModule(`./${name}`);
    },
    [],
  );
  useWebsocketEvent('LibraryDestroy-ClientScript', clientScriptDestroyEventHandler,);

  //////////////////////////////////////////
  // StyleSheets
  ////////////////
  const [stylesheets, setStylesheets] = React.useState<ILibraries>({});


  // Effect triggers on first rendering only
  // stylesheets can be safely loaded at any time
  React.useEffect(() => {
    LibraryAPI.getAllLibraries('CSS')
      .then((libraries: ILibraries) => {
        setStylesheets(libraries);
      })
      .catch(() => {
        librariesLoaderLogger.warn('Cannot get style scripts');
      });
  }, []);


  const stylesheetEventHandler = React.useCallback(
    (updatedLibraryName: string) => {
      LibraryAPI.getLibrary('CSS', updatedLibraryName).then(
        (library: IGameModelContent) => {
          setStylesheets(current => ({
            ...current,
            [updatedLibraryName]: library
          }));
        },
      );
    },
    [],
  );
  useWebsocketEvent('LibraryUpdate-CSS', stylesheetEventHandler);

  const cssDestroyEventHandler = React.useCallback(
    (name: string) => {
      setStylesheets((current) => {
        delete current[name];
        return current;
      })
    },
    [],
  );
  useWebsocketEvent('LibraryDestroy-CSS', cssDestroyEventHandler);

  return (
    <>
      {CurrentGM.properties.cssUri?.split(';').map(cssUrl => (
        <link
          key={cssUrl}
          className="WegasStaticStyle"
          rel="stylesheet"
          type="text/css"
          href={cssUrl}
        />
      ))}
      {Object.values(stylesheets).map(stylesheet => (
        <style className="WegasStyle" key={stylesheet.contentKey}>
          {stylesheet.content}
        </style>
      ))}
      <>
        { props.children }
      </>
    </>
  );
}