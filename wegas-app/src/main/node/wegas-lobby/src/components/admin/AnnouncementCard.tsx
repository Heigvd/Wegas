import { IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { deleteAnnouncement, updateAnnouncement } from '../../API/api';
import Form, { Field } from '../common/Form';
import Flex from '../common/Flex';
import Card from '../common/Card';
import {faPen, faTrash} from "@fortawesome/free-solid-svg-icons";
import IconButton from "../common/IconButton";
import {cardDetailsStyle, cardTitleStyle} from "../styling/style";

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
        <Flex direction="row" align={"center"} justify="space-between" grow={1}>
          <Flex direction={"column"}>
            <div className={cardTitleStyle}>{announcement.message}</div>
            <div className={cardDetailsStyle}>Displayed from {toReadableDateTime(announcement.displayStartTime)} to {toReadableDateTime(announcement.displayEndTime)}</div>
            <div className={cardDetailsStyle}>Intervened from {toReadableDateTime(announcement.interventionStartTime)} to {toReadableDateTime(announcement.interventionEndTime)}</div>
          </Flex>
          <Flex>
            <IconButton
                icon={faPen}
                onClick={() => setEditing(true)}
            >
            </IconButton>
            <IconButton
                icon={faTrash}
                onClick={deleteAnnouncementCallback}
            >
            </IconButton>
          </Flex>
        </Flex>
      </Card>
    );
  }
}
