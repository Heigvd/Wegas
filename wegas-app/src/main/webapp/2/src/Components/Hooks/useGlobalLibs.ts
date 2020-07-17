import * as React from 'react';
import { useStore } from '../../data/store';
import { State } from '../../data/Reducer/reducers';
import { GameModel } from '../../data/selectors';
import { MonacoDefinitionsLibraries } from '../../Editor/Components/ScriptEditors/SrcEditor';
import { classesCTX } from '../Contexts/ClassesProvider';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!wegas-ts-api/typings/WegasScriptableEntities.d.ts';
// @ts-ignore
import editorGlobalSrc from '../../../types/scripts/EditorGlobals.d.ts';
// @ts-ignore
import clientMethodGlobalSrc from '../../../types/scripts/ClientMethodGlobals.d.ts';
// @ts-ignore
import schemaGlobalSrc from '../../../types/scripts/SchemaGlobals.d.ts';
// @ts-ignore
import classesGlobalSrc from '../../../types/scripts/ClassesGlobals.d.ts';
// @ts-ignore
import modalsGlobalSrc from '../../../types/scripts/ModalsGlobals.d.ts';
// @ts-ignore
import wegasEventsGlobalSrc from '../../../types/scripts/WegasEventsGlobals.d.ts';
// @ts-ignore
import serverMethodGlobalSrc from '../../../types/scripts/ServerMethodsGlobals.d.ts';

import { refDifferent } from './storeHookFactory';
import { wwarn } from '../../Helper/wegaslog';
import { buildGlobalServerMethods } from '../../data/Reducer/globalState';

const stripRegex = /\/\* STRIP FROM \*\/[\s\S]*?\/\* STRIP TO \*\//gm;

function makeAmbient(source: string) {
  return source.replace(stripRegex, '');
}

const ambientEntitiesSrc = makeAmbient(entitiesSrc);

// We'll keep it for later uses
// const cleanLib = (libSrc: string) => libSrc.replace(/^(export )/gm, '');

export function useGlobalLibs() {
  const globalLibs = React.useRef<MonacoDefinitionsLibraries[]>([]);
  const { classes } = React.useContext(classesCTX);

  const libs = useStore((s: State) => {
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
    ).reduce((lt, l) => `${lt} | '${l.code}'`, '');

    // wlog(buildGlobalServerMethods(globalServerMethods));

    try {
      return `
        declare const gameModel : SGameModel;
        declare const self : SPlayer;
        declare const typeFactory: (types: WegasScriptEditorReturnTypeName[]) => GlobalMethodReturnTypesName;

        interface VariableClasses {${Object.keys(variableClasses).reduce(
          (s, k) => s + k + ':S' + variableClasses[k] + ';\n',
          '',
        )}}
        class Variable {
          static find: <T extends keyof VariableClasses>(
            gameModel: SGameModel,
            name: T
          ) => VariableClasses[T];
        }

        type CurrentLanguages = ${currentLanguages};
        interface EditorClass extends GlobalEditorClass {
          setLanguage: (lang: { code: SGameModelLanguage['code'] } | CurrentLanguages) => void;
        }
        declare const Editor: EditorClass;

        interface ClientMethods {\n${Object.keys(globalMethods).reduce(
          (s, k) => {
            const method = globalMethods[k];
            const isArray = method.returnStyle === 'array';
            return (
              s +
              `'${k}' : (${method.parameters.reduce(
                (o, entry, i, arr) =>
                  o +
                  `${entry[0]} : ${entry[1]}` +
                  (i !== arr.length - 1 ? ',' : ''),
                '',
              )}) => ${isArray ? ' (' : ' '} ${method.returnTypes.reduce(
                (s, t, i) => s + (i > 0 ? ' | ' : '') + t,
                '',
              )} ${isArray ? ')[]' : ''};\n`
            );
          },
          '',
        )}}
        interface ClientMethodClass extends GlobalClientMethodClass {
          getMethod: <T extends keyof ClientMethods>(name : T) => ClientMethods[T];
        }
        declare const ClientMethods : ClientMethodClass;

        type GlobalSchemas = ${Object.keys(globalSchemas).reduce(
          (s, k) => s + `\n  | '${k}'`,
          '',
        )}}
        interface SchemaClass extends GlobalSchemaClass {
          removeSchema: (name: GlobalSchemas) => void;
        }
        declare const Schemas : SchemaClass;

        type GlobalClasses = ${
          classes.length === 0
            ? 'never'
            : classes.reduce((oc, c) => oc + `\n  | '${c}'`, '')
        }}
        interface ClassesClass extends GlobalClassesClass{
          removeClass: (className: GlobalClasses) => void;
        }
        declare const Classes : ClassesClass;

        declare const ServerMethods : GlobalServerMethodClass;

        declare const Modals : GlobalModalClass;

        declare const WegasEvents : WegasEventClass;

        ${buildGlobalServerMethods(globalServerMethods)}
        `;
    } catch (e) {
      wwarn(e);
      return '';
    }
  }, refDifferent);

  React.useEffect(() => {
    globalLibs.current = [
      {
        content: `
            ${ambientEntitiesSrc}\n
            ${editorGlobalSrc}\n
            ${clientMethodGlobalSrc}\n
            ${serverMethodGlobalSrc}\n
            ${schemaGlobalSrc}\n
            ${classesGlobalSrc}\n
            ${modalsGlobalSrc}\n
            ${wegasEventsGlobalSrc}\n
            ${libs}\n
          `,
        name: 'VariablesTypes.d.ts',
      },
    ];
  }, [libs]);

  return globalLibs.current;
}
