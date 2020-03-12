import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
) {
  const content = script ? script.content : '';
  const descriptor = useScript(content) as T | undefined;
  const instance = useVariableInstance(descriptor) as
    | T['defaultInstance']
    | undefined;
  const notFound = descriptor == null || instance == null;
  return { content, descriptor, instance, notFound };
}
