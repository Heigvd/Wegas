import { TrainerDropMenu } from './DropMenu';
import { TableView } from './TableView';

export const components = {
  TableView: TableView,
  DropMenu: TrainerDropMenu,
} as const;

export interface ReactTransformer<K extends keyof typeof components> {
  component: K;
  props: Parameters<typeof components[K]>[0];
}

export function transformerIsReact<K extends keyof typeof components>(
  transformerOutput: string | ReactTransformer<K>,
): transformerOutput is ReactTransformer<K> {
  return (
    typeof transformerOutput === 'object' &&
    'component' in transformerOutput &&
    Object.keys(components).includes(transformerOutput.component)
  );
}
