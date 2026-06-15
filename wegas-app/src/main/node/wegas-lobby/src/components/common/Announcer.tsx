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
import {css, cx} from '@emotion/css';

const announcerStyle = css({ padding: '5px', margin: '10px' })
const criticalStyle = css({ alignItems: 'center', boxSizing: 'border-box', width: '100%', padding: '20px', margin: '10px' })

export default function Announcer({critical = false}: {critical?: boolean}): JSX.Element {
  const dispatch = useAppDispatch();

  const { announcements, status, dismissedIds } = useAppSelector(state => ({
    announcements: state.announcements.active.announcements,
    status: state.announcements.active.status,
    dismissedIds: state.announcements.active.dismissedIds,
  }), shallowEqual);

  const dismiss = React.useCallback((id: number) => {
    dispatch(dismissAnnouncement(id));
  }, [dispatch]);

  const filteredAnnouncements = Object.values(announcements)
    .filter(a => {
      if (critical) {
        if (a.messageType === 'INCIDENT') {
          return true
        }

        if (a.messageType === 'MAINTENANCE') {
          const now = Date.now()

          if (now > a.interventionStartTime! && now < a.interventionEndTime!) {
            return true
          }
        }

        return false
      } else {
        return !dismissedIds.includes(a.id)
      }
    })
    .sort((a, b) => b.displayStartTime - a.displayStartTime);

  React.useEffect(() => {
    if (status === 'NOT_INITIALIZED') {
      dispatch(getActiveAnnouncements());
    }
  }, [status]);

  if (filteredAnnouncements.length === 0) {
    return <></>;
  }

  return (
    <Flex direction="column" className={cx(announcerStyle, critical && criticalStyle)}>
      {filteredAnnouncements.map(a => (
        <AnnouncementCard key={a.id} announcement={a} onDismiss={() => dismiss(a.id)} dismissable={!critical} />
      ))}
    </Flex>
  );
}
