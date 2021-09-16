/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import {css} from '@emotion/css';
import * as React from 'react';
import {WegasErrorMessage} from '../../API/restClient';
import useTranslations, {WegasTranslations} from '../../i18n/I18nContext';
import {shallowEqual, useAppDispatch, useAppSelector} from '../../store/hooks';
import {closeNotification, WegasNotification} from '../../store/slices/notification';
import {dangerColor, successColor, warningColor} from '../styling/color';
import {cardShadow, cardShadowHover} from '../styling/style';

function prettyPrint(notification: WegasErrorMessage | string, i18n: WegasTranslations): string {
  if (typeof notification === 'string') {
    return notification;
  } else {
    if (notification.messageId != null) {
      const message = (i18n.WegasErrorMessage as Record<string, string>)[notification.messageId];
      if (message != null) {
        return message;
      }
    }
    return notification.message || 'something went wrong';
  }
}

function getBgColor(notification: WegasNotification): string {
  switch (notification.type) {
    case 'INFO':
      return successColor.toString();
    case 'WARN':
      return warningColor.toString();
    case 'ERROR':
    default:
      return dangerColor.toString();
  }
}

interface NotifProps {
  notification: WegasNotification;
  index: number,
}

function Notification({notification, index}: NotifProps) {

  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const closeCb = React.useCallback(() => {
    dispatch(closeNotification(index));
  }, [index]);

  React.useEffect(() => {
    let abort = false;
    globalThis.setTimeout(() => {
      if (!abort) {
        closeCb();
      }
    }, 10000);
    return () => {abort = true};
  }, [closeCb]);

  return (<div
    className={css({
      backgroundColor: getBgColor(notification),
      borderRadius: '5px',
      color: 'white',
      padding: '10px 100px',
      margin: '10px',
      boxShadow: cardShadow,
      fontSize: '1.3em',
      fontWeight: 300,
      ':hover': {
        boxShadow: cardShadowHover,
      },
    })}
    onClick={() => closeCb()}
  >
    {prettyPrint(notification.message, i18n)}
  </div>
  );
}

export default function Notifier(): JSX.Element {
  const notifications = useAppSelector(state => state.notifications, shallowEqual);

  return (
    <div
      className={css({
        position: 'fixed',
        zIndex: 999,
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      })}
    >
      {notifications.map((notification, index) =>
        notification.status === 'OPEN' ? (
          <Notification key={index} notification={notification} index={index} />
        ) : null,
      )}
    </div>
  );
}
