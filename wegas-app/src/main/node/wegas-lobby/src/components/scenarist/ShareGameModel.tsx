/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import { faSync, faUserTimes } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import AsyncSelect from 'react-select/async';
import { IGameModelWithId, IPermission } from 'wegas-ts-api';
import { getRestClient, shareGameModel, unshareGameModel } from '../../API/api';
import { IAccountWithPerm } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card from '../common/Card';
import CardContainer from '../common/CardContainer';
import Checkbox from '../common/Checkbox';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import { userIllu, verifiedIllu } from '../common/illustrations/illustrationHelper';
import InlineLoading from '../common/InlineLoading';
import {
  cardDetailsStyle,
  cardFooterPadding,
  cardTitleStyle,
  defaultSelectStyles,
} from '../styling/style';

interface GameModelProps {
  gameModel: IGameModelWithId;
}

interface UserProps {
  gameModel: IGameModelWithId;
  account: IAccountWithPerm;
  reload: () => void;
  showDeleteButton: boolean;
}

function processPermission(gameModel: IGameModelWithId, permission?: IPermission) {
  const map: Record<string, boolean> = {
    Edit: false,
    Duplicate: false,
    Instantiate: false,
  };
  gameModel.languages.forEach(lang => (map['Translate-' + lang.code] = false));

  if (permission != null) {
    const [, perm] = permission.value.split(':');
    if (perm != null) {
      perm.split(',').forEach(p => (map[p] = true));
    }
  }

  if (map['Edit']) {
    Object.keys(map).forEach(key => (map[key] = true));
  }

  return map;
}

function UserCard({ account, gameModel, reload, showDeleteButton }: UserProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const permission =
    account.permissions != null
      ? account.permissions.find(perm => perm.value.endsWith(`gm${gameModel.id}`))
      : undefined;

  const [state, setState] = React.useState(processPermission(gameModel, permission));
  const toggle = React.useCallback(
    (perm: string) => {
      setState(state => {
        const newState = { ...state, [perm]: !state[perm] };
        const toSet: string[] = [];
        if (newState['Edit']) {
          Object.keys(newState).forEach(key => (newState[key] = true));
          toSet.push('Edit', 'Duplicate', 'Instantiate');
        } else {
          Object.entries(newState).forEach(entry => {
            if (entry[1]) {
              toSet.push(entry[0]);
            }
          });
        }

        dispatch(
          shareGameModel({
            gameModelId: gameModel.id,
            accountId: account.id,
            permissions: toSet,
          }),
        );

        return newState;
      });
    },
    [account.id, dispatch, gameModel.id],
  );

  function createCheckBox(name: string) {
    return (
      <Checkbox
        key={name}
        label={name}
        disabled={name != 'Edit' && state['Edit']}
        value={state[name]}
        onChange={() => {
          toggle(name);
        }}
      />
    );
  }

  return (
    <Card illustration={account.verified ? verifiedIllu : userIllu}>
      <FitSpace direction="column">
        <div className={cardTitleStyle}>
          {account.firstname} {account.lastname}
        </div>
        <div className={cardDetailsStyle}>••••@{account.emailDomain}</div>
      </FitSpace>

      <FitSpace direction="column" className={css({ flexWrap: 'wrap' })}>
        {createCheckBox('Edit')}
        {createCheckBox('Duplicate')}
        {createCheckBox('Instantiate')}
        {gameModel.languages.map(lang => createCheckBox(`Translate-${lang.code}`))}
      </FitSpace>

      {showDeleteButton ? (
        <ActionIconButton
          shouldConfirm="SOFT_LEFT"
          icon={faUserTimes}
          title={i18n.kickScenarist}
          onClick={async () =>
            dispatch(unshareGameModel({ gameModelId: gameModel.id, accountId: account.id })).then(
              () => reload(),
            )
          }
        />
      ) : null}
    </Card>
  );
}

export default function ShareGameModel({ gameModel }: GameModelProps) {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [scenarists, setScenarists] = React.useState<'UNSET' | 'LOADING' | IAccountWithPerm[]>(
    'UNSET',
  );

  const reload = React.useCallback(() => {
    setScenarists('UNSET');
  }, []);

  React.useEffect(() => {
    //let abort = false;
    const load = async () => {
      const t = await getRestClient().GameModelController.findScenarists(gameModel.id);
      //if (!abort) {
      setScenarists(
        t.flatMap(u => {
          if (u.accounts != null) {
            return [u.accounts[0]];
          } else {
            return [];
          }
        }),
      );
    };
    if (scenarists === 'UNSET') {
      setScenarists('LOADING');
      load();
    }
    //return () => {abort = true}
  }, [scenarists, gameModel]);

  const promiseOptions = async (inputValue: string) => {
    if (inputValue.length < 3) {
      return [];
    } else {
      const result = await getRestClient().UserController.autoComplete(inputValue, [
        'Trainer',
        'Scenarist',
        'Administrator',
      ]);
      return result.map(account => {
        return {
          value: account.id,
          label: `${account.firstname} ${account.lastname} (@${account.emailDomain})`,
        };
      });
    }
  };

  const inviteCb = React.useCallback(
    (option: { value: number } | null) => {
      if (option != null) {
        dispatch(
          shareGameModel({
            gameModelId: gameModel.id,
            accountId: option.value,
            permissions: ['Instantiate'],
          }),
        ).then(() => setScenarists('UNSET'));
      }
    },
    [dispatch, gameModel.id],
  );

  if (typeof scenarists === 'string') {
    return <InlineLoading />;
  } else {
    return (
      <FitSpace direction="column" overflow="auto">
        <CardContainer>
          <h4>{i18n.coScenarist}</h4>
          {scenarists.map(a => (
            <UserCard
              key={a.id}
              account={a}
              gameModel={gameModel}
              reload={reload}
              showDeleteButton={scenarists.length > 1}
            />
          ))}
        </CardContainer>
        <Flex className={cardFooterPadding} direction="row" justify="space-between" align="center">
          <AsyncSelect
            className={css({ flexGrow: 1 })}
            onChange={inviteCb}
            placeholder={i18n.addScenarist}
            menuPlacement="top"
            style={defaultSelectStyles}
            cacheOptions
            defaultOptions
            loadOptions={promiseOptions}
          />
          <IconButton
            icon={faSync}
            onClick={() => {
              setScenarists('UNSET');
            }}
          />
        </Flex>
      </FitSpace>
    );
  }
}
