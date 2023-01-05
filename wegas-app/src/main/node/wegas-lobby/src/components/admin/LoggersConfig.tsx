/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faSearch, faSync } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { changeLoggerLevel, getLoggerLevels } from '../../API/api';
import { ILevelDescriptor } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { getLogger, LoggerLevel, loggers as clientLoggers } from '../../logger';
import { shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import FitSpace from '../common/FitSpace';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import { linkStyle, panelPadding } from '../styling/style';

const LEVELS = ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

const levelStyle = css({});

const effectiveStyle = cx(
  levelStyle,
  css({
    fontWeight: 'bold',
  }),
);

const selectedStyle = cx(
  effectiveStyle,
  css({
    textDecoration: 'underline',
  }),
);

interface LoggerGridProps {
  title: React.ReactNode;
  levels: Record<string, ILevelDescriptor>;
  changeLevel: (loggerName: string, level: string) => void;
  className?: string;
}

function LoggerGrid({ title, levels, changeLevel, className }: LoggerGridProps) {
  const [search, setSearch] = React.useState('');

  const keys = Object.keys(levels)
    .filter(logger => !search || logger.includes(search))
    .sort();

  return (
    <FitSpace className={className} direction="column" overflow="auto">
      <h3>{title}</h3>
      <div>
        <label>
          <IconButton icon={faSearch} />
          <input type="text" onChange={e => setSearch(e.target.value)} />
        </label>
      </div>
      <div
        className={css({
          display: 'grid',
          overflow: 'auto',
          gridTemplateColumns: 'repeat(7, max-content)',
          '& div div': {
            paddingRight: '10px',
          },
        })}
      >
        {keys.map(loggerName => {
          const level = levels[loggerName];
          if (level != null) {
            return (
              <div
                key={loggerName}
                className={css({
                  display: 'contents',
                  ':hover': {
                    color: 'var(--hoverFgColor)',
                    '& > div:first-child': {
                      textDecoration: 'underline',
                    },
                  },
                })}
              >
                <div>{loggerName}</div>
                {LEVELS.map(lvl => {
                  const item = (
                    <span
                      onClick={() => changeLevel(loggerName, lvl)}
                      className={cx(linkStyle, css({ marginLeft: '5px' }))}
                    >
                      {lvl}
                    </span>
                  );
                  if (level.effectiveLevel !== lvl) {
                    return (
                      <div key={lvl} className={levelStyle}>
                        {item}
                      </div>
                    );
                  } else if (level.effectiveLevel === level.level) {
                    return (
                      <div key={lvl} className={selectedStyle}>
                        {item}
                      </div>
                    );
                  } else {
                    return (
                      <div key={lvl} className={effectiveStyle}>
                        {item}
                      </div>
                    );
                  }
                })}
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    </FitSpace>
  );
}

function isClientLevel(level: number): level is LoggerLevel {
  return level >= 0 && level <= 5;
}

function computeClientState(): { [key: string]: ILevelDescriptor } {
  const state: Record<string, ILevelDescriptor> = {};

  Object.entries(clientLoggers).forEach(([name, logger]) => {
    const currentLevel = LEVELS[logger.getLevel()];
    if (currentLevel != undefined) {
      state[name] = {
        level: currentLevel,
        effectiveLevel: currentLevel,
      };
    }
  });
  return state;
}

const noShrink = css({ flexShrink: 0 });

export default function (): JSX.Element {
  const serverLevels = useAppSelector(state => state.admin.loggers, shallowEqual);
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [clientsState, setClientLoggers] = React.useState(computeClientState());

  React.useEffect(() => {
    if (serverLevels === undefined) {
      // not yet initialized
      dispatch(getLoggerLevels());
    }
  }, [serverLevels, dispatch]);

  const clientLoggers = (
    <LoggerGrid
      className={noShrink}
      title="Client Loggers"
      levels={clientsState}
      changeLevel={(loggerName, level) => {
        const index = LEVELS.indexOf(level);
        if (isClientLevel(index)) {
          getLogger(loggerName).setLevel(index);
          setClientLoggers(computeClientState());
        }
      }}
    />
  );

  if (serverLevels == null) {
    return (
      <div>
        <div>
          <InlineLoading />
        </div>
        {clientLoggers}
      </div>
    );
  } else {
    return (
      <FitSpace direction="column" overflow="auto" className={panelPadding}>
        {clientLoggers}
        <LoggerGrid
          title={
            <div>
              <span>"Server Loggers"</span>
              <ActionIconButton
                title={i18n.refresh}
                icon={faSync}
                onClick={() => {
                  return dispatch(getLoggerLevels());
                }}
              />
            </div>
          }
          levels={serverLevels}
          changeLevel={(loggerName, level) => {
            dispatch(
              changeLoggerLevel({
                loggerName: loggerName,
                loggerLevel: level,
              }),
            );
          }}
        />
      </FitSpace>
    );
  }
}
