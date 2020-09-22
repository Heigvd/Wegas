import * as React from 'react';
import { createStore, applyMiddleware, Reducer } from 'redux';
import { composeEnhancers } from '../data/store';
import thunk, { ThunkMiddleware } from 'redux-thunk';
import { createStoreConnector } from '../data/connectStore';
import u from 'immer';
import { flexColumn, flex, itemCenter, flexRow } from '../css/classes';
import { cx, css } from 'emotion';
import { omit } from 'lodash-es';
import { ITranslatableContent } from 'wegas-ts-api';
import { translate } from '../Editor/Components/FormView/translatable';
import { languagesCTX } from './Contexts/LanguagesProvider';
import { themeVar } from './Style/ThemeVars';
import { Button } from './Inputs/Buttons/Button';

const popupBackgroundStyle = css({
  zIndex: 100000,
  position: 'fixed',
  width: '100%',
  height: '100%',
  visibility: 'hidden',
});

const popupStyle = css({
  width: 'min-content',
  whiteSpace: 'nowrap',
  margin: '5px',
  padding: '2px',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  visibility: 'visible',
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  borderWidth: themeVar.Common.dimensions.BorderWidth,
  borderStyle: 'solid',
  borderColor: themeVar.Common.colors.MainColor,
});

interface Popup {
  /**
   * message - the message of the popup
   */
  message: ITranslatableContent;
  /**
   * duration - the duration of the popup in milliseconds
   */
  duration?: number;
  /**
   * timestamp - the timestamp when the popup was registered
   */
  timestamp: number;
}

interface PopupState {
  popups: { [id: string]: Popup };
}

const PopupActionTypes = {
  ADD_POPUP: 'AddPopup',
  REMOVE_POPUP: 'RemovePopup',
} as const;

function createAction<T extends ValueOf<typeof PopupActionTypes>, P>(
  type: T,
  payload: P,
) {
  return {
    type,
    payload,
  };
}

export const PopupActionCreator = {
  ADD_POPUP: (data: Popup & { id: string }) =>
    createAction(PopupActionTypes.ADD_POPUP, data),
  REMOVE_POPUP: (data: { id: string }) =>
    createAction(PopupActionTypes.REMOVE_POPUP, data),
};

type PopupActions<
  A extends keyof typeof PopupActionCreator = keyof typeof PopupActionCreator
> = ReturnType<typeof PopupActionCreator[A]>;

const popupsReducer: Reducer<Readonly<PopupState>, PopupActions> = u(
  (state: PopupState, action: PopupActions) => {
    switch (action.type) {
      case PopupActionTypes.ADD_POPUP: {
        state.popups[action.payload.id] = action.payload;
        break;
      }

      case PopupActionTypes.REMOVE_POPUP: {
        state.popups = omit(state.popups, action.payload.id);
        break;
      }
    }
    return state;
  },
  { popups: {} } as PopupState,
);

const store = createStore(
  popupsReducer,
  composeEnhancers(
    applyMiddleware(thunk as ThunkMiddleware<PopupState, PopupActions>),
  ),
);

const { useStore, getDispatch } = createStoreConnector(store);

export const popupDispatch = getDispatch();

export function PopupManager({ children }: React.PropsWithChildren<{}>) {
  const popups = useStore(s => s.popups);
  const { lang } = React.useContext(languagesCTX);
  return (
    <>
      <div className={cx(flex, flexColumn, itemCenter, popupBackgroundStyle)}>
        <div className={cx(flex, flexColumn, itemCenter)}>
          {Object.entries(popups).map(([id, { message, timestamp }]) => (
            <div key={id} className={cx(flex, flexRow, itemCenter, popupStyle)}>
              <div>
                {`${new Date(timestamp).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: 'numeric',
                  second: 'numeric',
                })} : ${translate(message, lang)}`}
              </div>
              <Button
                icon="times"
                onClick={() =>
                  popupDispatch(PopupActionCreator.REMOVE_POPUP({ id }))
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

export function addPopup(
  id: string,
  message: ITranslatableContent,
  duration?: number,
) {
  const timestamp = new Date().getTime();
  if (duration != null) {
    setTimeout(() => {
      popupDispatch(PopupActionCreator.REMOVE_POPUP({ id }));
    }, duration);
  }
  return PopupActionCreator.ADD_POPUP({ id, message, duration, timestamp });
}
