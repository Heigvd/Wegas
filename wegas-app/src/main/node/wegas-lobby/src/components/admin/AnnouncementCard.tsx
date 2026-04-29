import { IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { deleteAnnouncement, updateAnnouncement } from '../../API/api';
import Form, { Field } from '../common/Form';
import Button from '../common/Button';
import Flex from '../common/Flex';
import Card from '../common/Card';

const announcementFields: Field<IAnnouncementWithId>[] = [
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
}: {
  announcement: IAnnouncementWithId;
}): JSX.Element {
  const dispatch = useAppDispatch();

  const [editing, setEditing] = React.useState(false);

  const deleteAnnouncementCallback = React.useCallback(async () => {
    return dispatch(deleteAnnouncement(announcement.id));
  }, []);

  const updateAnnouncementCallback = React.useCallback(async (a: IAnnouncementWithId) => {
    const updated = { ...a };

    setEditing(false);

    return dispatch(updateAnnouncement({ ...updated }));
  }, []);

  const getIconColor = React.useCallback(() => {
    switch (announcement.messageType) {
      case 'INFO':
        return 'ICON_black-yellow_cogs_fa';
      case 'WARNING':
        return 'ICON_black-red_cogs_fa';
      case 'MAINTENANCE':
        return 'ICON_black-orange_cogs_fa';
      case 'INCIDENT':
        return 'ICON_black-green_cogs_fa';
      default:
        return 'ICON_black-blue_cogs_fa';
    }
  }, [announcement.messageType]);

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
        <p>Type : {announcement.messageType}</p>
        <p>Message : {announcement.message}</p>
        <Flex direction="row" justify="space-between">
          <Flex direction="column">
            <p>Display start time :{toReadableDateTime(announcement.displayStartTime)}</p>
            <p>Display end time : {toReadableDateTime(announcement.displayEndTime)}</p>
          </Flex>
          <Flex direction="column">
            <p>
              Intervention start time : {toReadableDateTime(announcement.interventionStartTime)}
            </p>
            <p>Intervention end time : {toReadableDateTime(announcement.interventionEndTime)}</p>
          </Flex>
        </Flex>
        <Button label={'Edit'} onClick={() => setEditing(true)}></Button>
        <Button label={'Delete'} onClick={deleteAnnouncementCallback}></Button>
      </Card>
    );
  }
}
