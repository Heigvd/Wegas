import { WegasClassNames, IScript, SVariableDescriptor } from 'wegas-ts-api';

export function toScriptableClassName(classes?: WegasClassNames[]) {
  return classes
    ? classes.map(c => {
        return ('S' + c) as WegasScriptEditorReturnTypeName;
      })
    : undefined;
}

export function scriptableClassNameToClassFilter(
  classes?: WegasScriptEditorReturnTypeName[],
) {
  return classes
    ? classes.filter(c => c.indexOf('S') === 0).map(c => c.substring(1))
    : undefined;
}

export function createScript(
  content: string = '',
  language: string = 'JavaScript',
): IScript {
  return { '@class': 'Script', content, language };
}

export function isScript(tested: any): tested is IScript {
  return (
    tested != null &&
    typeof tested === 'object' &&
    '@class' in tested &&
    tested['@class'] === 'Script'
  );
}

export function createFindVariableScript<
  T extends Readonly<SVariableDescriptor> | undefined,
>(variable?: T): T extends undefined ? undefined : IScript {
  return variable
    ? ({
        '@class': 'Script',
        content: `Variable.find(gameModel, "${variable.getName()}")`,
        language: 'JavaScript',
      } as any)
    : (undefined as any);
}
