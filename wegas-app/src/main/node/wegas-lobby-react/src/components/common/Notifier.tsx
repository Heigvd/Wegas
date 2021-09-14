/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { css } from '@emotion/css';
import * as React from 'react';
import { WegasErrorMessage } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeNotification, ColabNotification } from '../../store/slices/notification';
import { dangerColor, successColor, warningColor } from '../styling/color';

function prettyPrint(notification: WegasErrorMessage | string, _i18n: unknown): string {
  if (typeof notification === 'string') {
    return notification;
  } else {
    if (notification.messageId != null) {
      return `ERROR #${notification.messageId}: ${notification.message}`;
    } else {
      return notification.message || 'default error message';
    }
  }
}

function getBgColor(notification: ColabNotification): string {
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

export default function Notifier(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const closeCb = (index: number) => {
    dispatch(closeNotification(index));
  };
  const notifications = useAppSelector(state => state.notifications, shallowEqual);

  return (
    <div
      className={css({
        position: 'fixed',
        zIndex: 999,
        top: 0,
        right: 0,
      })}
    >
      {notifications.map((notification, index) =>
        notification.status === 'OPEN' ? (
          <div
            key={index}
            className={css({
              backgroundColor: getBgColor(notification),
              color: 'white',
              border: '1px solid black',
              padding: '10px',
              margin: '10px',
            })}
            onClick={() => closeCb(index)}
          >
            {prettyPrint(notification.message, i18n)}
          </div>
        ) : null,
      )}
    </div>
  );
}
