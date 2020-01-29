import { Schema } from 'jsoninput';
import { AvailableViews } from './Components/FormView';
import { formValidation } from './formValidation';
import { entityIs } from '../data/entities';
import { editStateMachine, editVariable } from '../data/Reducer/globalState';
import { ThunkResult } from '../data/store';
import { TYPESTRING } from 'jsoninput/typings/types';
import { Icon, Icons } from './Components/Views/FontAwesome';

export type ConfigurationSchema<E> = Record<keyof E, Schema<AvailableViews>>;

// export type WegasMethodParameter = Schema<AvailableViews> & {
//   type:
//     | 'string'
//     | 'number'
//     | 'array'
//     | 'object'
//     | 'boolean'
//     | 'identifier'
//     | 'null';
// };

export type WegasTypeString = TYPESTRING | 'identifier';

export interface WegasMethodParameter {
  type?: WegasTypeString | WegasTypeString[];
  view: AvailableViews;
}

export interface WegasMethod {
  label: string;
  parameters: WegasMethodParameter[];
  returns: 'number' | 'string' | 'boolean';
}

export interface MethodConfig {
  [method: string]: WegasMethod;
}

/**
 * Traverse the schema, update each Schema in this schema with updater functions
 * @param schema Schema to visit
 * @param updater functions called on each schema, return values are piped into next
 * function and finally replace processed schema.
 */
