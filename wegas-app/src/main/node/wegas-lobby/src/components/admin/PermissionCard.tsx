/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faCheckCircle, faCircle, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import Select from 'react-select';
import { IPermission, IPermissionWithId } from 'wegas-ts-api';
import {
  deletePermission,
  getGameById,
  getGameModelById,
  getGameModels,
  getGames,
  updatePermission,
} from '../../API/api';
import { entityIs } from '../../API/entityHelper';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import {
  usePermissionObject,
  useShareableGameModels,
  useShareableGames,
} from '../../selectors/wegasSelector';
import { useAppDispatch } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Button from '../common/Button';
import Card from '../common/Card';
import CardContainer from '../common/CardContainer';
import Checkbox from '../common/Checkbox';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import OpenCloseModal from '../common/OpenCloseModal';
import {
  cardDetailsStyle,
  cardTitleStyle,
  defaultSelectStyles,
  mainButtonStyle,
} from '../styling/style';

interface GmPermissionEditorProps {
  value: string;
  id: number | '*' | undefined;
  gmType: 'MODEL' | 'SCENARIO' | 'ALL_GM';
  onChange: (value: { value: string; id: number | '*' }) => void;
}

interface PermIdOption {
  value: number | '*';
  label: string;
}

const baseGmPerm = ['Edit', 'Duplicate', 'Instantiate'];
const allGmPerm = 'View,Edit,Delete,Duplicate,Instantiate';

