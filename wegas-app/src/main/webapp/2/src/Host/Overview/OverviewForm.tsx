import * as React from 'react';
import { asyncSFC } from '../../Components/HOC/asyncSFC';

interface DashboardFormProps<T = {}> {
  entity: T;
  schema: {};
  update: (val: T) => void;
}

async function AsyncDashboardForm<T>({
  entity,
  schema,
  update,
}: DashboardFormProps<T>) {
  const [Form] = await Promise.all<
    typeof import('../../Editor/Components/Form')['Form']
  >([import('../../Editor/Components/Form').then(m => m.Form)]);

  return (
    <Form
      entity={entity}
      update={value => update && update(value)}
      actions={[]}
      schema={schema}
    />
  );
}
export const DashboardForm = asyncSFC<DashboardFormProps>(
  AsyncDashboardForm,
  () => <div>load...</div>,
  ({ err }: { err: Error }) => (
    <span>{err && err.message ? err.message : 'Something went wrong...'}</span>
  ),
);
