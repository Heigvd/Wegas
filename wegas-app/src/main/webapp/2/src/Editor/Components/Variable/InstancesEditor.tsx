import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { StoreDispatch, useStore, getDispatch } from '../../../data/store';
import { css, cx } from 'emotion';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import {
  AsyncVariableForm,
  parseEventFromIndex,
  EditorProps,
} from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { LocalGlobalState } from '../../../data/storeFactory';
import { flex, flexColumn, grow, localSelection } from '../../../css/classes';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { themeVar } from '../../../Components/Style/ThemeVars';
import { IVariableInstance } from 'wegas-ts-api/typings/WegasEntities';
import { VariableInstance } from '../../../data/selectors';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';

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
  // editing: Readonly<GlobalState['editing']>;
  // events: Readonly<WegasEvent[]>;
  state: LocalGlobalState;
  actions?: EditorProps<IVariableInstance>['actions'];
  dispatch: StoreDispatch;
}

export function InstancesEditor({
  // instances,
  // editing,
  state,
  actions,
  // events,
  dispatch,
}: InstancesEditorProps) {
  const editing = state.global.editing;
  const events = state.global.events;

  const [selectedInstanceId, setSelectedInstanceId] = React.useState<
    number | undefined
  >();

  const instances = useStore(() => {
    if (
      editing &&
      (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
      editing.entity.id
    ) {
      return VariableInstance.all('parentId', editing.entity.id);
    }
    return [];
  }, deepDifferent);

  const selectedInstance =
    selectedInstanceId != null
      ? instances.find(i => i.id === selectedInstanceId)
      : undefined;

  return (
    <Toolbar>
      <Toolbar.Header>
        <div className={cx(flex, flexColumn)}>
          <div className={cx(listBox, grow)}>
            {editing == null
              ? 'No selected variable descriptor'
              : instances.map(i => {
                  if (i) {
                    const scope = getScopeEntity(i);
                    return (
                      <div
                        key={i.id}
                        className={cx(
                          listItem,
                          i.id === selectedInstanceId && localSelection,
                        )}
                        onClick={() =>
                          setSelectedInstanceId(oldState =>
                            oldState === i.id ? undefined : i.id,
                          )
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
        {selectedInstance != null && (
          <AsyncVariableForm
            getConfig={si =>
              getEditionConfig(si) as Promise<Schema<AvailableViews>>
            }
            update={(entity: IVariableInstance) =>
              dispatch(updateInstance(entity))
            }
            entity={selectedInstance}
            error={parseEventFromIndex(events)}
            actions={actions}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function ConnectedInstancesEditor() {
  const state = useStore(s => {
    const editing = s.global.editing;
    if (!editing) {
      return null;
    } else {
      return {
        global: {
          editing,
          events: s.global.events,
          eventsHandlers: s.global.eventsHandlers,
        },
      };
    }
  }, deepDifferent);

  const dispatch = getDispatch();

  return state == null || dispatch == null ? null : (
    <InstancesEditor state={state} dispatch={dispatch} />
  );
}
