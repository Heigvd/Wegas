import * as React from 'react';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import InlineLoading from '../common/InlineLoading';
import AnnouncementCard from './AnnouncementCard';
import { WindowedContainer } from '../common/CardContainer';
import { IAnnouncementWithId } from 'wegas-ts-api';
import { createAnnouncement, getAllAnnouncements } from '../../API/api';
import Button from '../common/ActionButton';

export default function Announcements(): JSX.Element {
  const dispatch = useAppDispatch();
  //const i18n= useTranslations();

  let announcements = useAppSelector(state => {
    return {
      announcements: state.announcements.announcements,
      status: state.announcements.status,
    };
  }, shallowEqual);

  const sorted = Object.values(announcements.announcements).sort(
    (a, b) => a.creationTime - b.creationTime,
  );

  React.useEffect(() => {
    if (announcements.status === 'NOT_INITIALIZED') {
      dispatch(getAllAnnouncements());
    }
  }, [announcements]);

  const makeCardCallback = React.useCallback(
    (a: IAnnouncementWithId) => <AnnouncementCard key={a.id} announcement={a} />,
    [],
  );

  const createAnnouncementCallback = React.useCallback(async () => {
    return dispatch(
      createAnnouncement({
        '@class': 'Announcement',
        message: 'New announcement',
        messageType: 'INFO',
        creationTime: Date.now(),
        displayStartTime: Date.now(),
        displayEndTime: Date.now() + 1000 * 60 * 60, // +1 hour
      }),
    );
  }, []);

  if (announcements.status !== 'ALL_LOADED') {
    return (
      <div>
        <InlineLoading />
      </div>
    );
  } else {
    return (
      <div>
        <div>
          <Button label="Add new" onClick={createAnnouncementCallback}></Button>
        </div>
        <WindowedContainer emptyMessage={'No announcements'} items={sorted}>
          {makeCardCallback}
        </WindowedContainer>
      </div>
    );
  }
}
