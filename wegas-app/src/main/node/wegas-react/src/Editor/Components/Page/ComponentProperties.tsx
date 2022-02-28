import { cx } from '@emotion/css';
import { BaseView, Schema } from 'jsoninput/typings/types';
import { omit, pick } from 'lodash-es';
import * as React from 'react';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import {
  AbsoluteItemLayoutProps,
  defaultAbsoluteLayoutPropsKeys,
} from '../../../Components/Layouts/Absolute';
import {
  defaultFlexLayoutOptionsKeys,
  FlexItemLayoutProps,
} from '../../../Components/Layouts/FlexList';
import { defaultMenuItemKeys } from '../../../Components/Layouts/Menu';
import {
  ContainerComponent,
  usePageComponentStore,
} from '../../../Components/PageComponents/tools/componentFactory';
import {
  WegasComponentActionsProperties,
  WegasComponentDecorations,
  wegasComponentExtraSchema,
  WegasComponentLayoutCommonOptions,
  WegasComponentLayoutConditionnalOptions,
  WegasComponentOptionsActions,
} from '../../../Components/PageComponents/tools/options';
import {
  schemaProps,
  SchemaPropsSchemas,
  SimpleSchemaPropsSchemas,
} from '../../../Components/PageComponents/tools/schemaProps';
import { defaultPadding, flex, flexColumn, grow } from '../../../css/classes';
import { ActionsProps } from '../../../data/Reducer/globalState';
import { store, StoreDispatch } from '../../../data/Stores/store';
import { findComponent } from '../../../Helper/pages';
import { MessageString } from '../MessageString';
import { pageCTX } from './PageEditor';

/**
 * wegasComponentCommonSchema - defines the minimum schema for every WegasComponent
 */
export const wegasComponentCommonSchema = {
  name: schemaProps.string({ label: 'Name', index: -2 }),
  layoutClassName: schemaProps.string({ label: 'Classes', index: -1 }),
  layoutStyle: schemaProps.hashlist({ label: 'Style' }),
  children: schemaProps.hidden({ type: 'array', index: 1003 }),
};

interface EditorProps<T = WegasComponentForm> {
  entity: T;
  schema: Schema<BaseView>;
  update?: (variable: T) => void;
  actions?: ActionsProps<T>[];
  path?: (string | number)[];
  error?: {
    message: string;
    onVanish: () => void;
  };
  localDispatch: StoreDispatch | undefined;
}

interface PagePropertiesFormProps extends EditorProps {
  editionKey: string;
}

async function WindowedEditor({
  entity,
  schema,
  update,
  actions = [],
  error,
  localDispatch,
  editionKey,
}: PagePropertiesFormProps) {
  const [Form] = await Promise.all<typeof import('../Form')['Form']>([
    import('../Form').then(m => m.Form),
  ]);
  return (
    <div className={cx(flex, grow, flexColumn)}>
      <MessageString
        value={error && error.message}
        type={'error'}
        duration={3000}
        onLabelVanish={error && error.onVanish}
      />
      <Form
        // Force rerender Form when path changes,
        key={editionKey}
        entity={entity}
        update={value => update && update(value)}
        actions={actions}
        config={schema}
        localDispatch={localDispatch}
      />
    </div>
  );
}
const AsyncComponentForm = asyncSFC<PagePropertiesFormProps>(
  WindowedEditor,
  () => <div>load...</div>,
  ({ err }: { err: Error }) => (
    <span>{err && err.message ? err.message : 'Something went wrong...'}</span>
  ),
);

export interface WegasComponentCommonProperties {
  name?: string;
  className?: string;
  children?: WegasComponent[];
  layoutClassName?: string;
  layoutStyle?: React.CSSProperties;
}

const defaultCommonProperties: WegasComponentCommonProperties = {
  name: undefined,
  children: undefined,
  layoutClassName: undefined,
  layoutStyle: undefined,
};
const defaultCommonPropertiesKeys = Object.keys(defaultCommonProperties);

const defaultLayoutCommonOptions: WegasComponentLayoutCommonOptions = {
  themeMode: undefined,
  tooltip: undefined,
};
const defaultLayoutCommonOptionsKeys = Object.keys(defaultLayoutCommonOptions);
const defaultLayoutOptionsKeys = [
  ...defaultFlexLayoutOptionsKeys,
  ...defaultAbsoluteLayoutPropsKeys,
  ...defaultLayoutCommonOptionsKeys,
];

const defaultLayoutConditions: WegasComponentLayoutConditionnalOptions = {
  conditionnalClassNames: undefined,
  disableIf: undefined,
  hideIf: undefined,
  lock: undefined,
  readOnlyIf: undefined,
};
const defaultLayoutConditionsKeys = Object.keys(defaultLayoutConditions);

const defaultAction: WegasComponentOptionsActions &
  WegasComponentActionsProperties = {
  confirmClick: undefined,
  stopPropagation: undefined,
  impactVariable: undefined,
  localScriptEval: undefined,
  openFile: undefined,
  openPage: undefined,
  openPopupPage: undefined,
  openUrl: undefined,
  playSound: undefined,
  printVariable: undefined,
};
const defaultActionKeys = Object.keys(defaultAction);

const defaultDecorations: WegasComponentDecorations = {
  infoBullet: undefined,
  unreadCount: undefined,
};
const defaultDecorationsKeys = Object.keys(defaultDecorations);

