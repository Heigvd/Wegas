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
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { defaultPadding } from '../../../css/classes';
import { store, StoreDispatch } from '../../../data/Stores/store';
import { findComponent } from '../../../Helper/pages';
import { FormAction } from '../Form';
import { AvailableSchemas } from '../FormView';
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
  label: string;
  entity: T;
  schema: Schema<BaseView>;
  update?: (variable: T) => void;
  actions?: FormAction<T>[];
  path?: (string | number)[];
  error?: {
    message: string;
    onVanish: () => void;
  };
  localDispatch: StoreDispatch | undefined;
}

async function WindowedEditor({
  label,
  entity,
  schema,
  update,
  actions = [],
  error,
  localDispatch,
}: EditorProps) {
  const [Form] = await Promise.all<typeof import('../Form')['Form']>([
    import('../Form').then(m => m.Form),
  ]);
  return (
    <Form
      error={error}
      label={label}
      entity={entity}
      update={value => update && update(value)}
      actions={actions}
      config={schema}
      localDispatch={localDispatch}
    />
  );
}
const AsyncComponentForm = asyncSFC<EditorProps>(
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
      [prop: string]: AvailableSchemas;
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
          [key: string]: AvailableSchemas;
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
  actions?: FormAction<WegasComponentForm>[] | undefined;
  localDispatch: StoreDispatch | undefined;
}

export function ComponentProperties({
  entity,
  parent,
  update,
  actions,
  localDispatch,
}: ComponentPropertiesProps) {
  const { schema, label } = usePageComponentStore(s => {
    const component = entity && s[entity.type] ? s[entity.type] : undefined;
    const baseSchema =
      component != null
        ? component.schema
        : { description: 'Unknown schema', properties: {} };
    let label =
      component != null ? component.componentName : 'Unknown component';
    if (entity?.props?.name != null) {
      label += ` - ${entity.props.name}`;
    }

    return {
      schema: wegasComponentSchema(
        baseSchema,
        parent ? s[parent.type].container : undefined,
      ) as Schema<BaseView>,
      label,
    };
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
      label={label}
      entity={wegasComponentToForm(entity.props)}
      schema={customSchema ? customSchema : schema}
      update={value =>
        update && update({ ...entity, props: formToWegasComponent(value) })
      }
      actions={actions}
      localDispatch={localDispatch}
    />
  );
}

export default function ConnectedComponentProperties() {
  const { editedPath, selectedPage, onUpdate, onDelete, onEdit } =
    React.useContext(pageCTX);

  const pageComponentActions: FormAction<WegasComponentForm>[] | undefined =
    React.useMemo(
      () =>
        editedPath
          ? [
              {
                type: 'IconAction',
                icon: 'trash',
                label: 'Delete',
                action: () => onDelete(editedPath),
                confirm: true,
              },
              {
                type: 'ToolboxAction',
                label: 'Deselect',
                action: () => onEdit(undefined),
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
      // Force refresh form when path changes
      key={editedPath.join(';')}
      entity={component}
      parent={parent}
      update={onUpdate}
      actions={pageComponentActions}
      localDispatch={undefined}
    />
  );
}
