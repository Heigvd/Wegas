import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';
import { IVariableDescriptor, IScript } from 'wegas-ts-api/typings/WegasEntities';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
) {
  const descriptor = useScript<T>(script?.content);
  const instance = useVariableInstance<T>(descriptor);
  const notFound = descriptor == null || instance == null;
  return { content: script?.content, descriptor, instance, notFound };
}
