import * as React from 'react';
import { flex, flexColumn, grow } from '../../../css/classes';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { cx } from 'emotion';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { BaseView, Schema } from 'jsoninput/typings/types';
import { MessageString } from '../MessageString';

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
  const schema = usePageComponentStore(
    s => (entity && s[entity.type] ? s[entity.type].getSchema() : undefined),
    deepDifferent,
  );
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
