import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';
import { IVariableDescriptor, IScript } from 'wegas-ts-api';
import { ScriptableEntity } from 'wegas-ts-api';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
  context?: {
    [name: string]: unknown;
  },
  catchCB?: (e: Error) => void,
) {
  const descriptor = useScript<ScriptableEntity<T>>(script, context, catchCB);
  const instance = useVariableInstance<T>(
    (descriptor?.getEntity() as unknown) as T,
  );
  const notFound = descriptor == null || instance == null;
  return { content: script?.content, descriptor, instance, notFound };
}
