import * as React from 'react';
import { flex, flexColumn, grow } from '../../../css/classes';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { cx } from 'emotion';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { BaseView, Schema } from 'jsoninput/typings/types';
import { MessageString } from '../MessageString';
import { pageEditorCTX, pageCTX } from './PageEditor';
import { findComponent } from '../../../Helper/pages';
import {
  wegasComponentExtraSchema,
  WegasComponentLayoutCommonOptions,
  WegasComponentLayoutConditionnalOptions,
  WegasComponentOptionsActions,
  WegasComponentActionsProperties,
  WegasComponentDecorations,
} from '../../../Components/PageComponents/tools/options';
import {
  schemaProps,
  SimpleSchemaPropsSchemas,
  SchemaPropsSchemas,
} from '../../../Components/PageComponents/tools/schemaProps';
import {
  FlexItemLayoutProps,
  defaultFlexLayoutOptionsKeys,
} from '../../../Components/Layouts/FlexList';
import {
  AbsoluteItemLayoutProps,
  defaultAbsoluteLayoutPropsKeys,
} from '../../../Components/Layouts/Absolute';
import { pick, omit } from 'lodash-es';
import { ContainerComponent } from '../../../Components/PageComponents/tools/EditableComponent';

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
  actions?: {
    label: React.ReactNode;
    action: (entity: T, path?: (string | number)[]) => void;
    confirm?: boolean;
  }[];
  path?: (string | number)[];
  error?: {
    message: string;
    onVanish: () => void;
  };
}

async function WindowedEditor({
  entity,
  schema,
  update,
  actions = [],
  error,
}: EditorProps) {
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
        entity={entity}
        update={value => update && update(value)}
        actions={actions}
        schema={schema}
      />
    </div>
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
  disableIf: undefined,
  hideIf: undefined,
  lock: undefined,
  readOnlyIf: undefined,
};
const defaultLayoutConditionsKeys = Object.keys(defaultLayoutConditions);

const defaultAction: WegasComponentOptionsActions &
  WegasComponentActionsProperties = {
  confirmClick: undefined,
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
    commonProperties: pick(
      wegasComponentProperties,
      defaultCommonPropertiesKeys,
    ),
    componentProperties: omit(wegasComponentProperties, [
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
  return {
    description: pageComponentSchema.description,
    properties: {
      commonProperties: schemaProps.object({
        label: 'Common properties',
        properties: wegasComponentCommonSchema,
      }),
      componentProperties: schemaProps.object({
        label: 'Component properties',
        properties: (pageComponentSchema.properties || {}) as {
          [key: string]: SimpleSchemaPropsSchemas;
        },
      }),
      ...wegasComponentExtraSchema(parentContainer?.type),
    },
  };
}

export interface ComponentPropertiesProps {
  entity?: WegasComponent;
  parent?: WegasComponent;
  update?: (variable: WegasComponent) => void;
  actions?: EditorProps['actions'];
}

export function ComponentProperties({
  entity,
  parent,
  update,
  actions,
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
  if (entity === undefined || schema === undefined) {
    return null;
  }
  return (
    <AsyncComponentForm
      entity={wegasComponentToForm(entity.props)}
      schema={schema}
      update={value =>
        update && update({ ...entity, props: formToWegasComponent(value) })
      }
      actions={actions}
    />
  );
}

export default function ConnectedComponentProperties() {
  const { editedPath, selectedPage } = React.useContext(pageEditorCTX);
  const { onUpdate, onDelete, onEdit } = React.useContext(pageCTX);

  if (!editedPath) {
    return <pre>No component selected yet</pre>;
  }
  if (!selectedPage) {
    return <pre>No page selected yet</pre>;
  }
  const { component, parent } = findComponent(selectedPage, editedPath);

  if (!component) {
    return <pre>Edited component not found in page</pre>;
  }

  return (
    <ComponentProperties
      entity={component}
      parent={parent}
      update={onUpdate}
      actions={[
        {
          label: 'Delete',
          action: () => onDelete(editedPath),
          confirm: true,
        },
        {
          label: 'Deselect',
          action: () => onEdit(undefined),
        },
      ]}
    />
  );
}
