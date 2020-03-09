import { useScript } from './useScript';
import { useVariableInstance } from './useVariable';

export function useComponentScript<T extends IVariableDescriptor>(
  script?: IScript,
) {
  const content = script ? script.content : '';
  const descriptor = useScript(content) as T;
  const instance = useVariableInstance(descriptor) as T['defaultInstance'];
  const notFound =
    script == null || content === '' || descriptor == null || instance == null;
  return { content, descriptor, instance, notFound };
}
