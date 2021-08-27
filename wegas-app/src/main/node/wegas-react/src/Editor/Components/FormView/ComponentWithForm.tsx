import * as React from 'react';
import {
  storeFactory,
  LocalGlobalState,
} from '../../../data/Stores/storeFactory';
import {
  AsyncVariableForm,
  parseEventFromIndex,
  getConfig,
  getUpdate,
  getEntity,
  editingGotPath,
} from '../EntityEditor';
import { css, cx } from 'emotion';
import {
  Edition,
  closeEditor,
  EditingState,
  ActionsProps,
} from '../../../data/Reducer/globalState';
import { StoreDispatch, store, useStore } from '../../../data/Stores/store';
import { createStoreConnector } from '../../../data/connectStore';
import { flex, grow, autoScroll, halfOpacity } from '../../../css/classes';
import { InstancePropertiesProps } from '../Variable/InstanceProperties';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { Toolbar } from '../../../Components/Toolbar';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { Dispatch } from 'redux';
import { StateActions, ActionCreator } from '../../../data/actions';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { fullscreenCTX } from '../LinearTabLayout/DnDTabLayout';

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
  const [instanceView, setInstanceView] = React.useState(false);
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
      {localState.editing && localEntity && <ReflexSplitter />}
      {localState.editing && localEntity && (
        <ReflexElement
          flex={
            flexValues.descriptor == null
              ? defaultFlexValues.descriptor
              : flexValues.descriptor
          }
          className={cx(flex)}
        >
          <EmbeddedForm
            localState={localState}
            localDispatch={localDispatch}
            onInstanceEditorAction={
              entityEditor ? () => setInstanceView(show => !show) : undefined
            }
            noClose={fullscreenFSM}
          />
        </ReflexElement>
      )}
      {instanceView && entityEditor && <ReflexSplitter />}
      {instanceView && entityEditor && (
        <ReflexElement
          flex={
            flexValues.instance == null
              ? defaultFlexValues.instance
              : flexValues.instance
          }
          className={cx(flex)}
        >
          <Toolbar>
            <Toolbar.Header>
              <IconButton
                icon="times"
                tooltip="Close instance editor"
                className={closeButtonStyle}
                onClick={() => setInstanceView(false)}
              />
            </Toolbar.Header>
            <Toolbar.Content>
              <AsyncInstancesEditor
                state={{ global: localState }}
                dispatch={localDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />
            </Toolbar.Content>
          </Toolbar>
        </ReflexElement>
      )}
    </ReflexContainer>
  );
}
