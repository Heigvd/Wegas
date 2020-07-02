import { WegasClassNames, IScript } from "wegas-ts-api/typings/WegasEntities";

export function toScriptableClassName(classes?: WegasClassNames[]) {
  return classes
    ? classes.map(c => {
        return ('IS' + c) as WegasScriptEditorReturnTypeName;
      })
    : undefined;
}

export function scriptableClassNameToClassFilter(
  classes?: WegasScriptEditorReturnTypeName[],
) {
  return classes
    ? classes.filter(c => c.indexOf('IS') === 0).map(c => c.substring(2))
    : undefined;
}

export function createScript(
  content: string = '',
  language: string = 'JavaScript',
): IScript {
  return { '@class': 'Script', content, language };
}
