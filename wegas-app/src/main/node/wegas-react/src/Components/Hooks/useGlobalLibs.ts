// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import generalTypes from '!!raw-loader!../../../types/general-types.d.ts';
// @ts-ignore
import APIMethodsGlobalSrc from '!!raw-loader!../../../types/scripts/APIMethodsGlobals.d.ts';
// @ts-ignore
import classesGlobalSrc from '!!raw-loader!../../../types/scripts/ClassesGlobals.d.ts';
// @ts-ignore
import clientMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ClientMethodGlobals.d.ts';
// @ts-ignore
import editorGlobalSrc from '!!raw-loader!../../../types/scripts/EditorGlobals.d.ts';
// @ts-ignore
import HelpersGlobalSrc from '!!raw-loader!../../../types/scripts/HelpersGlobals.d.ts';
// @ts-ignore
import i18nGlobalSrc from '!!raw-loader!../../../types/scripts/I18nGlobals.d.ts';
// @ts-ignore
import popupsGlobalSrc from '!!raw-loader!../../../types/scripts/PopupsGlobals.d.ts';
// @ts-ignore
import RolesMethodsGlobalSrc from '!!raw-loader!../../../types/scripts/RolesGlobals.d.ts';
// @ts-ignore
import schemaGlobalSrc from '!!raw-loader!../../../types/scripts/SchemaGlobals.d.ts';
// @ts-ignore
import SchemaHelper from '!!raw-loader!../../../types/scripts/SchemaHelper.d.ts';
// @ts-ignore
import serverMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ServerMethodsGlobals.d.ts';
// @ts-ignore
import WegasDashboardSrc from '!!raw-loader!../../../types/scripts/WegasDashboard.d.ts';
// @ts-ignore
import wegasEventsGlobalSrc from '!!raw-loader!../../../types/scripts/WegasEventsGlobals.d.ts';
// @ts-ignore
import entitiesSrc from '!!raw-loader!wegas-ts-api/typings/WegasEntities.ts';
// @ts-ignore
import scriptableEntitiesSrc from '!!raw-loader!wegas-ts-api/typings/WegasScriptableEntities.d.ts.mlib';
import * as React from 'react';
import { buildGlobalServerMethods } from '../../data/Reducer/globalState';
import { State } from '../../data/Reducer/reducers';
import { GameModel } from '../../data/selectors';
import { useStore } from '../../data/Stores/store';
import { wlog, wwarn } from '../../Helper/wegaslog';
import { classesCTX } from '../Contexts/ClassesProvider';
import { deepDifferent } from './storeHookFactory';

const stripRegex = /\/\* STRIP FROM \*\/[\s\S]*?\/\* STRIP TO \*\//gm;

function makeAmbient(source: string) {
  return source.replace(stripRegex, '');
}

const ambientEntitiesSrc = makeAmbient(entitiesSrc);
const ambientScriptableEntitiesSrc = makeAmbient(scriptableEntitiesSrc);

wlog(ambientScriptableEntitiesSrc);

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
export function useGlobalLibs(scriptContext: ScriptContext) {
  const { classes } = React.useContext(classesCTX);

  const libsSelector = React.useCallback(
    (s: State) => {
      const variableClasses = Object.values(s.variableDescriptors).reduce<{
        [variable: string]: { class: string; id: number };
      }>((newObject, variable) => {
        if (variable !== undefined && variable.name !== undefined) {
          newObject[variable.name] = {
            class: variable['@class'],
            id: variable.id!,
          };
        }
        return newObject;
      }, {});

      const globalMethods = s.global.clientMethods;
      const globalSchemas = s.global.schemas.views;
      const globalServerMethods = s.global.serverMethods;
      const currentLanguages = Object.values(
        GameModel.selectCurrent().languages,
      )
        .map(l => `"${l.code}"`)
        .join(' | ');

      const allowedPageLoadersType =
        Object.keys(s.global.pageLoaders).length > 0
          ? Object.keys(s.global.pageLoaders)
              .map(name => `"${name}"`)
              .join('|')
          : 'unknown';

      try {
        const internalLib = `
        declare const gameModel: SGameModel;
        declare const self: SPlayer;
        declare const schemaProps: SchemaPropsDefinedType;

        interface VariableClasses {
          ${Object.keys(variableClasses)
            .map(k => `${k}: S${variableClasses[k].class};`)
            .join('\n')}
        }

        interface VariableIds {
          ${Object.keys(variableClasses)
            .map(k => `${variableClasses[k].id}: S${variableClasses[k].class};`)
            .join('\n')}
        }

        type FindFN = <T extends keyof VariableClasses>(
          gameModel: SGameModel,
          name: T
        ) => VariableClasses[T]

        declare class Variable {
          static find: FindFN;
          ${
            scriptContext === 'Client'
              ? `static select: <T extends SVariableDescriptor>(
            _gm: unknown,
            id: number,
          ) => T | undefined;
          static getItems: <T = SVariableDescriptor>(
            itemsIds: number[],
          ) => Readonly<T[]>;`
              : ''
          }
        }

        ${
          scriptContext === 'Client'
            ? `type CurrentLanguages = ${currentLanguages};
        type View = 'Editor' | 'Instance' | 'Export' | 'Public';
        declare const API_VIEW : View;
        declare const CurrentGame : IGame;
        interface EditorClass extends GlobalEditorClass {
          setLanguage: (lang: { code: SGameModelLanguage['code'] } | CurrentLanguages) => void;
        }
        declare const Editor: EditorClass & {
          setPageLoaders: (name: ${allowedPageLoadersType}, pageId: IScript) => void;
        };

        interface ClientMethodList {
          ${Object.keys(globalMethods)
            .map(k => {
              const method = globalMethods[k];
              const isArray = method.returnStyle === 'array';
              return `'${k}' : (${method.parameters
                .map(p => `${p[0]} : ${p[1]}`)
                .join(', ')}) => ${isArray ? '(' : ''} ${
                method.returnTypes.length > 0
                  ? method.returnTypes.join(' | ')
                  : 'void'
              }
               ${isArray ? ')[]' : ''};
              `;
            })
            .join('\n')}
        }

        interface ClientMethodClass extends GlobalClientMethodClass {
          getMethod: <T extends keyof ClientMethodList>(name : T) => ClientMethodList[T];
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

        declare const Roles : RolesMehtods;
        `
            : `${buildGlobalServerMethods(globalServerMethods)}

        declare class WegasDashboard {
          static registerVariable:
            <T extends keyof VariableClasses> (
              variableName: T,
              config?: WegasDashboardVariableConfig<VariableClasses[T]>
            ) => void;
          static registerAction: WegasDashboardRegisterAction;
          static registerQuest: WegasDashboardRegisterQuest;
        }

        declare class Team {
          static find(id:numnber): STeam;
        }

        `
        }

        `;

        return internalLib;
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
        ${RolesMethodsGlobalSrc}\n
        ${SchemaHelper}\n
        ${WegasDashboardSrc}\n
        ${libs}\n
      `,
        name: 'VariablesTypes.d.ts',
      },
    ],
    [libs],
  );

  wlog(globalLibs);

  return globalLibs;
}
