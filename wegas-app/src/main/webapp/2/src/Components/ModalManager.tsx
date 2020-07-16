import * as React from 'react';
import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from '../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../data/connectStore';
import u from 'immer';
import { IconButton } from './Inputs/Buttons/IconButton';
import { flexColumn, flex, itemCenter } from '../css/classes';
import { cx, css } from 'emotion';
import { omit } from 'lodash-es';

const modalBackgroundStyle = css({
  zIndex: 100000,
  position: 'fixed',
  width: '100%',
  height: '100%',
  visibility: 'hidden',
});

const modalPanelStyle = css({
  backgroundColor: 'red',
  visibility: 'visible',
});

interface Modal {
  /**
   * message - the message of the modal
   */
  message: string;
  /**
   * duration - the duration of the modal in milliseconds
   */
  duration?: number;
  /**
   * timestamp - the timestamp when the modal was registered
   */
  timestamp: number;
}

interface ModalState {
  modals: { [id: string]: Modal };
}

const ModalActionTypes = {
  ADD_MODAL: 'AddModal',
  REMOVE_MODAL: 'RemoveModal',
} as const;

function createAction<T extends ValueOf<typeof ModalActionTypes>, P>(
  type: T,
  payload: P,
) {
  return {
    type,
    payload,
  };
}

export const ModalActionCreator = {
  ADD_MODAL: (data: Modal & { id: string }) =>
    createAction(ModalActionTypes.ADD_MODAL, data),
  REMOVE_MODAL: (data: { id: string }) =>
    createAction(ModalActionTypes.REMOVE_MODAL, data),
};

type ModalActions<
  A extends keyof typeof ModalActionCreator = keyof typeof ModalActionCreator
> = ReturnType<typeof ModalActionCreator[A]>;

const modalsReducer: Reducer<Readonly<ModalState>, ModalActions> = u(
  (state: ModalState, action: ModalActions) => {
    switch (action.type) {
      case ModalActionTypes.ADD_MODAL: {
        state.modals[action.payload.id] = action.payload;
        break;
      }

      case ModalActionTypes.REMOVE_MODAL: {
        state.modals = omit(state.modals, action.payload.id);
        break;
      }
    }
    return state;
  },
  { modals: {} } as ModalState,
);

const store = createStore(
  modalsReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<ModalState, ModalActions>),
  ),
);

const { useStore, getDispatch } = createStoreConnector(store);

export const modalDispatch = getDispatch();

export function ModalManager({ children }: React.PropsWithChildren<{}>) {
  const modals = useStore(s => s.modals);
  return (
    <>
      <div className={cx(flex, flexColumn, itemCenter, modalBackgroundStyle)}>
        <div className={cx(flex, flexColumn, modalPanelStyle)}>
          {Object.entries(modals).map(([id, { message, timestamp }]) => (
            <div key={id}>
              {`${timestamp} : ${message}`}
              <IconButton
                icon="times"
                onClick={() =>
                  modalDispatch(ModalActionCreator.REMOVE_MODAL({ id }))
                }
              />
            </div>
          ))}
        </div>
      </div>
      {children}
    </>
  );
}

export function addModal(id: string, message: string, duration?: number) {
  const timestamp = new Date().getTime();
  if (duration != null) {
    setTimeout(() => {
      modalDispatch(ModalActionCreator.REMOVE_MODAL({ id }));
    }, duration);
  }
  return ModalActionCreator.ADD_MODAL({ id, message, duration, timestamp });
}
