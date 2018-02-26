import { Schema } from 'jsoninput';
import { AvailableViews } from './Components/FormView';

export type ConfigurationSchema<E> = Record<keyof E, Schema<AvailableViews>>;

export default async function getEditionConfig<T extends IWegasEntity>(
  entity: T,
): Promise<ConfigurationSchema<T>> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(res => res.config);
}
export async function getAvailableChildren<T extends IWegasEntity>(
  entity: T,
): Promise<string[]> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(res => res.children);
}
