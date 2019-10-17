import * as React from 'react';
import { storeFactory, LocalGlobalState } from '../../../data/storeFactory';
import { Actions } from '../../../data';
import getEditionConfig from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '.';
import { AsyncVariableForm, getError } from '../EntityEditor';
import { css, cx } from 'emotion';
import { Edition, closeEditor } from '../../../data/Reducer/globalState';
import { StoreDispatch } from '../../../data/store';
import {
  createStoreConnector,
  shallowDifferent,
} from '../../../data/connectStore';
import { flex, grow, autoScroll } from '../../../css/classes';

const growBig = css({
  flex: '30 1 auto',
});

const getEntity = (state?: Readonly<Edition>) => {
  if (!state) {
    return undefined;
  }
  switch (state.type) {
    case 'VariableCreate':
      return {
        '@class': state['@class'],
        parentId: state.parentId,
        parentType: state.parentType,
      };
    case 'Variable':
    case 'VariableFSM':
      return state.entity;
    case 'File':
      return state.entity;
    default:
      return undefined;
  }
};

const getUpdate = (state: Readonly<Edition>, dispatch: StoreDispatch) =>
  'actions' in state && state.actions.save
    ? state.actions.save
    : (entity: IAbstractEntity) => {
        dispatch(Actions.EditorActions.saveEditor(entity));
      };

const getConfig = (state: Readonly<Edition>) => (
  entity: IVariableDescriptor,
) => {
  return 'config' in state && state.config != null
    ? Promise.resolve(state.config)
    : (getEditionConfig(entity) as Promise<Schema<AvailableViews>>);
};

interface ComponentWithFormProps {
  children: (props: {
    localState: Readonly<Edition> | undefined;
    localDispatch: StoreDispatch;
  }) => React.ReactElement | null;
}

export function ComponentWithForm({ children }: ComponentWithFormProps) {
  const {
    useStore: useLocalStore,
    getDispatch: getLocalDispatch,
  } = React.useMemo(() => createStoreConnector(storeFactory()), []);
  const localState = useLocalStore(
    (state: LocalGlobalState) => state.global,
    shallowDifferent,
  );
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
            ]}
            entity={localEntity}
            error={getError(localState.events, localDispatch)}
          />
        </div>
      )}
    </div>
  );
}
