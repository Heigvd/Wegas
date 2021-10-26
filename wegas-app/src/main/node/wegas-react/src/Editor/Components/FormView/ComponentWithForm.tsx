import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement } from 'react-reflex';
import { Dispatch } from 'redux';
import { fullscreenCTX } from '../../../Components/Contexts/FullscreenContext';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { autoScroll, flex, grow, halfOpacity } from '../../../css/classes';
import { ActionCreator, StateActions } from '../../../data/actions';
import { createStoreConnector } from '../../../data/connectStore';
import {
  ActionsProps,
  closeEditor,
  EditingState,
  Edition,
} from '../../../data/Reducer/globalState';
import { store, StoreDispatch, useStore } from '../../../data/Stores/store';
import {
  LocalGlobalState,
  storeFactory,
} from '../../../data/Stores/storeFactory';
import {
  AsyncVariableForm,
  editingGotPath,
  getConfig,
  getEntity,
  getUpdate,
  parseEventFromIndex,
  VariableForm,
} from '../EntityEditor';
import { InstancePropertiesProps } from '../Variable/InstanceProperties';

const growBig = css({
  flex: '30 1 auto',
});
const closeButtonStyle = css({
  color: themeVar.colors.DisabledColor,
  marginLeft: 'auto',
});

export interface ComponentWithFormChildrenProps {
  localState: Readonly<Edition> | undefined;
  localDispatch: StoreDispatch;
}

export interface ComponentWithFormFlexValues {
  main?: number;
  descriptor?: number;
  instance?: number;
}

const defaultFlexValues: ComponentWithFormFlexValues = {
  main: 4,
  descriptor: 2,
  instance: 2,
};

export const flexValuesSchema = schemaProps.hashlist({
  label: 'Flex values',
  choices: [
    {
      label: 'Main pannel flex number',
      value: {
        prop: 'main',
        schema: schemaProps.number({
          label: 'Main pannel flex number',
          value: defaultFlexValues.main,
        }),
      },
    },
    {
      label: 'Second pannel flex number',
      value: {
        prop: 'descriptor',
        schema: schemaProps.number({
          label: 'Second pannel flex number',
          value: defaultFlexValues.descriptor,
        }),
      },
    },
    {
      label: 'Third pannel flex number',
      value: {
        prop: 'instance',
        schema: schemaProps.number({
          label: 'Third pannel flex number',
          value: defaultFlexValues.instance,
        }),
      },
    },
  ],
});

const AsyncInstancesEditor = asyncSFC<InstancePropertiesProps>(
  async (props: InstancePropertiesProps) => {
    const InstancesEditor = await Promise.resolve<
      typeof import('../Variable/InstanceProperties')['InstanceProperties']
    >(import('../Variable/InstanceProperties').then(m => m.InstanceProperties));
    return <InstancesEditor {...props} />;
  },
);

function EmbeddedForm({
  localState,
  localDispatch,
  onInstanceEditorAction,
  noClose,
}: {
  localState: EditingState;
  localDispatch: Dispatch<StateActions>;
  onInstanceEditorAction?: () => void;
  noClose?: boolean;
}) {
  const { editing, events } = localState;

  const path = React.useMemo(
    () => (editingGotPath(editing) ? editing.path : undefined),
    [editing],
  );
  const config = React.useMemo(() => editing && getConfig(editing), [editing]);
  const update = React.useMemo(
    () => editing && getUpdate(editing, localDispatch),
    [editing, localDispatch],
  );
  const entity = React.useMemo(() => getEntity(editing), [editing]);

  const actions: ActionsProps<IMergeable>[] = [
    ...Object.values(
      editing && 'actions' in editing && editing.actions.more
        ? editing.actions.more
        : {},
    ),
  ];
  if (!noClose) {
    actions.push({
      label: 'Close',
      sorting: 'close',
      action: () => localDispatch(closeEditor()),
    });
  }
  if (onInstanceEditorAction) {
    actions.push({
      label: 'Instance',
      sorting: 'toolbox',
      action: onInstanceEditorAction,
    });
  }
  if (!editing || !config || !update) {
    return null;
  }

  return (
    <AsyncVariableForm
      path={path}
      getConfig={config}
      update={update}
      actions={actions}
      entity={entity}
      onChange={newEntity => {
        localDispatch(
          ActionCreator.EDITION_CHANGES({
            newEntity: newEntity as IAbstractEntity,
          }),
        );
      }}
      error={parseEventFromIndex(events, localDispatch)}
    />
  );
}

interface ComponentWithFormProps extends DisabledReadonly {
  children: (
    props: ComponentWithFormChildrenProps,
  ) => React.ReactElement | null;
  entityEditor?: boolean;
  flexValues?: ComponentWithFormFlexValues;
}

export function ComponentWithForm({
  children,
  entityEditor,
  readOnly,
  disabled,
  flexValues = defaultFlexValues,
}: ComponentWithFormProps) {
  const { fullscreen } = React.useContext(fullscreenCTX);

  const { useStore: useLocalStore, getDispatch: getLocalDispatch } =
    React.useMemo(() => createStoreConnector(storeFactory()), []);

  const globalState = useStore(state => state.global.editing);

  const fullscreenFSM = globalState?.type === 'VariableFSM' && fullscreen;

  const localState = (fullscreenFSM ? useStore : useLocalStore)(
    (state: LocalGlobalState) => state.global,
    shallowDifferent,
  );
  const localDispatch = fullscreenFSM ? store.dispatch : getLocalDispatch();
  const localEntity = getEntity(localState.editing);

  return (
    <ReflexContainer
      className={cx(flex, grow, { [halfOpacity]: disabled })}
      orientation="vertical"
    >
      <ReflexElement
        flex={
          flexValues.main == null ? defaultFlexValues.main : flexValues.main
        }
        className={cx(flex, growBig, autoScroll)}
      >
        {children({
          localState: localState.editing,
          localDispatch,
        })}
      </ReflexElement>
      {localState.editing && localEntity && (
        <VariableForm
          editing={localState.editing}
          entity={getEntity(localState.editing)}
          events={localState.events}
        />
      )}
    </ReflexContainer>
  );
}
