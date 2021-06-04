import * as React from 'react';
import { HTMLText } from '../../../Components/Outputs/HTMLText';
import { TrainerDropDown } from './DropDown';
import { TableView } from './TableView';

export const components = {
  TableView: TableView,
  DropDown: TrainerDropDown,
} as const;

export type TrainerComponent = typeof components;
export type TrainerComponentKey = keyof TrainerComponent;

export interface ReactTransformer<K extends TrainerComponentKey> {
  component: K;
  props: Parameters<TrainerComponent[K]>[0];
}

export function transformerIsReact<K extends TrainerComponentKey>(
  transformerOutput: string | ReactTransformer<K>,
): transformerOutput is ReactTransformer<K> {
  return (
    typeof transformerOutput === 'object' &&
    'component' in transformerOutput &&
    Object.keys(components).includes(transformerOutput.component)
  );
}

export function componentOrRawHTML<K extends TrainerComponentKey>(
  transformerOutput: string | ReactTransformer<K>,
) {
  if (transformerIsReact(transformerOutput)) {
    const TrainerComponent = components[
      transformerOutput.component
    ] as React.FunctionComponent<{}>;
    return <TrainerComponent {...(transformerOutput.props as {})} />;
  } else {
    return <HTMLText text={transformerOutput} />;
  }
}
