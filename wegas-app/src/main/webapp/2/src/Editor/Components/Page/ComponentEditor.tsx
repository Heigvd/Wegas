import * as React from 'react';
import { flex, flexColumn, grow } from '../../../css/classes';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { cx } from 'emotion';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { BaseView, Schema } from 'jsoninput/typings/types';
import { MessageString } from '../MessageString';
// import { flexItemSchema } from '../../../Components/Layouts/FlexList';
import {
  SchemaPropsSchemas,
  schemaProps,
} from '../../../Components/PageComponents/tools/schemaProps';
import { alignSelfValues } from '../../../Components/Layouts/FlexList';

interface EditorProps<T = WegasComponent['props']> {
  entity: T;
  schema: Schema<BaseView>;
  update?: (variable: T) => void;
  actions?: {
    label: React.ReactNode;
    action: (entity: T, path?: (string | number)[]) => void;
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

export interface ComponentEditorProps {
  entity?: WegasComponent;
  update?: (variable: WegasComponent) => void;
  actions?: EditorProps['actions'];
  isFlexItem?: boolean;
}

export const optionsSchema = {
  options: schemaProps.hashlist(
    'Options',
    false,
    [
      {
        label: 'Layout',
        value: { prop: 'layout' },
        items: [
          {
            label: 'Order',
            value: {
              prop: 'order',
              schema: schemaProps.number('Order', false),
            },
          },
          {
            label: 'Align Self',
            value: {
              prop: 'alignSelf',
              schema: schemaProps.select('Align self', false, alignSelfValues),
            },
          },
          {
            label: 'Flex grow',
            value: {
              prop: 'flexGrow',
              schema: schemaProps.number('Flex grow', false),
            },
          },
          {
            label: 'Flex shrink',
            value: {
              prop: 'flexShrink',
              schema: schemaProps.number('Flex shrink', false),
            },
          },
          {
            label: 'Flex basis',
            value: {
              prop: 'flexBasis',
              schema: schemaProps.string('Flex basis', false),
            },
          },
        ],
      },
    ],
    undefined,
    undefined,
    1001,
  ),
  className: schemaProps.string(
    'Classes',
    false,
    undefined,
    undefined,
    1001,
    undefined,
    true,
  ),
  style: schemaProps.code('Style', false, 'JSON', undefined, 'ADVANCED', 1002),
  children: schemaProps.hidden(false, 'array', 1003),
};

export default function ComponentEditor({
  entity,
  update,
  actions,
  isFlexItem,
}: ComponentEditorProps) {
  const schema = usePageComponentStore(s => {
    const baseSchema = s[entity ? entity.type : 'List'].getSchema();
    if (isFlexItem) {
      const firstPropView: SchemaPropsSchemas & {
        view?: SchemaPropsSchemas['view'] & { borderTop?: boolean };
      } = optionsSchema.options;
      if (firstPropView.view) {
        firstPropView.view['borderTop'] = true;
      }
      baseSchema.properties = { ...baseSchema.properties, ...optionsSchema };
    }
    return baseSchema as Schema<BaseView>;
  }, deepDifferent);
  if (entity === undefined || schema === undefined) {
    return null;
  }
  return (
    <AsyncComponentForm
      entity={entity.props}
      schema={schema}
      update={value => update && update({ ...entity, props: value })}
      actions={actions}
    />
  );
}
