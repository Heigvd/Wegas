import * as React from 'react';
import { useStore } from '../../data/Stores/store';
import { State } from '../../data/Reducer/reducers';
import { GameModel } from '../../data/selectors';
import { classesCTX } from '../Contexts/ClassesProvider';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!wegas-ts-api/typings/WegasEntities.ts';
// @ts-ignore
import scriptableEntitiesSrc from '!!raw-loader!wegas-ts-api/typings/WegasScriptableEntities.d.ts.mlib';
// @ts-ignore
import editorGlobalSrc from '!!raw-loader!../../../types/scripts/EditorGlobals.d.ts';
// @ts-ignore
import clientMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ClientMethodGlobals.d.ts';
// @ts-ignore
import schemaGlobalSrc from '!!raw-loader!../../../types/scripts/SchemaGlobals.d.ts';
// @ts-ignore
import classesGlobalSrc from '!!raw-loader!../../../types/scripts/ClassesGlobals.d.ts';
// @ts-ignore
import popupsGlobalSrc from '!!raw-loader!../../../types/scripts/PopupsGlobals.d.ts';
// @ts-ignore
import wegasEventsGlobalSrc from '!!raw-loader!../../../types/scripts/WegasEventsGlobals.d.ts';
// @ts-ignore
import serverMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ServerMethodsGlobals.d.ts';
// @ts-ignore
import i18nGlobalSrc from '!!raw-loader!../../../types/scripts/I18nGlobals.d.ts';
// @ts-ignore
import APIMethodsGlobalSrc from '!!raw-loader!../../../types/scripts/APIMethodsGlobals.d.ts';
// @ts-ignore
import HelpersGlobalSrc from '!!raw-loader!../../../types/scripts/HelpersGlobals.d.ts';
// @ts-ignore
import generalTypes from '!!raw-loader!../../../types/general-types.d.ts';

import { wwarn } from '../../Helper/wegaslog';
import { buildGlobalServerMethods } from '../../data/Reducer/globalState';
import { deepDifferent } from './storeHookFactory';

const stripRegex = /\/\* STRIP FROM \*\/[\s\S]*?\/\* STRIP TO \*\//gm;

function makeAmbient(source: string) {
  return source.replace(stripRegex, '');
}

const ambientEntitiesSrc = makeAmbient(entitiesSrc);
const ambientScriptableEntitiesSrc = makeAmbient(scriptableEntitiesSrc);

// We'll keep it for later uses
// const cleanLib = (libSrc: string) => libSrc.replace(/^(export )/gm, '');

/**
 * ScriptContext - Depending on where the script will be executed different context can be chosen.
 *  Client : Client script, executed in client only
 *  Server internal : Server script, executed in server only
 *  Server external : Server script, executed in server but triggered by client.
 *
 * A script in a server external context can execute client script just before beeing
 * sent to server for execution with the help of runClientScript method.
 * The argument of this method should be string. The method will be parsed and the return value of the client
 * script will be injected into the server script.
 * In order for this trick to work, the server script must be passed in parseAndRunClientScript before beeing sent to the server.
 */
export type ScriptContext = 'Client' | 'Server internal' | 'Server external';

