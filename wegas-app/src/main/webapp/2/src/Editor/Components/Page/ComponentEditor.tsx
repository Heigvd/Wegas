import * as React from 'react';
import { StyledLabel } from '../../../Components/AutoImport/String/String';
import { flex, flexColumn, grow } from '../../../css/classes';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { deepClone } from 'fast-json-patch';
import { usePageComponentStore } from '../../../Components/PageComponents/componentFactory';
import { cx } from 'emotion';

function overrideSchema(component: WegasComponent, schema: SimpleSchema) {
  const newSchema = deepClone(schema);
  if ('properties' in newSchema && newSchema.properties !== undefined) {
    Object.keys(newSchema.properties).map(k => {
      newSchema.properties[k].value = component.props[k];
    });
  }
  return newSchema;
}

interface EditorProps {
  entity?: WegasComponent;
  schema?: SimpleSchema;
  update?: (variable: WegasComponent) => void;
  actions?: {
    label: React.ReactNode;
    action: (entity: WegasComponent, path?: (string | number)[]) => void;
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
  path,
  error,
}: EditorProps) {
  if (entity === undefined || schema === undefined) {
    return null;
  }

  const [Form] = await Promise.all<typeof import('../Form')['Form']>([
    import('../Form').then(m => m.Form),
  ]);

  return (
    <div className={cx(flex, grow, flexColumn)}>
      <StyledLabel
        value={error && error.message}
        type={'error'}
        duration={3000}
        onLabelVanish={error && error.onVanish}
      />
      <Form
        entity={entity}
        update={update}
        path={path}
        actions={actions}
        schema={overrideSchema(entity, schema)}
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
}

export default function ComponentEditor({
  entity,
  update,
  actions,
}: ComponentEditorProps) {
  const schema = usePageComponentStore(s =>
    s[entity ? entity.type : 'List'].getSchema(),
  );
  return (
    <AsyncComponentForm
      entity={entity}
      schema={schema}
      update={update}
      actions={actions}
    />
  );
}
