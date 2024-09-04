import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ITranslatableContent } from 'wegas-ts-api';
import { flex, flexColumn, flexRow, itemCenter } from '../css/classes';
import { ActionCreator } from '../data/actions';
import { translate } from '../data/i18n';
import { store, useStore } from '../data/Stores/store';
import { languagesCTX } from './Contexts/LanguagesProvider';
import { Button } from './Inputs/Buttons/Button';
import { themeVar } from './Theme/ThemeVars';
import {classNameOrEmpty} from "../Helper/className";

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
  backgroundColor: themeVar.colors.HeaderColor,
  visibility: 'visible',
  borderRadius: themeVar.dimensions.BorderRadius,
  borderWidth: themeVar.dimensions.BorderWidth,
  borderStyle: 'solid',
  borderColor: themeVar.colors.PrimaryColor,
});

export interface Popup {
  /**
   * message - the message of the popup
   */
  message: ITranslatableContent;
  /**
   * timestamp - the timestamp when the popup was registered
   */
  timestamp: number;
  /**
   * duration - the duration of the popup in milliseconds
   */
  duration?: number;
  /**
   * className - class to apply to the popup
   */
  className?: string;
}

export interface PopupState {
  popups: { [id: string]: Popup };
}

export function PopupManager({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const popups = useStore(s => s.global.popups);
  const { lang } = React.useContext(languagesCTX);
  return (
    <>
      <div className={cx(flex, flexColumn, itemCenter, popupBackgroundStyle)}>
        <div className={cx(flex, flexColumn, itemCenter)}>
          {Object.entries(popups).map(([id, { message, timestamp, className }]) => (
            <div key={id} className={cx(flex, flexRow, itemCenter, popupStyle) + classNameOrEmpty(className)}>
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
                  store.dispatch(ActionCreator.REMOVE_POPUP({ id }))
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
  className?: string,
) {
  const timestamp = new Date().getTime();
  if (duration != null) {
    setTimeout(() => {
      store.dispatch(ActionCreator.REMOVE_POPUP({ id }));
    }, duration);
  }
  return ActionCreator.ADD_POPUP({ id, message, duration, timestamp, className });
}
