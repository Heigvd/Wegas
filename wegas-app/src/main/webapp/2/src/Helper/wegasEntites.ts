export function toScriptableClassName(classes?: WegasClassNames[]) {
  return classes
    ? classes.map(c => {
        return ('IS' + c) as WegasScriptEditorReturnTypeName;
      })
    : undefined;
}

export function createScript(
  content: string = '',
  language: string = 'JavaScript',
): IScript {
  return { '@class': 'Script', content, language };
}
