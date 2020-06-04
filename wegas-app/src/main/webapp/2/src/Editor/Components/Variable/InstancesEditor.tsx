import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { css, cx } from 'emotion';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import { AsyncVariableForm, getError, EditorProps } from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { LocalGlobalState } from '../../../data/storeFactory';
import {
  updateInstance,
  VariableInstanceState,
} from '../../../data/Reducer/VariableInstanceReducer';
import { State } from '../../../data/Reducer/reducers';
import { VariableInstanceAPI } from '../../../API/variableInstance.api';
import { flex, flexColumn, grow, localSelection } from '../../../css/classes';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { MessageString } from '../MessageString';
import { themeVar } from '../../../Components/Style/ThemeVars';

const listBox = css({
  width: '100%',
  maxHeight: '100px',
  overflowY: 'auto',
  borderColor: themeVar.InstanceEditor.colors.BorderColor,
  borderWidth: '2px',
  borderStyle: 'solid',
});

const listItem = css({
  padding: '5px',
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.InstanceEditor.colors.HoverColor,
  },
});

export interface InstancesEditorProps {
  state: LocalGlobalState;
  dispatch: StoreDispatch;
  actions?: EditorProps<IVariableInstance>['actions'];
}

export function InstancesEditor({
  state,
  dispatch,
  actions,
}: InstancesEditorProps) {
  const editing = state.global.editing;
  const events = state.global.events;

  const [instancesState, setInstancesState] = React.useState<{
    instances: VariableInstanceState;
    selectedInstance?: string;
    error?: string;
  }>({ instances: {}, selectedInstance: undefined, error: undefined });

  const dataFetch = React.useCallback(() => {
    if (
      editing &&
      (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
      editing.entity.id
    ) {
      VariableInstanceAPI.getByDescriptor(editing.entity as IVariableDescriptor)
        .then(res =>
          setInstancesState(oldState => {
            const instances = res.reduce(
              (oldRes, i) => i.id !== undefined && { ...oldRes, [i.id]: i },
              {},
            );
            const selectedInstance =
              oldState.selectedInstance &&
              Object.keys(instances).includes(oldState.selectedInstance)
                ? oldState.selectedInstance
                : undefined;
            return {
              ...oldState,
              instances,
              selectedInstance,
            };
          }),
        )
        .catch(() =>
          setInstancesState({
            instances: {},
            selectedInstance: undefined,
            error: 'Error occured while fetching variable instances',
          }),
        );
    }
  }, [editing]);

  React.useEffect(dataFetch, [editing]);

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
          {instancesState.instances && (
            <div className={cx(listBox, grow)}>
              {Object.values(instancesState.instances).map(i => {
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
          )}
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        {instancesState.selectedInstance && (
          <AsyncVariableForm
            getConfig={si =>
              getEditionConfig(si) as Promise<Schema<AvailableViews>>
            }
            update={(entity: IVariableInstance) =>
              dispatch(updateInstance(entity, dataFetch))
            }
            entity={instancesState.instances[instancesState.selectedInstance]}
            error={getError(events, dispatch)}
            actions={actions}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ConnectedInstancesEditor() {
  return (
    <StoreConsumer
      selector={(s: State) => {
        const editing = s.global.editing;
        if (!editing) {
          return null;
        } else {
          return { global: { editing, events: s.global.events } };
        }
      }}
      shouldUpdate={shallowDifferent}
    >
      {({ state, dispatch }) => {
        if (state == null || dispatch == null) {
          return null;
        }
        return <InstancesEditor state={state} dispatch={dispatch} />;
      }}
    </StoreConsumer>
  );
}
