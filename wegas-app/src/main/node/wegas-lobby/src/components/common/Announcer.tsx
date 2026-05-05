/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import { getActiveAnnouncements } from '../../API/api';
import { dismissAnnouncement } from '../../store/slices/announcement';
import AnnouncementCard from '../admin/AnnouncementCard';
import Flex from './Flex';
import { css } from '@emotion/css';

export default function Announcer(): JSX.Element {
  const dispatch = useAppDispatch();

  const { announcements, status, dismissedIds } = useAppSelector(state => ({
    announcements: state.announcements.active.announcements,
    status: state.announcements.active.status,
    dismissedIds: state.announcements.active.dismissedIds,
  }), shallowEqual);

  const dismiss = React.useCallback((id: number) => {
    dispatch(dismissAnnouncement(id));
  }, [dispatch]);

  const sorted = Object.values(announcements)
    .filter(a => !dismissedIds.includes(a.id))
    .sort((a, b) => b.displayStartTime - a.displayStartTime);

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(getActiveAnnouncements());
    }
  }, [status]);

  if (sorted.length === 0) {
    return <></>;
  }

  // The padding and margin shouldn't be handled this directly

  return (
    <Flex direction="column" className={css({ padding: '5px', margin: '10px' })}>
      {sorted.map(a => (
        <AnnouncementCard key={a.id} announcement={a} onDismiss={() => dismiss(a.id)} />
      ))}
    </Flex>
  );
}
