/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IAnnouncement, IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { deleteAnnouncement, updateAnnouncement } from '../../API/api';
import Form, { Field } from '../common/Form';
import Flex from '../common/Flex';
import Card from '../common/Card';
import { faCog, faTrash } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../common/IconButton';
import { cardDetailsStyle, cardTitleStyle } from '../styling/style';
import OpenCloseModal from '../common/OpenCloseModal';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../selectors/userSelector';
import { css, cx } from '@emotion/css';
import useTranslations from '../../i18n/I18nContext';
import {
  announcementError,
  announcementErrorLight,
  announcementInfo,
  announcementInfoLight,
  announcementMaintenance,
  announcementMaintenanceLight,
  announcementWarning,
  announcementWarningLight,
} from '../styling/color';

const announcementCardStyle = css({
  ['& > div:nth-child(2)']: {
    height: '100%',
  },
  ['&.INFO']: {
    color: announcementInfo.toString(),
    background: announcementInfoLight.toString(),
  },
  ['&.WARNING']: {
    color: announcementWarning.toString(),
    background: announcementWarningLight.toString(),
  },
  ['&.MAINTENANCE']: {
    color: announcementMaintenance.toString(),
    background: announcementMaintenanceLight.toString(),
  },
  ['&.INCIDENT']: {
    color: announcementError.toString(),
    background: announcementErrorLight.toString(),
  },
});

const announcementCardContentStyle = css({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexGrow: 1,
  gap: '10px',
  height: '100%',
  padding: '10px 0 10px 0',
});

const dismissStyle = css({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  padding: '0 6px 0 16px',
  borderLeft: '1px solid #d7d7d7',
  color: 'var(--fgColor)',
  textTransform: 'uppercase',
  ':hover': {
    cursor: 'pointer',
  },
});

export const announcementFields: Field<IAnnouncement>[] = [
  {
    type: 'textarea',
    label: 'Message',
    key: 'message',
    isMandatory: true,
    errorMessage: 'Need a message',
  },
  {
    type: 'select',
    label: 'Type',
    key: 'messageType',
    defaultValue: 'INFO',
    values: ['INFO', 'WARNING', 'MAINTENANCE', 'INCIDENT'],
    isMandatory: false,
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Display Start Time',
    key: 'displayStartTime',
    isMandatory: true,
    errorMessage: 'Invalid start time',
    withTime: true,
    //isErroneous: (a) => isValidDate(a.displayStartTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Display End Time',
    key: 'displayEndTime',
    isMandatory: true,
    errorMessage: 'Invalid end time',
    withTime: true,

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Intervention Start Time',
    key: 'interventionStartTime',
    isMandatory: false,
    errorMessage: 'Invalid start time',
    withTime: true,
    showIf: a => a.messageType === 'MAINTENANCE' || a.messageType === 'INFO',

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Intervention End Time',
    key: 'interventionEndTime',
    isMandatory: false,
    errorMessage: 'Invalid end time',
    withTime: true,
    showIf: a => a.messageType === 'MAINTENANCE' || a.messageType === 'INFO',

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
];

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function toReadableDateTime(timestamp?: number | null): string {
  if (timestamp == undefined) {
    return '-';
  } else {
    return new Date(timestamp).toLocaleString(undefined, dateOptions);
  }
}

export default function AnnouncementCard({
  announcement,
  onDismiss,
}: {
  announcement: IAnnouncementWithId;
  onDismiss?: () => void;
}): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useCurrentUser();
  const location = useLocation();

  const [editing, setEditing] = React.useState(false);
  const i18n = useTranslations();

  const deleteAnnouncementCallback = React.useCallback(async () => {
    return dispatch(deleteAnnouncement(announcement.id));
  }, []);

  const updateAnnouncementCallback = React.useCallback(
    async (announcement: IAnnouncementWithId) => {
      const updated = { ...announcement };

      setEditing(false);

      return dispatch(updateAnnouncement({ ...updated }));
    },
    [],
  );

  const formatDateCallback = React.useCallback((epoch: number) => {
    return new Date(epoch).toLocaleString(undefined, dateOptions);
  }, []);

  React.useEffect(() => {
    console.log('Location', location);
    console.log('User', user);
  }, []);

  const getIconColor = React.useCallback(() => {
    switch (announcement.messageType) {
      case 'INFO':
        return 'ICON_blue_info_fa';
      case 'WARNING':
        return 'ICON_yellow_exclamation_fa';
      case 'MAINTENANCE':
        return 'ICON_orange_exclamation_fa';
      case 'INCIDENT':
        return 'ICON_red_close_fa';
      default:
        return 'ICON_blue_info_fa';
    }
  }, [announcement.messageType]);

  // Not a fan of this check
  if (user.isAdmin && location.pathname.includes('/admin')) {
    if (editing) {
      return (
        <Form
          fields={announcementFields}
          value={announcement}
          onSubmit={updateAnnouncementCallback}
        />
      );
    } else {
      return (
        <Card title={String(announcement.id)} illustration={getIconColor()}>
          <Flex direction="row" align={'center'} justify="space-between" grow={1}>
            <Flex direction={'column'}>
              <div className={cardTitleStyle}>{announcement.message}</div>
              <div className={cardDetailsStyle}>
                Displayed from {toReadableDateTime(announcement.displayStartTime)} to{' '}
                {toReadableDateTime(announcement.displayEndTime)}
              </div>
              {(announcement.messageType === 'INFO' ||
                announcement.messageType === 'MAINTENANCE') && (
                <div className={cardDetailsStyle}>
                  Intervened from {toReadableDateTime(announcement.interventionStartTime)} to{' '}
                  {toReadableDateTime(announcement.interventionEndTime)}
                </div>
              )}
            </Flex>
            <Flex>
              <OpenCloseModal
                icon={faCog}
                iconTitle={announcement.message}
                title={announcement.messageType}
                illustration={getIconColor()}
                showCloseButton={true}
                route={`${announcement.id}/announcement`}
              >
                {close => (
                  <FitSpace direction="column" overflow="auto">
                    <CardContainer>
                      <Form
                        fields={announcementFields}
                        value={announcement}
                        onSubmit={async updated => {
                          await dispatch(updateAnnouncement(updated as IAnnouncementWithId));
                          close();
                        }}
                      />
                    </CardContainer>
                  </FitSpace>
                )}
              </OpenCloseModal>
              <IconButton icon={faTrash} onClick={deleteAnnouncementCallback} />
            </Flex>
          </Flex>
        </Card>
      );
    }
  } else {
    return (
      <Card
        illustration={getIconColor()}
        className={announcementCardStyle + ' ' + announcement.messageType}
        title={announcement.messageType}
      >
        <Flex className={announcementCardContentStyle}>
          <Flex direction="column">
            <div className={cardTitleStyle}>{announcement.message}</div>
            {announcement.interventionStartTime && announcement.interventionEndTime && (
              <div className={cx(cardDetailsStyle, css({ marginTop: '10px' }))}>
                <div>
                  {i18n.maintenanceStart} : {formatDateCallback(announcement.interventionStartTime)}
                </div>
                <div>
                  {i18n.maintenanceEnd} : {formatDateCallback(announcement.interventionEndTime)}
                </div>
              </div>
            )}
          </Flex>
          <div onClick={onDismiss} className={dismissStyle}>
            {i18n.dismiss}
          </div>
        </Flex>
      </Card>
    );
  }
}
