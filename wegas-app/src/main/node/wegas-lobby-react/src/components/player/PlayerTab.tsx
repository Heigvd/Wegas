/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { getPlayers } from '../../API/api';
import { PlayerToGameModelLoading } from '../../API/restClient';
import { match } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useLocalStorageState } from '../../preferences';
import { usePlayers } from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import { WindowedContainer } from '../common/CardContainer';
import DebouncedInput from '../common/DebouncedInput';
import DropDownPanel from '../common/DropDownPanel';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import SortBy, { SortByOption } from '../common/SortBy';
import { successColor } from '../styling/color';
import { panelPadding } from '../styling/style';
import JoinGame from './JoinGame';
import PlayerCard from './PlayerCard';

interface SortBy {
  date: number;
  name: string;
}

const matchSearch = (search: string) => (data: PlayerToGameModelLoading) => {
  return match(search, regex => {
    return (
      (data.team != null &&
        data.team != 'LOADING' &&
        data.team.name != null &&
        data.team.name.match(regex) != null) ||
      (data.game != null &&
        data.game != 'LOADING' &&
        data.game.name != null &&
        data.game.name.match(regex) != null)
    );
  });
};

export default function PlayerTab(): JSX.Element {
  const players = usePlayers();
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  // hack: extract token from #/play/<TOKEN> url
  const location = useLocation();
  const [tokenState, setToken] = React.useState(
    location.pathname.startsWith('/player/join/') ? location.pathname.split('/')[3] : undefined,
  );

  const [viewMode, setViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>(
    tokenState != null ? 'EXPANDED' : 'COLLAPSED',
  );

  const [sortBy, setSortBy] = useLocalStorageState<{ key: keyof SortBy; asc: boolean }>(
    'player-sortby',
    {
      key: 'date',
      asc: false,
    },
  );

  //  const onSortChange = React.useCallback(({ key, asc }: { key: keyof SortBy; asc: boolean }) => {
  //    setSortBy({ key, asc });
  //  }, [setSortBy]);

  const [filter, setFilter] = React.useState('');

  const sortOptions: SortByOption<SortBy>[] = [
    { key: 'date', label: i18n.date },
    { key: 'name', label: i18n.name },
  ];

  const buildCardCb = React.useCallback(
    (p: PlayerToGameModelLoading) => (
      <PlayerCard key={p.player.id} player={p.player} team={p.team} />
    ),
    [],
  );

  React.useEffect(() => {
    if (players.status === 'NOT_INITIALIZED') {
      dispatch(getPlayers());
    }
  }, [players.status, dispatch]);

  if (players.status != 'READY') {
    return <InlineLoading />;
  } else {
    const filtered = filter ? players.players.filter(matchSearch(filter)) : players.players;
    const sorted = filtered.sort((a, b) => {
      const reverse = sortBy.asc ? 1 : -1;
      if (sortBy.key === 'date') {
        return reverse * (a.player.joinTime! - b.player.joinTime!);
      } else if (sortBy.key === 'name') {
        if (a.game != null && b.game != null && a.game != 'LOADING' && b.game != 'LOADING') {
          return reverse * (a.game.name || '').localeCompare(b.game.name || '');
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    });
    return (
      <FitSpace direction="column" overflow="auto" className={css({ position: 'relative' })}>
        <DropDownPanel
          state={viewMode}
          onClose={() => {
            setViewMode('COLLAPSED');
            setToken(undefined);
          }}
        >
          {viewMode === 'EXPANDED' ? (
            <JoinGame
              gameToken={tokenState}
              onClose={() => {
                setViewMode('COLLAPSED');
                setToken(undefined);
              }}
            />
          ) : null}
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
              onClick={() => {
                setViewMode('EXPANDED');
              }}
            >
              {i18n.joinGame}
            </IconButton>
            <SortBy options={sortOptions} current={sortBy} onChange={setSortBy} />
            <DebouncedInput
              size="SMALL"
              value={filter}
              placeholder={i18n.search}
              onChange={setFilter}
            />
          </Flex>

          {players.status === 'READY' ? (
            <>
              <WindowedContainer items={sorted}>{buildCardCb}</WindowedContainer>
              {sorted.length <= 0 ? <i>{i18n.noPlayers}</i> : null}
            </>
          ) : (
            <InlineLoading />
          )}
        </FitSpace>
      </FitSpace>
    );
  }
}
