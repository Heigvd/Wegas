import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { StoreDispatch, useStore, store } from '../../../data/store';
import { css, cx } from 'emotion';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import { AsyncVariableForm, getError, EditorProps } from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import {
  updateInstance,
  VariableInstanceState,
} from '../../../data/Reducer/VariableInstanceReducer';
import { flex, flexColumn, grow, localSelection } from '../../../css/classes';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { MessageString } from '../MessageString';
import { themeVar } from '../../../Components/Style/ThemeVars';
import { GlobalState } from '../../../data/Reducer/globalState';
// import { themeCTX, ThemeComponent } from '../../../Components/Style/Theme';

const listBox = css({
  width: '100%',
  maxHeight: '100px',
  overflowY: 'auto',
  borderColor: themeVar.Common.colors.BorderColor,
  borderWidth: '2px',
  borderStyle: 'solid',
});

const listItem = css({
  padding: '5px',
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});

export interface InstancesEditorProps /*extends ThemeComponent*/ {
  editing: Readonly<GlobalState['editing']>;
  // events: Readonly<WegasEvents[]>;
  actions?: EditorProps<IVariableInstance>['actions'];
  dispatch: StoreDispatch;
}

export function InstancesEditor({
  // instances,
  editing,
  actions,
  // events,
  dispatch,
}: InstancesEditorProps) {
  const [instancesState, setInstancesState] = React.useState<{
    selectedInstance?: string;
    error?: string;
  }>({ selectedInstance: undefined, error: undefined });

  const { events, instances } = useStore(s => {
    return {
      events: s.global.events,
      instances: Object.entries(s.variableInstances)
        .filter(
          ([, instance]) =>
            editing?.type === 'Variable' &&
            editing.entity.id === instance?.parentId,
        )
        .reduce((o, [k, v]) => ({ ...o, [k]: v }), {}) as Readonly<
        VariableInstanceState
      >,
    };
  }, deepDifferent);

  const vanishFN = React.useCallback(
    () =>
      setInstancesState(oldState => ({
        ...oldState,
        error: undefined,
      })),
    [],
  );
  return (
    <Toolbar>
      <Toolbar.Header>
        <div className={cx(flex, flexColumn)}>
          <MessageString
            value={instancesState.error}
            type={'error'}
            duration={3000}
            onLabelVanish={vanishFN}
          />
          <div className={cx(listBox, grow)}>
            {editing == null
              ? 'No selected variable descriptor'
              : Object.values(instances).map(i => {
                  if (i) {
                    const scope = getScopeEntity(i);
                    return (
                      <div
                        key={i.id}
                        className={cx(
                          listItem,
                          String(i.id) === instancesState.selectedInstance &&
                            localSelection,
                        )}
                        onClick={() =>
                          setInstancesState(oldState => ({
                            ...oldState,
                            selectedInstance:
                              oldState.selectedInstance === String(i.id)
                                ? undefined
                                : String(i.id),
                          }))
                        }
                      >
                        {`#${i.id} - ${
                          scope
                            ? `${scope.name} (#${scope.id})`
                            : 'Current game model'
                        }`}
                      </div>
                    );
                  }
                })}
          </div>
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        {instancesState.selectedInstance && (
          <AsyncVariableForm
            getConfig={si =>
              getEditionConfig(si) as Promise<Schema<AvailableViews>>
            }
            update={(entity: IVariableInstance) =>
              dispatch(updateInstance(entity))
            }
            entity={instances[instancesState.selectedInstance]}
            error={getError(events, dispatch)}
            actions={actions}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

const dispatch = store.dispatch;

export default function ConnectedInstancesEditor() {
  const editing = useStore(s => {
    return s.global.editing;
  }, deepDifferent);

  return <InstancesEditor editing={editing} dispatch={dispatch} />;
}