export async function schemaUpdater(
  schema: SimpleSchema,
  ...updater: (<Ext extends {}>(schema: Ext) => {} | Promise<{}>)[]
) {
  const update: SimpleSchema = await updater.reduce(
    async (p, f) => f(await p),
    Promise.resolve({ ...schema }),
  );
  if ('properties' in update && update.properties != null) {
    const newProperties: { [props: string]: SimpleSchema } = {};
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

export async function methodConfigUpdater(
  config: MethodConfig,
  ...updater: (<Ext extends {}>(schema: Ext) => {} | Promise<{}>)[]
) {
  const newConfig: MethodConfig = {};
  for (const method in config) {
    const newParameters = (await Promise.all(
      config[method].parameters.map(
        async p => await schemaUpdater(p, ...updater),
      ),
    )) as MethodConfig['1']['parameters'];
    newConfig[method] = {
      ...config[method],
      parameters: newParameters,
    };
  }
  return newConfig;
}

/**
 * Download configuration schema
 * @param file filename
 */
async function fetchConfig(
  file: string,
): Promise<{ schema: Schema; methods: MethodConfig }> {
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
async function injectRef(schema: { $wref?: string }): Promise<Schema> {
  const { $wref, ...restSchema } = schema;
  if (typeof $wref === 'string') {
    const refSchema = await import('../../../generated-schema/' + $wref).then(
      res => res.schema,
    );
    return { ...refSchema, ...restSchema };
  }
  return restSchema;
}

export default async function getEditionConfig<T extends IAbstractEntity>(
  entity: T,
): Promise<Schema> {
  return fetchConfig(entity['@class'] + '.json').then(res => {
    return schemaUpdater(
      res.schema,
      injectRef,
      updateVisibility,
      updatedErrored,
    );
  });
}

export interface EActions {
  edit: (
    variable: IAbstractEntity,
    path?: (number | string)[],
    config?: Schema<AvailableViews>,
  ) => ThunkResult;
}

export async function getEntityActions(
  entity: IAbstractEntity,
): Promise<EActions> {
  if (
    entityIs(entity, 'FSMDescriptor') ||
    entityIs(entity, 'DialogueDescriptor')
  ) {
    return { edit: editStateMachine };
  }
  return { edit: editVariable };
}

export async function getMethodConfig<T extends IAbstractEntity>(
  entity: T,
): Promise<MethodConfig> {
  return fetchConfig(entity['@class'] + '.json').then(res =>
    methodConfigUpdater(res.methods, injectRef),
  );
}

export function getIcon<T extends IAbstractEntity>(
  entity: T,
): Icons | undefined {
  switch (entity['@class'] as WegasClassNames) {
    case 'ChoiceDescriptor':
      return 'check-square';
    case 'FSMDescriptor':
      return 'project-diagram';
    case 'ListDescriptor':
      return 'folder';
    case 'NumberDescriptor':
      return ['circle', { value: 'ℝ', color: 'white', fontSize: '0.7em' }];
    case 'QuestionDescriptor':
      return 'question-circle';
    case 'Result':
      return 'cog';
    case 'SingleResultChoiceDescriptor':
      return 'check-square';
    case 'BooleanDescriptor':
      return 'toggle-on';
    case 'ObjectDescriptor':
      return 'shopping-bag';
    case 'StringDescriptor':
      return 'font';
    case 'TextDescriptor':
      return 'paragraph';
    case 'TriggerDescriptor':
      return 'random';
    case 'WhQuestionDescriptor':
      return ['square-full', { icon: 'question', color: 'white', size: 'xs' }];
    case 'InboxDescriptor':
      return 'envelope';
    case 'DialogueDescriptor':
      return 'comments';
    case 'ResourceDescriptor':
      return 'user';
    case 'PeerReviewDescriptor':
      return 'user-friends';
    case 'TaskDescriptor':
      return 'list-ol';
    case 'EvaluationDescriptorContainer':
      return 'eye';
    case 'GradeDescriptor':
      return 'arrows-alt-h';
    case 'TextEvaluationDescriptor':
      return 'book-reader';
    case 'CategorizedEvaluationDescriptor':
      return 'clipboard-list';
  }
}

export function getLabel<T extends IAbstractEntity>(
  entity: T,
): string | undefined {
  switch (entity['@class'] as WegasClassNames) {
    case 'ChoiceDescriptor':
      return 'Choice';
    case 'FSMDescriptor':
      return 'State Machine';
    case 'ListDescriptor':
      return 'Folder';
    case 'NumberDescriptor':
      return 'Number';
    case 'QuestionDescriptor':
      return 'Question';
    case 'Result':
      return 'Result';
    case 'SingleResultChoiceDescriptor':
      return 'Single Result Choice';
    case 'BooleanDescriptor':
      return 'Boolean';
    case 'ObjectDescriptor':
      return 'Object';
    case 'StringDescriptor':
      return 'String';
    case 'TextDescriptor':
      return 'Text';
    case 'TriggerDescriptor':
      return 'Trigger';
    case 'WhQuestionDescriptor':
      return 'Open question';
    case 'InboxDescriptor':
      return 'Inbox';
    case 'DialogueDescriptor':
      return 'Dialogue';
    case 'ResourceDescriptor':
      return 'Resource';
    case 'PeerReviewDescriptor':
      return 'Peer review';
    case 'TaskDescriptor':
      return 'Task';
    case 'GradeDescriptor':
      return 'Grade';
    case 'TextEvaluationDescriptor':
      return 'Text evaluation';
    case 'CategorizedEvaluationDescriptor':
      return 'Categorized evaluation';
  }
  return '';
}
export const ListDescriptorChild = [
  'NumberDescriptor',
  'StringDescriptor',
  'ListDescriptor',
  'TextDescriptor',
  'TaskDescriptor',
  'BooleanDescriptor',
  'ObjectDescriptor',
  'TriggerDescriptor',
  'QuestionDescriptor',
  'WhQuestionDescriptor',
  'InboxDescriptor',
  'DialogueDescriptor',
  'ResourceDescriptor',
  'PeerReviewDescriptor',
  'FSMDescriptor',
] as const;
const QuestionDescriptorChild = [
  'SingleResultChoiceDescriptor',
  'ChoiceDescriptor',
] as const;
const WhQuestionDescriptorChild = [
  'NumberDescriptor',
  'StringDescriptor',
  'TextDescriptor',
  'BooleanDescriptor',
] as const;
const EvaluationDescriptorContainerChild = [
  'GradeDescriptor',
  'TextEvaluationDescriptor',
  'CategorizedEvaluationDescriptor',
] as const;
const ChoiceDescriptorChild = ['Result'] as const;
export async function getChildren<T extends IAbstractEntity>(
  entity: T,
): Promise<readonly string[]> {
  switch (entity['@class']) {
    case 'ListDescriptor':
      return ListDescriptorChild;
    case 'QuestionDescriptor':
      return QuestionDescriptorChild;
    case 'WhQuestionDescriptor':
      return WhQuestionDescriptorChild;
    case 'ChoiceDescriptor':
      return ChoiceDescriptorChild;
    case 'EvaluationDescriptorContainer':
      return EvaluationDescriptorContainerChild;
    default:
      return [];
  }
}
