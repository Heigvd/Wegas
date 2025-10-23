import { setReloadingStatus } from '../../data/Stores/pageContextStore';
import { clearEffects, runEffects } from '../../Helper/pageEffectsManager';
import { printWegasScriptError, safeClientScriptEval } from '../Hooks/useScript';
import { computeLibraryPath } from './LibrariesContext';
import { ILibraries } from '../../API/library.api';
import { Logger } from '../../Helper/wegaslog';


type ScriptName = string;
type ScriptContent = string;

type ScriptEntry = [ScriptName, ScriptContent];

type SetErrorStatusFunc = ((path: string, error: string) => void) | undefined;

/**
 *Execute all client script
 */
export function execAllScripts(libraries: ILibraries, logger: Logger, setErrorStatus: SetErrorStatusFunc = undefined) {
  // set PageStore reloading status to true to prevent usePagesContextStateStore  hooks to be triggered
  setReloadingStatus(true);
  clearEffects();

  const scripts : ScriptEntry[] = Object.entries(libraries).map(([name, gmContent]) => ([name, gmContent.content]));
  orderScripts(scripts);

  let i = 0;
  scripts.forEach(([libName, libContent]) => {
    logger.debug('SCRIPT EVAL', i++, libName);
    executeClientLibrary(libName, libContent, logger, setErrorStatus);
  });

  runEffects();
  // resumes pagesStore status, hooks will be triggered
  setReloadingStatus(false);
}

function executeClientLibrary(
  libraryName: string,
  libraryContent: string,
  logger: Logger,
  setErrorStatus: SetErrorStatusFunc,
) {
  const path = computeLibraryPath(libraryName, 'client');
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
  if(setErrorStatus) {
    setErrorStatus(path, error);
  }
  if (error) {
    logger.warn(error);
  }
}

/**
 * The scripts are ordered alphabetically on full path name by default.
 * This ordering can be overridden using the EVALUATION_PRIORITY (X) pragma
 * which can be inserted as a single line comment at the beginning of the script content.
 * X is an integer
 * Example :
 * // EVALUATION_PRIORITY 10
 * The lower the number the earlier the evaluation occurs
 * scripts that have equal or no priority are sorted alphabetically
 * scripts that have no priority are evaluated after all the scripts with a defined priority
 * @param scripts
 */
function orderScripts(scripts: ScriptEntry[]): void {

  const regex = /\/\/\s*EVALUATION_PRIORITY\s+(-?\d+)/;
  const pragmaPriority : Record<string, number> = {};
  scripts.forEach(([name, content]: ScriptEntry) => {
    // match on the beginning of the file only
    const match = content?.substring(0,40).match(regex);
    if(match && !isNaN(Number(match[1]))){
      pragmaPriority[name] = Number(match[1]);
    }else{
      pragmaPriority[name] = Number.MAX_SAFE_INTEGER / 2;
    }
  });

  scripts.sort(([aName, _a],[bName, _b]) => {
    const prioA = pragmaPriority[aName];
    const prioB = pragmaPriority[bName];
    if(prioA === prioB) {
      return aName.localeCompare(bName);
    }
    return prioA - prioB;
  });

}
