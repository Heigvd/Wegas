import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';
import { IVariableDescriptor, IScript } from 'wegas-ts-api/typings/WegasEntities';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
) {
  const content = script ? script.content : '';
  const descriptor = useScript<T>(content);
  const instance = useVariableInstance<T>(descriptor);
  const notFound = descriptor == null || instance == null;
  return { content, descriptor, instance, notFound };
}
