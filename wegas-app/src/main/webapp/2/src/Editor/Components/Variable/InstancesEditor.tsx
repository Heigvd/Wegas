import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { useStore, StoreDispatch, StoreConsumer } from '../../../data/store';
import { shallowDifferent, deepDifferent } from '../../../data/connectStore';
import { css } from 'emotion';
import { themeVar } from '../../../Components/Theme';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import { AsyncVariableForm, getError, EditorProps } from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { LocalGlobalState } from '../../../data/storeFactory';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';
import { State } from '../../../data/Reducer/reducers';

const listBox = css({
  width: '100%',
  height: '100px',
  paddingLeft: '5px',
  paddingRight: '5px',
  overflowY: 'auto',
  color: themeVar.primaryLighterColor,
  borderColor: themeVar.primaryLighterColor,
  borderWidth: '2px',
  borderStyle: 'solid',
});

const listItem = css({
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
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

  const [selectedInstance, setSelectedInstance] = React.useState<
    IVariableInstance
  >();

  const instances = useStore(({ variableInstances }) => {
    if (
      editing &&
      (editing.type === 'Variable' || editing.type === 'VariableFSM')
    ) {
      const instances =
        Object.values(variableInstances)
          .filter(i => i && editing && i.parentId === editing.entity.id)
          .reduce((old, i) => i && [...old, i], []) || [];
      if (
        selectedInstance &&
        instances &&
        !instances.includes(selectedInstance)
      ) {
        setSelectedInstance(undefined);
      }
      return instances;
    }
    return null;
  }, deepDifferent);

  if (
    instances == null ||
    state == null ||
    editing == null ||
    !(editing.type === 'Variable' || editing.type === 'VariableFSM')
  ) {
    return null;
  }
  return (
    <Toolbar>
      <Toolbar.Header>
        <div className={listBox}>
          {instances.map(i => {
            const scope = getScopeEntity(i);
            return (
              <div
                key={i.id}
                className={listItem}
                onClick={() => setSelectedInstance(i)}
              >
                {`#${i.id} - ${
                  scope ? `${scope.name} (#${scope.id})` : 'Current game model'
                }`}
              </div>
            );
          })}
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        {selectedInstance && (
          <AsyncVariableForm
            getConfig={si =>
              getEditionConfig(si) as Promise<Schema<AvailableViews>>
            }
            update={(entity: IVariableInstance) =>
              dispatch(updateInstance(entity))
            }
            entity={selectedInstance}
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