interface WegasComponentForm {
  childrenProperties?: {
    [prop: string]: unknown;
  };
  commonProperties: WegasComponentCommonProperties;
  componentProperties: {
    [prop: string]: unknown;
  };
  layoutOptions: WegasComponentLayoutCommonOptions &
    (FlexItemLayoutProps | AbsoluteItemLayoutProps);
  layoutConditions: WegasComponentLayoutConditionnalOptions;
  actions: WegasComponentOptionsActions & WegasComponentActionsProperties;
  decorations: WegasComponentDecorations;
}

function wegasComponentToForm(
  wegasComponentProperties: WegasComponent['props'],
): WegasComponentForm {
  return {
    childrenProperties: pick(wegasComponentProperties, defaultMenuItemKeys),
    commonProperties: pick(
      wegasComponentProperties,
      defaultCommonPropertiesKeys,
    ),
    componentProperties: omit(wegasComponentProperties, [
      ...defaultMenuItemKeys,
      ...defaultCommonPropertiesKeys,
      ...defaultLayoutOptionsKeys,
      ...defaultLayoutConditionsKeys,
      ...defaultActionKeys,
      ...defaultDecorationsKeys,
    ]),
    layoutOptions: pick(wegasComponentProperties, defaultLayoutOptionsKeys),
    layoutConditions: pick(
      wegasComponentProperties,
      defaultLayoutConditionsKeys,
    ),
    actions: pick(wegasComponentProperties, defaultActionKeys),
    decorations: pick(wegasComponentProperties, defaultDecorationsKeys),
  };
}

function formToWegasComponent(
  formObject: WegasComponentForm,
): WegasComponent['props'] {
  return {
    ...formObject.childrenProperties,
    ...formObject.commonProperties,
    ...formObject.componentProperties,
    ...formObject.layoutOptions,
    ...formObject.layoutConditions,
    ...formObject.actions,
    ...formObject.decorations,
  };
}

export function wegasComponentSchema(
  pageComponentSchema: {
    description: string;
    properties: {
      [prop: string]: SchemaPropsSchemas;
    };
  },
  parentContainer?: ContainerComponent,
) {
  const childrenAdditionalShema = parentContainer?.childrenAdditionalShema
    ? {
        childrenProperties: schemaProps.object({
          label: 'Children properties',
          properties: parentContainer.childrenAdditionalShema,
        }),
      }
    : {};

  return {
    description: pageComponentSchema.description,
    properties: {
      ...childrenAdditionalShema,
      componentProperties: schemaProps.object({
        label: 'Component properties',
        properties: (pageComponentSchema.properties || {}) as {
          [key: string]: SimpleSchemaPropsSchemas;
        },
      }),
      commonProperties: schemaProps.object({
        label: 'Container properties',
        properties: wegasComponentCommonSchema,
      }),
      ...wegasComponentExtraSchema(parentContainer?.childrenLayoutOptionSchema),
    },
  };
}

export interface ComponentPropertiesProps {
  entity?: WegasComponent;
  parent?: WegasComponent;
  update?: (variable: WegasComponent) => void;
  actions?: EditorProps['actions'];
  localDispatch: StoreDispatch | undefined;
  editionKey: string;
}

export function ComponentProperties({
  entity,
  parent,
  update,
  actions,
  localDispatch,
  editionKey,
}: ComponentPropertiesProps) {
  const schema = usePageComponentStore(s => {
    const baseSchema =
      entity && s[entity.type]
        ? s[entity.type].schema
        : { description: 'Unknown schema', properties: {} };

    return wegasComponentSchema(
      baseSchema,
      parent ? s[parent.type].container : undefined,
    ) as Schema<BaseView>;
  }, deepDifferent);

  // customize schema
  // Then try to get schema from complex filters
  let customSchema: SimpleSchema | void;
  const customSchemas = store.getState().global.schemas;
  for (const schemaName of customSchemas.unfiltered) {
    const nfSchema = customSchemas.views[schemaName](entity, schema);
    if (nfSchema !== undefined) {
      customSchema = nfSchema;
      break;
    }
  }

  if (entity === undefined || schema === undefined) {
    return null;
  }
  return (
    <AsyncComponentForm
      entity={wegasComponentToForm(entity.props)}
      schema={customSchema ? customSchema : schema}
      update={value =>
        update && update({ ...entity, props: formToWegasComponent(value) })
      }
      actions={actions}
      localDispatch={localDispatch}
      editionKey={editionKey}
    />
  );
}

export default function ConnectedComponentProperties() {
  const {
    editedPath,
    selectedPageId,
    selectedPage,
    onUpdate,
    onDelete,
    onEdit,
  } = React.useContext(pageCTX);

  const pageComponentActions: ActionsProps<WegasComponentForm>[] | undefined =
    React.useMemo(
      () =>
        editedPath
          ? [
              {
                label: 'Delete',
                action: () => onDelete(editedPath),
                confirm: true,
                sorting: 'delete',
              },
              {
                label: 'Deselect',
                action: () => onEdit(undefined),
                sorting: 'toolbox',
              },
            ]
          : undefined,
      [editedPath, onDelete, onEdit],
    );

  if (!editedPath) {
    return <pre className={defaultPadding}>No component selected yet</pre>;
  }
  if (!selectedPage) {
    return <pre className={defaultPadding}>No page selected yet</pre>;
  }
  const { component, parent } = findComponent(selectedPage, editedPath);

  if (!component) {
    return (
      <pre className={defaultPadding}>Edited component not found in page</pre>
    );
  }

  return (
    <ComponentProperties
      entity={component}
      parent={parent}
      update={onUpdate}
      actions={pageComponentActions}
      localDispatch={undefined}
      editionKey={JSON.stringify({ selectedPageId, editedPath })}
    />
  );
}
