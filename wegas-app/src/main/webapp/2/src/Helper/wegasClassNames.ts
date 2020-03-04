export function toScriptableClassName(classes?: WegasClassNames[]) {
  return classes
    ? classes.map(c => {
        return ('IS' + c) as WegasScriptEditorReturnTypeName;
      })
    : undefined;
}
