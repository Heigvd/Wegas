import { IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { deleteAnnouncement, updateAnnouncement } from '../../API/api';
import Form, { Field } from '../common/Form';
import Button from '../common/Button';


const announcementFields: Field<IAnnouncementWithId>[] = [
  {
    type: 'text',
    label: "Message",
    key: 'message',
    isMandatory: true,
    errorMessage: "Need a message",
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Display Start Time',
    key: 'displayStartTime',
    isMandatory: true,
    errorMessage: "Invalid start time",
    withTime: true
    //isErroneous: (a) => isValidDate(a.displayStartTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Display End Time',
    key: 'displayEndTime',
    isMandatory: true,
    errorMessage: "Invalid end time",
    withTime: true

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Intervention Start Time',
    key: 'interventionStartTime',
    isMandatory: false,
    errorMessage: "Invalid start time",
    withTime: true

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
  {
    type: 'date',
    representation: 'timestamp',
    label: 'Intervention End Time',
    key: 'interventionEndTime',
    isMandatory: false,
    errorMessage: "Invalid end time",
    withTime: true

    //isErroneous: (a) => isValidDate(a.displayEndTime)
  },
  {
    type: 'boolean',
    label: 'Warning',
    key: 'messageType',
    isMandatory: false,
    showAs: 'toggle',

  }
]

function toReadableDateTime(timestamp?: number | null): string {
  if(timestamp == undefined){
    return '-';
  }else {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default function AnnouncementCard({
  announcement
}: {announcement: IAnnouncementWithId}
) : JSX.Element{

  const dispatch = useAppDispatch();

  const [editing, setEditing] = React.useState(false);

  const deleteAnnouncementCallback = React.useCallback(async () => {
    return dispatch(deleteAnnouncement(announcement.id));
  }, []);

  const updateAnnouncementCallback = React.useCallback(async (a:IAnnouncementWithId) => {
    const updated = {...a};
    updated.messageType = updated.messageType ? 'INFO' : 'WARNING';

    setEditing(false);

    return dispatch(updateAnnouncement({...updated}));
  }, []);


  if(editing){
    return <Form
      fields={announcementFields}
      value={announcement}
      onSubmit={updateAnnouncementCallback}
    />
  }
  else {
    return (
      <div>
        <h2>Message Id : {announcement.id}</h2>
        <p>Type : {announcement.messageType}</p>
        <p>Message : {announcement.message}</p>
        <p>Display start time : {toReadableDateTime(announcement.displayStartTime)}</p>
        <p>Display end time : {toReadableDateTime(announcement.displayEndTime)}</p>
        <p>Intervention start time : {toReadableDateTime(announcement.interventionStartTime)}</p>
        <p>Intervention end time : {toReadableDateTime(announcement.interventionEndTime)}</p>
        <Button label={"Edit"} onClick={() => setEditing(true)}></Button>
        <Button label={"Delete"} onClick={deleteAnnouncementCallback}></Button>
      </div>
    )}
}