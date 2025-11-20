import * as React from 'react';
import { IGameModelContent } from 'wegas-ts-api';
import {
  ILibraries,
  LibraryAPI,
} from '../../API/library.api';
import { useWebsocketEvent } from '../../API/websocket';
import { ActionCreator } from '../../data/actions';
import { useIsReadyForClientScript } from '../../data/selectors/InitStatusesSelector';
import { store } from '../../data/Stores/store';
import { getLogger } from '../../Helper/wegaslog';
import { clearModule } from '../Hooks/sandbox';
import {
  setGlobals,
  useGlobalContexts,
} from '../Hooks/useScript';
import { execAllScripts } from './clientScriptEvaluation';

const librariesLoaderLogger = getLogger('ClientLibrariesLoader');

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
          execAllScripts(libraries, librariesLoaderLogger);
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
            execAllScripts(newCs, librariesLoaderLogger);
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