import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';
import { IVariableDescriptor, IScript } from 'wegas-ts-api';
import { ScriptableEntity } from 'wegas-ts-api';
import { wwarn } from '../../Helper/wegaslog';

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
  if (notFound) {
    wwarn(`${script?.content} Not found`);
  }
  return { content: script?.content, descriptor, instance, notFound };
}