export function GameModelPermissionEditor({
  value,
  id,
  gmType,
  onChange,
}: GmPermissionEditorProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const userId = currentUser != null ? currentUser.id : undefined;

  // quick and ugly hack to hangle wildcard
  const hackType = gmType === 'ALL_GM' ? 'MODEL' : gmType;
  const wildcard = gmType === 'ALL_GM';

  const gameModels = useShareableGameModels(userId, hackType);

  const status = gameModels.status[hackType].LIVE;

  const [gameModelId, setGameModelId] = React.useState<number | '*' | undefined>(id);

  const [permState, setPermState] = React.useState(
    value.split(',').reduce<Record<string, boolean>>((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {}),
  );

  const gameModel = Number.isInteger(gameModelId)
    ? gameModels.gamemodels.find(gm => gm.id === +gameModelId!)
    : undefined;

  const [gmPerm, setGmPerm] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (gameModel != null) {
      setGmPerm([...baseGmPerm, ...gameModel.languages.map(lang => `Translate-${lang.code}`)]);
    } else {
      setGmPerm([...baseGmPerm]);
    }
  }, [gameModel]);

  React.useEffect(() => {
    if (permState['Edit'] && gmPerm.find(perm => !permState[perm])) {
      setPermState(current => {
        const newState = { ...current };
        gmPerm.forEach(perm => (newState[perm] = true));
        return newState;
      });
    }
  }, [gmPerm, permState]);

  React.useEffect(() => {
    if (gameModelId != null) {
      if (permState['Edit']) {
        onChange({
          id: gameModelId,
          value: allGmPerm,
        });
      } else {
        onChange({
          id: gameModelId,
          value: gmPerm.flatMap(perm => (permState[perm] ? [perm] : [])).join(','),
        });
      }
    }
  }, [permState, gmPerm, gameModelId, onChange]);

  React.useEffect(() => {
    if (status == 'NOT_INITIALIZED') {
      dispatch(getGameModels({ status: 'LIVE', type: hackType }));
    }
  }, [status, hackType, dispatch]);

  const selectGameModelCb = React.useCallback((value: PermIdOption | null) => {
    if (value != null) {
      setGameModelId(value.value);
    } else {
      setGameModelId(undefined);
    }
  }, []);

  const options: PermIdOption[] = gameModels.gamemodels
    .map(gm => {
      return {
        value: gm.id,
        label: `${gm.name}  [${i18n.status[gm.status]}]`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  //  options.unshift({
  //    value: '*',
  //    label: i18n.all,
  //  });

  const current = options.find(opt => opt.value === gameModelId) || null;

  const togglePermCb = React.useCallback(
    (perm: string) => {
      setPermState(state => {
        const newState = { ...state, [perm]: !state[perm] };
        if (newState['Edit']) {
          gmPerm.forEach(perm => (newState[perm] = true));
        }
        return newState;
      });
    },
    [gmPerm],
  );

  function createCheckBox(name: string) {
    return (
      <Checkbox
        key={name}
        label={name}
        disabled={name != 'Edit' && permState['Edit']}
        value={permState[name]}
        onChange={() => {
          togglePermCb(name);
        }}
      />
    );
  }

  return (
    <>
      {wildcard ? null : (
        <>
          <Select
            options={options}
            isClearable={false}
            value={current}
            onChange={selectGameModelCb}
            styles={defaultSelectStyles}
          />
        </>
      )}
      {gmPerm.map(perm => createCheckBox(perm))}
    </>
  );
}

interface GamePermissionEditorProps {
  value: string;
  id: number | '*' | undefined;
  onChange: (value: { value: string; id: number | '*' }) => void;
}

export function GamePermissionEditor({ id, onChange }: GamePermissionEditorProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();
  const { currentUser } = useCurrentUser();

  const userId = currentUser != null ? currentUser.id : undefined;

  const games = useShareableGames(userId);

  const liveStatus = games.status.LIVE;

  React.useEffect(() => {
    if (liveStatus == 'NOT_INITIALIZED') {
      dispatch(getGames('LIVE'));
    }
  }, [liveStatus, dispatch]);

  const selectGameCb = React.useCallback(
    (value: PermIdOption | null) => {
      if (value != null) {
        onChange({ value: 'View,Edit', id: value.value });
      }
    },
    [onChange],
  );

  const options: PermIdOption[] = games.games
    .map(g => {
      return {
        value: g.id,
        label: `${g.name}  [${i18n.status[g.status]}]`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  options.unshift({
    value: '*',
    label: i18n.all,
  });

  const current = options.find(opt => opt.value === id);

  return (
    <>
      <Select options={options} isClearable={false} value={current} onChange={selectGameCb} />
    </>
  );
}

interface PermissionEditorProps {
  permission: IPermission;
  pType: 'GAME' | 'SCENARIO' | 'MODEL' | 'ALL_GM';
  value: string;
  id: number | '*' | undefined;
  close: () => void;
  onSave: (permission: IPermission) => void;
}

export function PermissionEditor({
  permission,
  pType,
  value,
  id,
  close,
  onSave,
}: PermissionEditorProps): JSX.Element {
  const i18n = useTranslations();

  const [typeState, setType] = React.useState(pType);

  const [valueState, setValue] = React.useState(value);
  const [gmIdState, setGmId] = React.useState(pType !== 'GAME' ? id : undefined);
  const [gIdState, setGId] = React.useState(pType === 'GAME' ? id : undefined);

  return (
    <FitSpace direction="column">
      <CardContainer>
        <Flex>
          <IconButton
            icon={typeState === 'GAME' ? faCheckCircle : faCircle}
            onClick={() => setType('GAME')}
          >
            {i18n.Game}
          </IconButton>
          <IconButton
            icon={typeState === 'SCENARIO' ? faCheckCircle : faCircle}
            onClick={() => setType('SCENARIO')}
          >
            {i18n.GameModel}
          </IconButton>
          <IconButton
            icon={typeState === 'MODEL' ? faCheckCircle : faCircle}
            onClick={() => setType('MODEL')}
          >
            {i18n.Model}
          </IconButton>
          <IconButton
            icon={typeState === 'ALL_GM' ? faCheckCircle : faCircle}
            onClick={() => setType('ALL_GM')}
          >
            {i18n.AllScenariosAndModels}
          </IconButton>
        </Flex>
        <FitSpace direction="column">
          {typeState === 'SCENARIO' || typeState === 'MODEL' || typeState === 'ALL_GM' ? (
            <GameModelPermissionEditor
              value={valueState}
              id={gmIdState}
              gmType={typeState}
              onChange={v => {
                setValue(v.value);
                setGmId(v.id);
              }}
            />
          ) : (
            <GamePermissionEditor
              value={valueState}
              id={gIdState}
              onChange={v => {
                setValue(v.value);
                setGId(v.id);
              }}
            />
          )}
        </FitSpace>
        <Flex justify="flex-end">
          {/*<i>{`${typeState}:${valueState}:${gmIdState}|${gIdState}`}</i>*/}
          <Button label={i18n.cancel} onClick={close} />
          <Button
            className={mainButtonStyle}
            label={i18n.save}
            onClick={() => {
              if (typeState === 'ALL_GM') {
                onSave({ ...permission, value: `GameModel:${valueState}:*` });
              } else if (typeState === 'SCENARIO' || typeState === 'MODEL') {
                onSave({ ...permission, value: `GameModel:${valueState}:gm${gmIdState}` });
              } else {
                onSave({ ...permission, value: `Game:${valueState}:g${gIdState}` });
              }
            }}
          />
        </Flex>
      </CardContainer>
    </FitSpace>
  );
}

interface PermissionCardProps {
  permission: IPermissionWithId;
}

export function PermissionCard({ permission }: PermissionCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const split = permission.value.split(':');

  const pType = split[0];
  const value = split[1];
  const id = split[2];

  const data = usePermissionObject(id);

  const game = data.type === 'Game' ? data.game : undefined;
  const gameModel = data.type === 'GameModel' ? data.gameModel : undefined;
  const oId = data.type === 'GameModel' || data.type === 'Game' ? data.id : undefined;

  React.useEffect(() => {
    if (data.type === 'GameModel' && gameModel == null && oId != null) {
      dispatch(getGameModelById({ id: oId, view: 'Lobby' }));
    }

    if (data.type === 'Game' && game == null && oId != null) {
      dispatch(getGameById({ id: oId, view: 'Lobby' }));
    }
  }, [dispatch, game, gameModel, data.type, oId]);

  const destroyCb = React.useCallback(async () => {
    return dispatch(deletePermission(permission.id));
  }, [permission.id, dispatch]);

  const name = entityIs(gameModel, 'GameModel') ? (
    `${
      gameModel.type === 'MODEL'
        ? i18n.Model
        : gameModel.type === 'SCENARIO'
        ? i18n.GameModel
        : gameModel.type
    } "${gameModel.name}"`
  ) : entityIs(game, 'Game') ? (
    `${i18n.Game} "${game.name}"`
  ) : data.type === 'WILDCARD' ? (
    pType === 'Game' ? (
      i18n.allGames
    ) : pType === 'GameModel' ? (
      i18n.allGameModels
    ) : (
      `${i18n.all} ${pType}`
    )
  ) : (
    <i>
      {i18n.unknown}: {permission.value}
    </i>
  );

  const eType =
    data.type === 'WILDCARD' && pType === 'GameModel'
      ? 'ALL_GM'
      : data.type === 'WILDCARD' && pType === 'Game'
      ? 'GAME'
      : entityIs(gameModel, 'GameModel')
      ? gameModel.type === 'MODEL' || gameModel.type === 'SCENARIO'
        ? gameModel.type
        : null
      : entityIs(game, 'Game')
      ? 'GAME'
      : undefined;

  return (
    <Card size="SMALL" key={permission.id} illustration="ICON_grey_key_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{name}</div>
        <div className={cardDetailsStyle}>{value}</div>
      </FitSpace>

      {eType != null ? (
        <OpenCloseModal
          icon={faPen}
          iconTitle={i18n.editPermission}
          title={i18n.editPermission}
          illustration="ICON_dark-blue_key_fa"
          showCloseButton={true}
          route={`${permission.id}/edit`}
        >
          {close => (
            <PermissionEditor
              permission={permission}
              pType={eType}
              value={value}
              id={data.type === 'WILDCARD' ? '*' : oId}
              onSave={p => {
                if (p.id != null) {
                  dispatch(updatePermission(p as IPermissionWithId)).then(a => {
                    if (a.meta.requestStatus === 'fulfilled') {
                      close();
                    }
                  });
                }
              }}
              close={close}
            />
          )}
        </OpenCloseModal>
      ) : null}

      <ActionIconButton
        title={i18n.deletePermission}
        shouldConfirm="SOFT_LEFT"
        icon={faTrash}
        onClick={destroyCb}
      />
    </Card>
  );
}
