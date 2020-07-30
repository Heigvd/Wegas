import { WegasClassNames, IScript } from 'wegas-ts-api';

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
