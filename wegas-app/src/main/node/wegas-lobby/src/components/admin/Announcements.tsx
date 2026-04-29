import * as React from 'react';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import InlineLoading from '../common/InlineLoading';
import AnnouncementCard from './AnnouncementCard';
import { WindowedContainer } from '../common/CardContainer';
import { IAnnouncementWithId } from 'wegas-ts-api';
import { createAnnouncement, getAllAnnouncements } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import Flex from '../common/Flex';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { successColor } from '../styling/color';
import IconButton from '../common/IconButton';

export default function Announcements(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  let announcements = useAppSelector(state => {
    return {
      announcements: state.announcements.announcements,
      status: state.announcements.status,
    };
  }, shallowEqual);

  const sorted = Object.values(announcements.announcements).sort(
    (a, b) => b.creationTime - a.creationTime,
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
        <Flex justify="space-between" align="center">
          <h3>{i18n.announcements}</h3>
          <IconButton
            icon={faPlusCircle}
            iconColor={successColor.toString()}
            onClick={createAnnouncementCallback}
          >
            {i18n.createAnnouncement}
          </IconButton>
        </Flex>
        <div></div>
        <WindowedContainer emptyMessage={'No announcements'} items={sorted}>
          {makeCardCallback}
        </WindowedContainer>
      </div>
    );
  }
}
