export function classOrNothing(
  className: string,
  enable: boolean | undefined | null,
) {
  return enable ? ' ' + className : '';
}

export function classNameOrEmpty(className?: string) {
  return classOrNothing(className || '', className != null);
}