export function useGlobalLibs(scriptContext: ScriptContext) {
  const { classes } = React.useContext(classesCTX);

  const libsSelector = React.useCallback(
    (s: State) => {
      const variableClasses = Object.values(s.variableDescriptors).reduce<{
        [variable: string]: string;
      }>((newObject, variable) => {
        if (variable !== undefined && variable.name !== undefined) {
          newObject[variable.name] = variable['@class'];
        }
        return newObject;
      }, {});

      const globalMethods = s.global.clientMethods;
      const globalSchemas = s.global.schemas.views;
      const globalServerMethods = s.global.serverMethods;

      const currentLanguages = Object.values(
        GameModel.selectCurrent().languages,
      )
        .map(l => l.code)
        .join(' | ');

      const allowedPageLoadersType = Object.keys(s.global.pageLoaders)
        .map(name => `"${name}"`)
        .join('|');

      try {
        return `
        declare const gameModel : SGameModel;
        declare const self : SPlayer;
        declare const typeFactory: (types: WegasScriptEditorReturnTypeName[]) => GlobalMethodReturnTypesName;

        interface VariableClasses {
          ${Object.keys(variableClasses)
            .map(k => `${k}: S${variableClasses[k]};`)
            .join('\n')}
        }

        class Variable {
          static find: <T extends keyof VariableClasses>(
            gameModel: SGameModel,
            name: T
          ) => VariableClasses[T];
          ${
            scriptContext === 'Client'
              ? `static select: <T extends SVariableDescriptor>(
            _gm: unknown,
            id: number,
          ) => T | undefined;        
          static getItems: <T = SVariableDescriptor<SVariableInstance>>(
            itemsIds: number[],
          ) => Readonly<T[]>;`
              : ''
          }       
        }

        ${
          scriptContext === 'Server internal'
            ? `
        declare function runClientScript<T extends any = any>(clientScript:string) : T;`
            : ''
        }
        ${
          scriptContext === 'Client'
            ? `type CurrentLanguages = ${currentLanguages};
        type View = 'Editor' | 'Instance' | 'Export' | 'Public';
        declare const API_VIEW : View;
        interface EditorClass extends GlobalEditorClass {
          setLanguage: (lang: { code: SGameModelLanguage['code'] } | CurrentLanguages) => void;
        }
        declare const Editor: EditorClass & {
          setPageLoaders: (name: ${allowedPageLoadersType}, pageId: IScript) => void;
        };

        interface ClientMethods {
          ${Object.keys(globalMethods)
            .map(k => {
              const method = globalMethods[k];
              const isArray = method.returnStyle === 'array';
              return `'${k}' : (${method.parameters
                .map(p => `${p[0]} : ${p[1]}`)
                .join(', ')}) => ${
                isArray ? '(' : ''
              } ${method.returnTypes.join(' | ')}
               ${isArray ? ')[]' : ''};
              `;
            })
            .join('\n')}
        }

        interface ClientMethodClass extends GlobalClientMethodClass {
          getMethod: <T extends keyof ClientMethods>(name : T) => ClientMethods[T];
        }
        declare const ClientMethods : ClientMethodClass;

        type GlobalSchemas =
          ${
            Object.keys(globalSchemas).length
              ? Object.keys(globalSchemas).join('\n|')
              : 'never'
          };

        interface SchemaClass extends GlobalSchemaClass {
          removeSchema: (name: GlobalSchemas) => void;
        }
        declare const Schemas : SchemaClass;

        type GlobalClasses =
        ${classes.length === 0 ? 'never' : classes.join('\n| ')};
        interface ClassesClass extends GlobalClassesClass{
          removeClass: (className: GlobalClasses) => void;
        }
        declare const Classes : ClassesClass;

        declare const ServerMethods : GlobalServerMethodClass;

        declare const Popups : GlobalPopupClass;

        declare const WegasEvents : WegasEventClass;

        declare const I18n : GlobalI18nClass;

        declare const Context : {
          [id:string]:any;
        }
        
        declare const APIMethods : APIMethodsClass;

        declare const Helpers : GlobalHelpersClass;
        `
            : `${buildGlobalServerMethods(globalServerMethods)}`
        }
        `;
      } catch (e) {
        wwarn(e);
        return '';
      }
    },
    [classes, scriptContext],
  );

  const libs = useStore(libsSelector, deepDifferent);

  const globalLibs = React.useMemo(
    () => [
      {
        content: `
        ${ambientEntitiesSrc}\n
        ${ambientScriptableEntitiesSrc}\n
        ${generalTypes}\n
        ${editorGlobalSrc}\n
        ${clientMethodGlobalSrc}\n
        ${serverMethodGlobalSrc}\n
        ${schemaGlobalSrc}\n
        ${classesGlobalSrc}\n
        ${popupsGlobalSrc}\n
        ${wegasEventsGlobalSrc}\n
        ${i18nGlobalSrc}\n
        ${APIMethodsGlobalSrc}\n
        ${HelpersGlobalSrc}\n
        ${libs}\n
      `,
        name: 'VariablesTypes.d.ts',
      },
    ],
    [libs],
  );

  return globalLibs;
}
