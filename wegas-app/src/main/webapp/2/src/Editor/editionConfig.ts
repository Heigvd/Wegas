import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Schema } from 'jsoninput';
import { StateActions } from '../data/actions';
import { AvailableViews } from './Components/FormView';
import { formValidation } from './validation';

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

/* @TODO REMOVE ME. used in configs only */
export const SELFARG = {
  type: 'identifier' as 'identifier',
  value: 'self',
  const: 'self',
  view: { type: 'hidden' } as AvailableViews,
};
/**
 * Traverse the schema, update each Schema in this schema with updater functions
 * @param schema Schema to visit
 * @param updater functions called on each schema, return values are piped into next
 * function and finally replace processed schema.
 */
export async function schemaUpdater(
  schema: Schema,
  ...updater: (<Ext extends Schema.BASE = Schema.BASE>(
    schema: Ext,
  ) => Schema | Promise<Schema>)[]
) {
  const update = await updater.reduce(
    async (p, f) => f(await p),
    Promise.resolve({ ...schema }),
  );
  if ('properties' in update && update.properties != null) {
    const newProperties: Schema.Object['properties'] = {};
    await Promise.all(
      Object.entries(update.properties).map(async e => {
        const u = await schemaUpdater(e[1], ...updater);
        newProperties[e[0]] = u;
      }),
    );
    update.properties = newProperties;
  }
  if ('additionalProperties' in update && update.additionalProperties != null) {
    update.additionalProperties = await schemaUpdater(
      update.additionalProperties,
      ...updater,
    );
  }
  if ('items' in update && update.items != null) {
    if (Array.isArray(update.items)) {
      update.items = await Promise.all(
        update.items.map(i => schemaUpdater(i, ...updater)),
      );
    } else {
      update.items = await schemaUpdater(update.items, ...updater);
    }
  }
  return update;
}
/**
 * Download configuration schema
 * @param file filename
 */
async function fetchConfig(
  file: string,
): Promise<{ schema: Schema; method: MethodConfig }> {
  return import(
    /* webpackChunkName: "Config-[request]", webpackPrefetch: true */
    '../../../generated-schema/' + file
  );
}
type formValidationSchema = Parameters<typeof formValidation>[0];
/**
 * Transform schema's visible field from (server side generated) validation Schema into function
 * @param schema
 */
function updateVisibility(schema: Schema.BASE) {
  const { visible, ...restSchema } = schema as Merge<
    Schema.BASE,
    { visible?: formValidationSchema }
  >;
  if (visible == null) {
    return restSchema;
  }
  return { ...restSchema, visible: formValidation(visible) };
}
function updatedErrored(
  schema: Merge<
    Schema.BASE,
    { erroreds?: { condition: formValidationSchema; message: string }[] }
  >,
): Schema.BASE {
  const { erroreds, ...restSchema } = schema;
  if (schema.errored != null || erroreds == null) {
    return restSchema;
  }
  const errorFn = (...args: Parameters<ReturnType<typeof formValidation>>) =>
    erroreds
      .map(({ condition, message }) =>
        formValidation(condition)(...args) ? message : '',
      )
      .filter(v => v)
      .join(', ');
  return { ...restSchema, errored: errorFn };
}
/**
 * Inject relative schema into a given schema (wref)
 * @param schema schema to update
 */
async function injectRef(
  schema: Schema.BASE & { $wref?: string },
): Promise<Schema> {
  const { $wref, ...restSchema } = schema;
  if (typeof $wref === 'string') {
    const refSchema = await import('../../../generated-schema/' + $wref).then(
      res => res.schema,
    );
    return { ...refSchema, ...restSchema };
  }
  return restSchema;
}

export default async function getEditionConfig<T extends IWegasEntity>(
  entity: T,
): Promise<Schema> {
  return fetchConfig(entity['@class'] + '.json').then(res =>
    schemaUpdater(res.schema, injectRef, updateVisibility, updatedErrored),
  );
}

export async function getAvailableChildren<T extends IWegasEntity>(
  entity: T,
): Promise<string[]> {
  return import(
    /* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
      entity['@class']
  ).then(res => res.children);
}

export interface EActions<T extends IWegasEntity> {
  edit: (variable: T, path?: string[]) => StateActions;
}

export async function getEntityActions<T extends IWegasEntity>(
  entity: T,
): Promise<EActions<T>> {
  return import(
    /* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
      entity['@class']
  ).then(res => res.actions);
}

export async function getMethodConfig<T extends IWegasEntity>(
  entity: T,
): Promise<MethodConfig> {
  return fetchConfig(entity['@class'] + '.json').then(res => res.method);
}

export async function getIcon<T extends IWegasEntity>(
  entity: T,
): Promise<IconProp | undefined> {
  return import(
    /* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
      entity['@class']
  ).then(({ icon }) => icon);
}

export async function getLabel<T extends IWegasEntity>(
  entity: T,
): Promise<string | undefined> {
  return await import(
    /* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
      entity['@class']
  ).then(({ label }) => label);
}

export async function getChildren<T extends IWegasEntity>(
  entity: T,
): Promise<string[]> {
  return import(
    /* webpackChunkName: "FormConfig", webpackMode: "lazy-once" */ './EntitiesConfig/' +
      entity['@class']
  ).then(({ children }) => children || []);
}
