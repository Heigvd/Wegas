/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IUserWithId } from 'wegas-ts-api';
import { getAllUsers } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import { WindowedContainer } from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import SortBy, { SortByOption } from '../common/SortBy';
import { panelPadding } from '../styling/style';
import UserCard from './UserCard';

const matchSearch = (search: string) => (data: IUserWithId) => {
  const regex = new RegExp(search, 'i');
  if (search) {
    return data.name != null && data.name.match(regex) != null;
  } else {
    return true;
  }
};

export default function Users(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const users = useAppSelector(state => {
    return {
      users: Object.values(state.users.users),
      status: state.admin.userStatus,
    };
  }, shallowEqual);

  React.useEffect(() => {
    if (users.status === 'NOT_INITIALIZED') {
      dispatch(getAllUsers());
    }
  }, [users.status, dispatch]);

  const [sortBy, setSortBy] = React.useState<{ key: keyof IUserWithId; asc: boolean }>({
    key: 'lastSeenAt',
    asc: false,
  });

  const sortOptions: SortByOption<IUserWithId>[] = [
    { key: 'lastSeenAt', label: i18n.lastSeenAt },
    { key: 'name', label: i18n.name },
  ];

  const onSortChange = React.useCallback(
    ({ key, asc }: { key: keyof IUserWithId; asc: boolean }) => {
      setSortBy({ key, asc });
    },
    [],
  );

  const [filter, setFilter] = React.useState('');

  const createCardCb = React.useCallback(
    (user: IUserWithId) => <UserCard size="SMALL" key={user.id} user={user} />,
    [],
  );

  if (users.status !== 'READY') {
    return (
      <div>
        <h3>{i18n.users}</h3>
        <InlineLoading />
      </div>
    );
  } else {
    const mUsers = users.users.flatMap(user => {
      if (user != 'LOADING') {
        return [user.user];
      } else {
        return [];
      }
    });

    const filtered = filter ? mUsers.filter(matchSearch(filter)) : mUsers;

    const theUsers = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'lastSeenAt') {
        return reverse * ((a.lastSeenAt || 0) - (b.lastSeenAt || 0));
      } else if (sortBy.key === 'name') {
        return reverse * (a.name || '').localeCompare(b.name || '');
      } else {
        return 0;
      }
    });

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
            {Object.keys(theUsers).length} {i18n.users}
          </h3>
          <SortBy options={sortOptions} current={sortBy} onChange={onSortChange} />
          <DebouncedInput
            size="SMALL"
            value={filter}
            placeholder={i18n.search}
            onChange={setFilter}
          />
        </Flex>

        <WindowedContainer items={theUsers}>{createCardCb}</WindowedContainer>
      </FitSpace>
    );
  }
}
