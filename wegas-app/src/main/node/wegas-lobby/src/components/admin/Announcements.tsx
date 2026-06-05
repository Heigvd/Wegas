/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import InlineLoading from '../common/InlineLoading';
import AnnouncementCard from './AnnouncementCard';
import {announcementFields} from "./AnnouncementForm";
import { WindowedContainer } from '../common/CardContainer';
import { IAnnouncement, IAnnouncementWithId } from 'wegas-ts-api';
import { createAnnouncement, getAllAnnouncements } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import Flex from '../common/Flex';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { successColor } from '../styling/color';
import IconButton from '../common/IconButton';
import FitSpace from '../common/FitSpace';
import { panelPadding } from '../styling/style';
import DropDownPanel from '../common/DropDownPanel';
import { css } from '@emotion/css';
import Form from '../common/Form';

interface CreateAnnouncementProps {
  close: () => void;
}

function CreateAnnouncement({ close }: CreateAnnouncementProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const announcement: IAnnouncement = {
    '@class': 'Announcement',
    message: 'New announcement',
    messageType: 'INFO',
    creationTime: Date.now(),
    displayStartTime: Date.now(),
    displayEndTime: Date.now() + 1000 * 60 * 60, // +1 hour
  };

  const createAnnouncementCallback = React.useCallback(
    async (announcement: IAnnouncement) => {
      return dispatch(createAnnouncement(announcement)).then(() => close());
    },
    [dispatch, close],
  );

  return (
    <FitSpace direction="column" className={css({ minWidth: '400px', paddingBottom: '20px' })}>
      <h3>{i18n.announcements}</h3>
      <Form
        fields={announcementFields}
        value={announcement}
        onSubmit={a => createAnnouncementCallback(a)}
        submitLabel={i18n.create}
      />
    </FitSpace>
  );
}

export default function Announcements(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  let announcements = useAppSelector(state => {
    return {
      announcements: state.announcements.all.announcements,
      status: state.announcements.all.status,
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

  const [viewMode, setViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>('COLLAPSED');

  const makeCardCallback = React.useCallback(
    (a: IAnnouncementWithId) => <AnnouncementCard key={a.id} announcement={a} />,
    [],
  );

  if (announcements.status !== 'READY') {
    return (
      <div>
        <InlineLoading />
      </div>
    );
  } else {
    return (
      <FitSpace direction="column" overflow="auto" className={css({ position: 'relative' })}>
        <DropDownPanel
          state={viewMode}
          onClose={() => {
            setViewMode('COLLAPSED');
          }}
        >
          <CreateAnnouncement
            close={() => {
              setViewMode('COLLAPSED');
            }}
          />
        </DropDownPanel>
        <FitSpace direction="column" overflow="auto" className={panelPadding}>
          <Flex
            justify="space-between"
            align="center"
            className={css({
              flexShrink: 0,
              height: '80px',
            })}
          >
            <IconButton
              icon={faPlusCircle}
              iconColor={successColor.toString()}
              onClick={() => setViewMode('EXPANDED')}
            >
              {i18n.createAnnouncement}
            </IconButton>
          </Flex>
          <WindowedContainer emptyMessage={'No announcements'} items={sorted}>
            {makeCardCallback}
          </WindowedContainer>
        </FitSpace>
      </FitSpace>
    );
  }
}
