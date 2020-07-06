import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
) {
  const descriptor = useScript<T>(script?.content);
  const instance = useVariableInstance(descriptor);
  const notFound = descriptor == null || instance == null;
  return { content: script?.content, descriptor, instance, notFound };
}
