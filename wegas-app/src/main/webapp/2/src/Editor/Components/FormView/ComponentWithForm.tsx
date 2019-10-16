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
import {
  createStoreConnector,
  shallowDifferent,
} from '../../../data/connectStore';
import { flex, grow, autoScroll } from '../../../css/classes';
import {
  InstancesEditor,
  InstancesEditorProps,
} from '../Variable/InstancesEditor';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';

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

function instancesEd(props: InstancesEditorProps) {
  return Promise.resolve<
    typeof import('../Variable/InstancesEditor')['InstancesEditor']
  >(import('../Variable/InstancesEditor').then(m => m.InstancesEditor(props)));
}

const AsyncInstancesEditor = asyncSFC<InstancesEditorProps>(instancesEd);

//function WindowedEditor<T>({ entity, update, actions, getConfig, path, error, }: EditorProps<T>): Promise<JSX.Element | null>
//function instancesEd(): Promise<({ state, dispatch, actions, }: InstancesEditorProps) => JSX.Element | null>
//function instancesEd(props: InstancesEditorProps): Promise<({ state, dispatch, actions, }: InstancesEditorProps) => JSX.Element | null>

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

  return (
    <div className={cx(flex, grow)}>
      <div className={cx(flex, growBig, autoScroll)}>
        {children({
          localState: localState.editing,
          localDispatch,
        })}
      </div>
      {localState && localState.editing && localEntity && (
        <div className={cx(flex, grow, autoScroll)}>
          <AsyncVariableForm
            {...localState.editing}
            getConfig={getConfig(localState.editing)}
            update={getUpdate(localState.editing, localDispatch)}
            actions={[
              ...Object.values(
                'actions' in localState.editing &&
                  localState.editing.actions.more
                  ? localState.editing.actions.more
                  : {},
              ),
              { label: 'Close', action: () => localDispatch(closeEditor()) },
              {
                label: 'Instance',
                action: () => setInstanceView(show => !show),
              },
            ]}
            entity={localEntity}
            error={getError(localState.events, localDispatch)}
          />
        </div>
      )}
      {instanceView && entityEditor && (
        <InstancesEditor
          state={{ global: localState }}
          dispatch={localDispatch}
          actions={[{ label: 'Close', action: () => setInstanceView(false) }]}
        />
      )}
    </div>
  );
}
