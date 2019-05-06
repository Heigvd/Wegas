import { Schema } from 'jsoninput';
import { AvailableViews } from './Components/FormView';
import { StateActions } from '../data/actions';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type ConfigurationSchema<E> = Record<keyof E, Schema<AvailableViews>>;

export interface MethodConfig {
  [method: string]: {
    label: string;
    parameters: {
      type: 'string' | 'number' | 'boolean' | 'identifier' | 'array' | 'object';
      value?: {};
      properties?: {};
      additionalProperties?: {};
      items?: {};
      const?: string;
      required?: boolean;
      view?: AvailableViews;
    }[];
    returns?: 'number' | 'string' | 'boolean';
  };
}

export const SELFARG = {
  type: 'identifier' as 'identifier',
  value: 'self',
  const: 'self',
  view: { type: 'hidden' } as AvailableViews,
};

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

export interface EActions<T extends IWegasEntity> {
  edit: (variable: T, path?: string[]) => StateActions;
}

export async function getEntityActions<T extends IWegasEntity>(
  entity: T,
): Promise<EActions<T>> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(res => res.actions);
}

export async function getMethodConfig<T extends IWegasEntity>(
  entity: T,
): Promise<MethodConfig> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(res => ({ ...res.methods }));
}

export async function getIcon<T extends IWegasEntity>(
  entity: T,
): Promise<IconProp | undefined> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(({ icon }) => icon);
}

export async function getLabel<T extends IWegasEntity>(
  entity: T,
): Promise<string | undefined> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(({ label }) => label);
}

export async function getChildren<T extends IWegasEntity>(
  entity: T,
): Promise<string[]> {
  return await import(/* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
    entity['@class']).then(({ children }) => children || []);
}
