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

export interface ReactFormatter<K extends TrainerComponentKey> {
  component: K;
  props: Parameters<TrainerComponent[K]>[0];
}

export function formatterIsReact<K extends TrainerComponentKey>(
  formatterOutput: string | ReactFormatter<K>,
): formatterOutput is ReactFormatter<K> {
  return (
    typeof formatterOutput === 'object' &&
    'component' in formatterOutput &&
    Object.keys(components).includes(formatterOutput.component)
  );
}

export function componentOrRawHTML<K extends TrainerComponentKey>(
  formatterOutput: string | ReactFormatter<K>,
) {
  if (formatterIsReact(formatterOutput)) {
    const TrainerComponent = components[
      formatterOutput.component
    ] as React.FunctionComponent;
    return <TrainerComponent {...(formatterOutput.props as AnyValuesObject)} />;
  } else {
    return <HTMLText text={formatterOutput} />;
  }
}
