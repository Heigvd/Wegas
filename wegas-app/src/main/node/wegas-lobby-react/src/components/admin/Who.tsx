/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faEye, faSync } from '@fortawesome/free-solid-svg-icons';
import { uniq } from 'lodash';
import * as React from 'react';
import { IUserWithId } from 'wegas-ts-api';
import { getOnlineUsers, getUserByIds, syncOnlineUsers } from '../../API/api';
import { OnlineUser } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { customStateEquals, shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import { CardMainButton, CardMainWifButton } from '../common/Card';
import CardContainer from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import SortBy, { SortByOption } from '../common/SortBy';
import { cardDetailsStyle, panelPadding } from '../styling/style';
import UserCard from './UserCard';

interface KnownUser {
  user: IUserWithId;
  onlineUser: OnlineUser;
}

const roleLevels = [0, 1, 2, 3, 4] as const;

type RoleLevelTypes = typeof roleLevels[number];

const matchSearch = (search: string) => (data: KnownUser) => {
  const regex = new RegExp(search, 'i');
  if (search) {
    return data.user.name != null && data.user.name.match(regex) != null;
  } else {
    return true;
  }
};

export default function Users(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const onlineUsers = useAppSelector(state => state.admin.onlineUsers, shallowEqual);
  const [loadingUnknown, setLoadingUnknown] = React.useState<number[]>([]);

  const users = useAppSelector(state => {
    const status: { known: KnownUser[]; unknown: number[] } = {
      known: [],
      unknown: [],
    };
    if (typeof onlineUsers === 'object') {
      Object.values(onlineUsers).map(onlineUser => {
        const userId = onlineUser.userId;
        const userDetail = state.users.users[userId];
        if (userDetail != null && userDetail != 'LOADING') {
          status.known.push({
            user: userDetail.user,
            onlineUser: onlineUser,
          });
        } else {
          status.unknown.push(userId);
        }
      });
    }
    return status;
  }, customStateEquals);

  React.useEffect(() => {
    if (onlineUsers === 'NOT_INITIALIZED') {
      dispatch(getOnlineUsers());
    }
  }, [onlineUsers, dispatch]);

  const allUserStates = useAppSelector(state => {
    return state.admin.userStatus;
  }, shallowEqual);

  React.useEffect(() => {
    if (allUserStates === 'NOT_INITIALIZED' && users.unknown.length > 0) {
      setLoadingUnknown(current => uniq([...users.unknown, ...current]));
      const toLoad = users.unknown.filter(uId => loadingUnknown.indexOf(uId) < 0);
      if (toLoad.length > 0) {
        dispatch(getUserByIds(toLoad)).then(action => {
          if (action.meta.requestStatus === 'fulfilled') {
            // once fulfilles, remove just loaded is from loading state
            setLoadingUnknown(current => current.filter(uId => action.meta.arg.indexOf(uId) < 0));
          }
        });
      }
    }
  }, [allUserStates, users.unknown, dispatch, loadingUnknown]);

  const [sortBy, setSortBy] = React.useState<{ key: keyof IUserWithId; asc: boolean }>({
    key: 'lastSeenAt',
    asc: false,
  });

  const sortOptions: SortByOption<IUserWithId>[] = [
    { key: 'lastSeenAt', label: i18n.lastSeenAtKey },
    { key: 'name', label: i18n.name },
  ];

  const onSortChange = React.useCallback(
    ({ key, asc }: { key: keyof IUserWithId; asc: boolean }) => {
      setSortBy({ key, asc });
    },
    [],
  );

  const [filter, setFilter] = React.useState('');

  if (onlineUsers === 'LOADING' || onlineUsers === 'NOT_INITIALIZED') {
    return <InlineLoading />;
  } else {
    const filtered = filter ? users.known.filter(matchSearch(filter)) : users.known;

    const theUsers = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'lastSeenAt') {
        return reverse * ((a.user.lastSeenAt || 0) - (b.user.lastSeenAt || 0));
      } else if (sortBy.key === 'name') {
        return reverse * (a.user.name || '').localeCompare(b.user.name || '');
      } else {
        return 0;
      }
    });

    const mappedByRoles = theUsers.reduce<Record<RoleLevelTypes, KnownUser[]>>(
      (map, user) => {
        const roleN = user.onlineUser.highestRole;
        map[roleN] = map[roleN] || [];
        map[roleN].push(user);
        return map;
      },
      { 0: [], 1: [], 2: [], 3: [], 4: [] },
    );

    return (
      <FitSpace
        direction="column"
        overflow="auto"
        className={cx(panelPadding, css({ position: 'relative' }))}
      >
        <Flex
          justify="space-between"
          align="center"
          className={css({
            flexShrink: 0,
            height: '80px',
          })}
        >
          <h3>
            {Object.keys(onlineUsers).length} {i18n.connectedUsers}
          </h3>
          <ActionIconButton
            title="sync"
            onClick={async () => {
              return dispatch(syncOnlineUsers());
            }}
            icon={faSync}
          />
          <SortBy options={sortOptions} current={sortBy} onChange={onSortChange} />
          <DebouncedInput
            size="SMALL"
            value={filter}
            placeholder={i18n.search}
            onChange={setFilter}
          />
        </Flex>

        <CardContainer>
          {roleLevels.map(level => {
            const list = mappedByRoles[level];
            return (
              <div key={level}>
                <h4>{i18n.userLevels[level]}</h4>
                {list.map(({ user, onlineUser }) => (
                  <UserCard
                    size="MEDIUM"
                    key={user.id}
                    user={user}
                    extraDetails={
                      <>
                        <div className={cardDetailsStyle}>
                          {i18n.lastActivityDate}{' '}
                          {new Date(onlineUser.lastActivityDate || 0).toLocaleString()}
                        </div>
                      </>
                    }
                  >
                    {onlineUser.playerId ? (
                      <>
                        <CardMainWifButton
                          icon="trainer"
                          title={i18n.openGameAsTrainer}
                          url={`./host.html?id=${onlineUser.playerId}`}
                        />
                        <CardMainButton
                          icon={faEye}
                          title={i18n.spyPlayer}
                          url={`./game-lock.html?id=${onlineUser.playerId}`}
                        />
                      </>
                    ) : null}
                  </UserCard>
                ))}
              </div>
            );
          })}
        </CardContainer>
      </FitSpace>
    );
  }
}
