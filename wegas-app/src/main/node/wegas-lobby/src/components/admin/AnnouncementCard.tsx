import { IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
//import * as ActionButton from '../common/ActionButton';
import { useAppDispatch } from '../../store/hooks';
import { deleteAnnouncement, updateAnnouncement } from '../../API/api';
import Form, { Field } from '../common/Form';
import Button from '../common/Button';


export default function AnnouncementCard({
  announcement
}: {announcement: IAnnouncementWithId}
) : JSX.Element{

  const dispatch = useAppDispatch();

  const [editing, setEditing] = React.useState(false);
  /*
  const [state, setState] = React.useState<{
    announcement: IAnnouncementWithId;
  }>({
    announcement: announcement,
  });*/

  /*
  const updateAnnouncementState = React.useCallback((gameModel: IGameModelWithId) => {
    setState(state => ({ ...state, gameModel: gameModel }));
  }, []);
*/
  const deleteAnnouncementCallback = React.useCallback(async () => {
    return dispatch(deleteAnnouncement(announcement.id));
  }, []);

  const updateAnnouncementCallback = React.useCallback(async (a:IAnnouncementWithId) => {
    return dispatch(updateAnnouncement({...announcement, ...a}));
  }, []);

  const announcementFields: Field<IAnnouncementWithId>[] = [
    {
      type: 'text',
      label: "Message",
      key: 'message',
      isMandatory: true
    }
  ]

  if(editing){
    return <Form
      fields={announcementFields}
      value={announcement}
      onSubmit={updateAnnouncementCallback}
    >
    </Form>
  }
  else {
  return (
    <div>
      <h2>{announcement.message}</h2>
      <p>Type : {announcement.messageType}</p>
      <p>Id : {announcement.id}</p>
      <p>Display start time : {announcement.displayStartTime}</p>
      <p>Display end time : {announcement.displayEndTime}</p>
      <p>Intervention start time : {announcement.interventionStartTime}</p>
      <p>Intervention end time : {announcement.interventionEndTime}</p>
      {/*<Button label={"Save"} onClick={() => updateAnnouncementCallback(announcement.id)}></Button>*/}
      <Button label={"Edit"} onClick={() => setEditing(true)}></Button>
      <Button label={"Delete"} onClick={deleteAnnouncementCallback}></Button>
    </div>
  )}
}