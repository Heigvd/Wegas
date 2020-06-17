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
import { wegasComponentOptionsSchema } from '../../../Components/PageComponents/tools/options';
import { wegasComponentCommonSchema } from '../../../Components/PageComponents/tools/EditableComponent';

interface EditorProps<T = WegasComponent['props']> {
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

    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        ...wegasComponentCommonSchema,
        ...wegasComponentOptionsSchema(
          parent ? s[parent.type].containerType : undefined,
        ),
      },
    } as Schema<BaseView>;
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

export default function ConnectedComponentProperties() {
  const { editedPath, selectedPage } = React.useContext(pageEditorCTX);
  const { onUpdate, onDelete } = React.useContext(pageCTX);

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
      ]}
    />
  );
}
