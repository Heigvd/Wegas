import * as React from 'react';
import { storeFactory, LocalGlobalState } from '../../../data/storeFactory';
import {
  AsyncVariableForm,
  getError,
  getConfig,
  getUpdate,
  getEntity,
} from '../EntityEditor';
import { css, cx } from 'emotion';
import { Edition, closeEditor } from '../../../data/Reducer/globalState';
import { StoreDispatch } from '../../../data/store';
import { createStoreConnector } from '../../../data/connectStore';
import { flex, grow, autoScroll } from '../../../css/classes';
import { InstancesEditorProps } from '../Variable/InstancesEditor';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { Toolbar } from '../../../Components/Toolbar';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';

const growBig = css({
  flex: '30 1 auto',
});

export interface ComponentWithFormChildrenProps {
  localState: Readonly<Edition> | undefined;
  localDispatch: StoreDispatch;
}

interface ComponentWithFormProps {
  children: (
    props: ComponentWithFormChildrenProps,
  ) => React.ReactElement | null;
  entityEditor?: boolean;
}

const AsyncInstancesEditor = asyncSFC<InstancesEditorProps>(
  async (props: InstancesEditorProps) => {
    const InstancesEditor = await Promise.resolve<
      typeof import('../Variable/InstancesEditor')['InstancesEditor']
    >(import('../Variable/InstancesEditor').then(m => m.InstancesEditor));
    return <InstancesEditor {...props} />;
  },
);

export function ComponentWithForm({
  children,
  entityEditor,
}: ComponentWithFormProps) {
  const {
    useStore: useLocalStore,
    getDispatch: getLocalDispatch,
  } = React.useMemo(() => createStoreConnector(storeFactory()), []);
  const localState = useLocalStore(
    (state: LocalGlobalState) => state.global,
    shallowDifferent,
  );
  const [instanceView, setInstanceView] = React.useState(false);
  const localDispatch = getLocalDispatch();
  const localEntity = getEntity(localState.editing);
  const actions = [
    ...Object.values(
      localState.editing &&
        'actions' in localState.editing &&
        localState.editing.actions.more
        ? localState.editing.actions.more
        : {},
    ),
    { label: 'Close', action: () => localDispatch(closeEditor()) },
  ];
  if (entityEditor) {
    actions.push({
      label: 'Instance',
      action: () => setInstanceView(show => !show),
    });
  }
  return (
    <div className={cx(flex, grow)}>
      <div className={cx(flex, growBig, autoScroll)}>
        {children({
          localState: localState.editing,
          localDispatch,
        })}
      </div>
      {localState.editing && localEntity && (
        <div className={cx(flex, grow, autoScroll)}>
          <AsyncVariableForm
            {...localState.editing}
            getConfig={getConfig(localState.editing)}
            update={getUpdate(localState.editing, localDispatch)}
            actions={actions}
            entity={localEntity}
            error={getError(localState.events, localDispatch)}
          />
        </div>
      )}
      {instanceView && entityEditor && (
        <div className={cx(flex, grow, autoScroll)}>
          <Toolbar>
            <Toolbar.Header>
              <button onClick={() => setInstanceView(false)}>
                Close instance editor
              </button>
            </Toolbar.Header>
            <Toolbar.Content>
              <AsyncInstancesEditor
                state={{ global: localState }}
                dispatch={localDispatch}
              />
            </Toolbar.Content>
          </Toolbar>
        </div>
      )}
    </div>
  );
}
