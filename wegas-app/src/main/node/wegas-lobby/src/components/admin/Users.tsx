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
import { getPaginatedUsers } from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import { WindowedContainer } from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import { panelPadding } from '../styling/style';
import UserCard from './UserCard';
import InlineLoading from '../common/InlineLoading';
import IconButton from '../common/IconButton';
import Checkbox from '../common/Checkbox';
export class SearchForm {
  page: number;
  size: number;
  query: string;

  constructor (page: number, size: number, query: string){
    this.page = page;
    this.size = size;
    this.query = query;
  }
}

export default function Users(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  let users = useAppSelector(state => {
    return {
      users: Object.values(state.users.users),
      status: state.admin.userStatus,
      totalResults: state.users.totalResults
    };
  }, shallowEqual);

  const [filter, setFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => {
    if (users.status === 'NOT_INITIALIZED') {
      dispatch(getPaginatedUsers(new SearchForm(page, pageSize, filter)));
    }
  }, []);

  React.useEffect(() => {
    if (page !== 1)
      setPage(1);
    else
      dispatch(getPaginatedUsers(new SearchForm(page, pageSize, filter)));
  }, [filter, pageSize]);

  React.useEffect(() => {    
    dispatch(getPaginatedUsers(new SearchForm(page, pageSize, filter)));
  }, [page]);

  const onNextPage = () => setPage(page<users.totalResults/pageSize?page + 1: page);
  const onPreviousPage = () => setPage(page>1?page - 1:1);

  const createCardCb = React.useCallback(
    (user: IUserWithId) => <UserCard size="SMALL" showEmail key={user.id} user={user} />,
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
            {users.totalResults} {i18n.users}
          </h3>
          <DebouncedInput
            autofocus = {true}
            size="SMALL"
            value={filter}
            placeholder={i18n.search}
            onChange={setFilter}
          />
        </Flex>
        <Flex
          justify="space-between"
          align="center"
          className={css({
            flexShrink: 0,
            height: '20px',
          })}
        >
          <div className={css({
            display: "flex",
            alignContent: "flex-start"
          })}>
            <h3>
            <IconButton onClick={onPreviousPage} icon={'caret-left'}></IconButton>
            {page}/{users.totalResults > 0 ? Math.ceil(users.totalResults/pageSize) : 1} 
            <IconButton onClick={onNextPage} icon={'caret-right'}></IconButton>
            </h3>
          </div>
          <div className={css({
            display: "flex",
            alignContent: "flex-end",
            flexDirection: "row"
          })}>
            <Checkbox label="20" value={pageSize === 20} onChange={(newValue: boolean) => setPageSize(newValue?20:pageSize)} />
            <Checkbox label="50" value={pageSize === 50} onChange={(newValue: boolean) => setPageSize(newValue?50:pageSize)} />
            <Checkbox label="100" value={pageSize === 100} onChange={(newValue: boolean) => setPageSize(newValue?100:pageSize)} />
          </div>
        </Flex>
        <WindowedContainer emptyMessage={<i>{i18n.noUsers}</i>} items={users.users.flatMap(user => {
      if (user != 'LOADING' && user.visible) {
        return [user.user];
      } else {
        return [];
      }
    }).sort((a,b) => (a.lastSeenAt && b.lastSeenAt && a.lastSeenAt > b.lastSeenAt) ? -1 : 1)}>
          {createCardCb}
        </WindowedContainer>
      </FitSpace>
    );
  }
}
