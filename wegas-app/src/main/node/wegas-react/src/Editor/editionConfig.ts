import { Schema } from 'jsoninput';
// import { TYPESTRING } from 'jsoninput/typings/types';
import {
  IAbstractEntity,
  IMergeable,
  JSONLoader,
  WegasClassNames,
} from 'wegas-ts-api';
import { entityIs } from '../data/entities';
import { editStateMachine, editVariable } from '../data/Reducer/editingState';
import { EditingThunkResult } from '../data/Stores/editingStore';
import { wwarn } from '../Helper/wegaslog';
import { AvailableSchemas, AvailableViews } from './Components/FormView';
import { Icons } from './Components/Views/FontAwesome';
import { formValidation } from './formValidation';

export type WegasMethodParameter = {
  type: WegasTypeString;
} & AvailableSchemas;

export const wegasMethodReturnValues = ['number', 'string', 'boolean'] as const;

export interface MethodConfig {
  label: string;
  parameters: WegasMethodParameter[];
  returns?: WegasMethodReturnType;
}

export function isWegasMethodReturnType(
  value: string,
): value is WegasMethodReturnType {
  return (wegasMethodReturnValues as readonly string[]).includes(value);
}

export type MethodsConfig = Record<string, MethodConfig>;

/**
 * Traverse the schema, update each Schema in this schema with updater functions
 * @param schema Schema to visit
 * @param updater functions called on each schema, return values are piped into next
 * function and finally replace processed schema.
 */
function schemaUpdater(
  schema: SimpleSchema,
  ...updater: (<
    Ext extends {
      $wref?: string | undefined;
    } & Schema,
  >(
    schema: Ext,
  ) => Schema)[]
) {
  const update: SimpleSchema = updater.reduce(
    (p, f) => f(p),
    { ...schema },
  );
  if ('properties' in update && update.properties != null) {
    const newProperties: { [props: string]: SimpleSchema } = {};
      Object.entries(update.properties).map( ([k,v]) => {
        const u = schemaUpdater(v as SimpleSchema, ...updater);
        newProperties[k] = u;
      }),
    update.properties = newProperties;
  }
  if ('additionalProperties' in update && update.additionalProperties != null) {
    update.additionalProperties = schemaUpdater(
      update.additionalProperties,
      ...updater,
    );
  }
  if ('items' in update && update.items != null) {
    if (Array.isArray(update.items)) {
      update.items = update.items.map(i => schemaUpdater(i, ...updater));
    } else {
      update.items = schemaUpdater(update.items, ...updater);
    }
  }
  return update;
}

function methodConfigUpdater(
  config: MethodsConfig,
  ...updater: (<
    Ext extends {
      $wref?: string | undefined;
    } & Schema,
  >(
    schema: Ext,
  ) => Schema )[]
) {
  const newConfig: MethodsConfig = {};
  for (const method in config) {
    const newParameters =
      config[method].parameters.map(
        p => schemaUpdater(p, ...updater),
      )
    newConfig[method] = {
      ...config[method],
      parameters: newParameters as WegasMethodParameter[],
    };
  }
  return newConfig;
}

/**
 * Download configuration schema
 * @param file filename
 */
function fetchConfig(
  atClass: string,
): { schema: Schema; methods: MethodsConfig } {
  
  return JSONLoader[atClass as keyof typeof JSONLoader] as { schema: Schema; methods: MethodsConfig };

  /*return import(
     webpackChunkName: "Config-[request]", webpackPrefetch: true 
    'wegas-ts-api/src/generated/schemas/' + file
  );*/
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

function injectRef(schema: { $wref?: string }): Schema {
  const { $wref, ...restSchema } = schema;
  if (typeof $wref === 'string') {
    try {
      const refSchema = fetchConfig($wref.replace(/\.json$/, ''));
    /*const refSchema = await import(
      'wegas-ts-api/src/generated/schemas/' + $wref
    )*/
   
      return { ...refSchema.schema, ...restSchema };
    
    }catch (e) {
      wwarn(e);
      return restSchema;
    }
  }

  return restSchema;
}

function getConfigFromPath(path: string): Schema {
  try {
    const res = fetchConfig(path);
    
    return schemaUpdater(
        res.schema,
        injectRef,
        updateVisibility,
        updatedErrored,
    );
    
  }catch (e) {
      wwarn(e);
      return {};
  }
}

export default function getEditionConfig<T extends IMergeable>(
  entity: T,
): Schema {
  return getConfigFromPath(entity['@class']);
}

export interface EActions {
  edit: (
    variable: IAbstractEntity,
    path?: (number | string)[],
    config?: Schema<AvailableViews>,
  ) => EditingThunkResult;
}

export function getEntityActions(
  entity: IAbstractEntity,
): EActions {
  if (
    entityIs(entity, 'FSMDescriptor') ||
    entityIs(entity, 'DialogueDescriptor')
  ) {
    return { edit: editStateMachine };
  }
  return { edit: editVariable };
}

export function getVariableMethodConfig<T extends IAbstractEntity>(
  entity: T,
): MethodsConfig {
  const res = fetchConfig(entity['@class']);
  return methodConfigUpdater(res.methods, injectRef);
  
}

export function getIcon<T extends IMergeable>(
  entity: T,
  open: boolean = false,
): Icons | undefined {
  switch (entity['@class'] as WegasClassNames) {
    case 'ChoiceDescriptor':
      return ['square', { icon: 'check-double', color: 'white', size: 'sm' }];
    case 'FSMDescriptor':
      return 'project-diagram';
    case 'ListDescriptor':
      return open ? 'folder-open' : 'folder';
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
    case 'AchievementDescriptor':
      return 'certificate';
    case 'ObjectDescriptor':
      return 'shopping-bag';
    case 'StringDescriptor':
      return 'font';
    case 'TextDescriptor':
      return 'paragraph';
    case 'StaticTextDescriptor':
      return ['square-full', { icon: 'paragraph', color: 'white', size: 'xs' }];
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

export function getClassLabel<T extends IMergeable>(
  entity: T,
): string | undefined {
  switch (entity['@class'] as WegasClassNames) {
    case 'ChoiceDescriptor':
      return 'Conditional';
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
      return 'Standard';
    case 'BooleanDescriptor':
      return 'Boolean';
    case 'AchievementDescriptor':
      return 'Achievement';
    case 'ObjectDescriptor':
      return 'Object';
    case 'StringDescriptor':
      return 'String';
    case 'TextDescriptor':
      return 'Text';
    case 'StaticTextDescriptor':
      return 'Static text';
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
  'ListDescriptor',
  'NumberDescriptor',
  'TextDescriptor',
  'StringDescriptor',
  'BooleanDescriptor',
  'StaticTextDescriptor',
  'QuestionDescriptor',
  'WhQuestionDescriptor',
  'TriggerDescriptor',
  'FSMDescriptor',
  'InboxDescriptor',
  'DialogueDescriptor',
  'ObjectDescriptor',
  'ResourceDescriptor',
  'TaskDescriptor',
  'PeerReviewDescriptor',
  'AchievementDescriptor',
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
export function getChildren<T extends IAbstractEntity>(
  entity: T,
): readonly IAbstractEntity['@class'][] {
  switch (entity['@class']) {
    case 'ListDescriptor':
    case 'GameModel':
      return ListDescriptorChild.filter(
        child =>
          entityIs(entity, 'GameModel', true) ||
          (entityIs(entity, 'ListDescriptor', true) &&
            (entity.allowedTypes.length === 0 ||
              entity.allowedTypes.includes(child))),
      );
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
