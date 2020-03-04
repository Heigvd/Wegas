import * as React from 'react';
import { useStore } from '../../data/store';
import { State } from '../../data/Reducer/reducers';
import { GameModel } from '../../data/selectors';
import { MonacoDefinitionsLibraries } from '../../Editor/Components/ScriptEditors/SrcEditor';
import { classesCTX } from '../Contexts/ClassesProvider';

// using raw-loader works but you need to put the whole file name and ts doesn't like it
// @ts-ignore
import entitiesSrc from '!!raw-loader!../../../types/generated/WegasScriptableEntities.d.ts';
// @ts-ignore
import editorGlobalSrc from '!!raw-loader!../../../types/scripts/EditorGlobals.d.ts';
// @ts-ignore
import clientMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ClientMethodGlobals.d.ts';
// @ts-ignore
import schemaGlobalSrc from '!!raw-loader!../../../types/scripts/SchemaGlobals.d.ts';
// @ts-ignore
import classesGlobalSrc from '!!raw-loader!../../../types/scripts/ClassesGlobals.d.ts';
// @ts-ignore
import serverMethodGlobalSrc from '!!raw-loader!../../../types/scripts/ServerMethodsGlobals.d.ts';

import { refDifferent } from './storeHookFactory';

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

    const currentLanguages = Object.values(
      GameModel.selectCurrent().languages,
    ).reduce((lt, l) => `${lt} | '${l.code}'`, '');

    return `
        declare const gameModel : ISGameModel;
        declare const self : ISPlayer;
        declare const typeFactory: (types: WegasScriptEditorReturnTypeName[]) => GlobalMethodReturnTypesName;
      
        interface VariableClasses {${Object.keys(variableClasses).reduce(
          (s, k) => s + k + ':IS' + variableClasses[k] + ';\n',
          '',
        )}}
        class Variable {
          static find: <T extends keyof VariableClasses>(
            gameModel: ISGameModel,
            name: T
          ) => VariableClasses[T];
        }
    
        type CurrentLanguages = ${currentLanguages};
        interface EditorClass extends GlobalEditorClass {
          setLanguage: (lang: { code: ISGameModelLanguage['code'] } | CurrentLanguages) => void;
        }
        declare const Editor: EditorClass;
    
        interface ClientMethods {\n${Object.keys(globalMethods).reduce(
          (s, k) => {
            const method = globalMethods[k];
            const isArray = method.returnStyle === 'array';
            return (
              s +
              `'${k}' : () => ${
                isArray ? ' (' : ' '
              } ${method.returnTypes.reduce(
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

        declare const RequestManager : WRequestManager;
        declare const Event : WEvent;
        declare const DelayedEvent : WDelayedEvent;

        `;
  }, refDifferent);

  React.useEffect(() => {
    globalLibs.current = [
      {
        content: `
            ${entitiesSrc}\n
            ${editorGlobalSrc}\n
            ${clientMethodGlobalSrc}\n
            ${serverMethodGlobalSrc}\n
            ${schemaGlobalSrc}\n
            ${classesGlobalSrc}\n
            ${libs}\n
          `,
        name: 'VariablesTypes.d.ts',
      },
    ];
  }, [libs]);

  return globalLibs.current;
}
