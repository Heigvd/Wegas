import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import {
  StoreDispatch,
  useStore,
  getDispatch,
} from '../../../data/Stores/store';
import { css, cx } from '@emotion/css';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import {
  AsyncVariableForm,
  parseEventFromIndex,
  EditorProps,
} from '../EntityEditor';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '../FormView';
import { LocalGlobalState } from '../../../data/Stores/storeFactory';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';
import {
  flex,
  flexColumn,
  grow,
  localSelection,
  MediumPadding,
} from '../../../css/classes';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { themeCTX, ThemeComponent } from '../../../Components/Theme/Theme';
import { IVariableInstance } from 'wegas-ts-api';
import { VariableDescriptor, VariableInstance } from '../../../data/selectors';
import { Edition, VariableEdition } from '../../../data/Reducer/globalState';
// import { VariableTreeTitle } from './VariableTreeView.tsx.old';
import { State } from '../../../data/Reducer/reducers';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { VariableTreeTitle } from './VariableTreeTitle';
import { ActionCreator } from '../../../data/actions';

const listBox = css({
  width: '100%',
  maxHeight: '100px',
  overflowY: 'auto',
  border: '1px solid ' + themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
});

const listItem = css({
  padding: '5px',
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.colors.HoverColor,
  },
});

const titleStyle = css({
  margin: '5px',
  fontWeight: 700,
});

function isEditingVariable(editing?: Edition): editing is VariableEdition {
  return (
    editing != null &&
    (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
    editing.entity.id != null
  );
}

export interface InstancePropertiesProps
  extends ThemeComponent,
    DisabledReadonly {
  state: LocalGlobalState;
  dispatch: StoreDispatch;
  actions?: EditorProps<IVariableInstance>['actions'];
}

function instancesSelector(s: State) {
  if (isEditingVariable(s.global.editing)) {
    return VariableInstance.all('parentId', s.global.editing.entity.id);
  }
  return [];
}

export function InstanceProperties({
  state,
  dispatch,
  actions,
  ...options
}: InstancePropertiesProps) {
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const editing = state.global.editing;
  const events = state.global.events;

  const [selectedInstanceId, setSelectedInstanceId] =
    React.useState<number | undefined>();

  const instances = useStore(instancesSelector);

  const selectedInstance =
    selectedInstanceId != null
      ? instances.find(i => i.id === selectedInstanceId)
      : undefined;

  const descriptor = isEditingVariable(editing)
    ? VariableDescriptor.select(editing.entity.id)
    : undefined;

  const subpath = isEditingVariable(editing) ? editing.path : undefined;
  const title = descriptor ? (
    <VariableTreeTitle
      variable={descriptor}
      subPath={subpath}
      className={cx(grow, titleStyle)}
    />
  ) : (
    i18nValues.instanceProps.noDescriptorEdited
  );

  return (
    <Toolbar className={MediumPadding}>
      <Toolbar.Header>
        <div className={cx(flex, flexColumn)}>
          <div>{title}</div>
          <div className={cx(listBox, grow)}>
            {instances.map(i => {
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
                        : i18nValues.instanceProps.currentGameModel
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
            onChange={newEntity => {
              dispatch(
                ActionCreator.EDITION_CHANGES({
                  newEntity: newEntity as IAbstractEntity,
                }),
              );
            }}
            {...options}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}

function stateSelector(s: State) {
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
}

export default function ConnectedInstancesEditor() {
  const state = useStore(stateSelector);

  const { themesState } = React.useContext(themeCTX);
  const modeName =
    themesState.themes[themesState.selectedThemes.editor].baseMode;

  const dispatch = getDispatch();

  return state == null || dispatch == null ? null : (
    <InstanceProperties state={state} dispatch={dispatch} modeName={modeName} />
  );
}