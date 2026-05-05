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
import { faCog, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../common/IconButton';
import { cardDetailsStyle, cardTitleStyle } from '../styling/style';
import OpenCloseModal from '../common/OpenCloseModal';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../selectors/userSelector';
import { css } from '@emotion/css';

const announcementCardStyle = css({
  ['&.INFO']: {
    color: '#0A9FF1',
    background: '#E1F0F8',
  },
  ['&.WARNING']: {
    color: '#FFC700',
    background: '#FAF4E0',
  },
  ['&.MAINTENANCE']: {
    color: '#FF7C00',
    background: '#FAECE0',
  },
  ['&.INCIDENT']: {
    color: '#DC0000',
    background: '#F6E0E0',
  },
});

export const announcementFields: Field<IAnnouncement>[] = [
  {
    type: 'text',
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

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
];

function toReadableDateTime(timestamp?: number | null): string {
  if (timestamp == undefined) {
    return '-';
  } else {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
              <div className={cardDetailsStyle}>
                Intervened from {toReadableDateTime(announcement.interventionStartTime)} to{' '}
                {toReadableDateTime(announcement.interventionEndTime)}
              </div>
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
        <Flex direction="row" align={'center'} justify="space-between" grow={1}>
          <div className={cardTitleStyle}>{announcement.message}</div>
          <IconButton icon={faTimes} onClick={onDismiss} />
        </Flex>
      </Card>
    );
  }
}
