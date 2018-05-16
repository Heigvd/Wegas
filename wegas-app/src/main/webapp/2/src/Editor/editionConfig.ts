import { Schema } from 'jsoninput';
import { AvailableViews } from './Components/FormView';
import { Actions } from '../data';
import { StateActions } from '../data/actions';

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
interface EActions {
  edit: (variable: IWegasEntity, path?: string[]) => StateActions;
}
export type EntityActions = Partial<EActions>;
// default Actions
const entityActions: EActions = {
  edit: Actions.EditorActions.editVariable,
};
export async function getEntityActions<T extends IWegasEntity>(
  entity: T,
): Promise<EActions> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(res => ({ ...entityActions, ...res.actions }));
}
