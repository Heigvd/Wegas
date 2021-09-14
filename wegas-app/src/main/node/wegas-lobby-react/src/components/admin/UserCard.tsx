/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css } from '@emotion/css';
import {
  faKey,
  faMinusCircle,
  faPen,
  faPlay,
  faPlusCircle,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { uniq } from 'lodash';
import * as React from 'react';
import Select from 'react-select';
import { IPermission, IUserWithId } from 'wegas-ts-api';
import {
  createPermissionForUser,
  getAllRoles,
  getFullUser,
  getGameByIds,
  getGameModelByIds,
  giveRoleToUser,
  removeRoleFromUser,
  runAs,
} from '../../API/api';
import { getDisplayName } from '../../helper';
import useTranslations from '../../i18n/I18nContext';
import { useAccount, useUserPermissions, useUserRoles } from '../../selectors/userSelector';
import { customStateEquals, shallowEqual, useAppDispatch, useAppSelector } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Card, { cardSecButtonStyle } from '../common/Card';
import CardContainer, { WindowedContainer } from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import { SizeType } from '../common/illustrations/Illustration';
import OpenCloseModal from '../common/OpenCloseModal';
import { UserSettings } from '../settings/UserSettings';
import { cardDetailsStyle, cardTitleStyle } from '../styling/style';
import { PermissionCard, PermissionEditor } from './PermissionCard';
import { RoleCard } from './RoleCard';

const emptyPermission: IPermission = {
  '@class': 'Permission',
  value: '',
};

export function UserPermissions({ userId }: { userId: number }): JSX.Element {
  const i18n = useTranslations();

  const dispatch = useAppDispatch();
  const perms = useUserPermissions(userId);

  const fullStatus = useAppSelector(state => {
    const details = state.users.users[userId];
    if (details != null) {
      if (details === 'LOADING') {
        return details;
      } else {
        return details.fullStatus;
      }
    } else {
      return 'NOT_INITIALIZED';
    }
  });

  React.useEffect(() => {
    if (fullStatus === 'NOT_INITIALIZED') {
      // Hack: force full user reload
      dispatch(getFullUser(userId));
    }
  }, [fullStatus, dispatch, userId]);

  const unknownGamesAndModels = useAppSelector(state => {
    const gameModels: number[] = [];
    const games: number[] = [];

    perms.forEach(p => {
      const [, , pID] = p.value.split(':');
      if (pID != null) {
        if (pID.startsWith('gm')) {
          const id = +pID.substring(2);
          if (state.gameModels.gameModels[id] == null) {
            gameModels.push(id);
          }
        } else if (pID.startsWith('g')) {
          const id = +pID.substring(1);

          if (state.games.games[id] == null) {
            games.push(id);
          }
        }
      }
    });
    return {
      gameModelIds: uniq(gameModels),
      gameIds: uniq(games),
    };
  });

  React.useEffect(() => {
    if (unknownGamesAndModels.gameModelIds.length > 0) {
      dispatch(getGameModelByIds(unknownGamesAndModels.gameModelIds));
    }

    if (unknownGamesAndModels.gameIds.length > 0) {
      dispatch(getGameByIds(unknownGamesAndModels.gameIds));
    }
  });

  return (
    <FitSpace direction="column" overflow="auto">
      <WindowedContainer items={perms}>
        {p => <PermissionCard key={p.id} permission={p} />}
      </WindowedContainer>

      <Flex direction="row" justify="flex-start" align="center">
        <OpenCloseModal
          showCloseButton={true}
          title={i18n.createPermission}
          icon={faPlusCircle}
          iconTitle={i18n.createPermission}
        >
          {close => (
            <PermissionEditor
              permission={emptyPermission}
              pType={'GameModel'}
              value={'Edit'}
              id={undefined}
              onSave={p => {
                dispatch(createPermissionForUser({ id: userId, permission: p })).then(a => {
                  if (a.meta.requestStatus === 'fulfilled') {
                    close();
                  }
                });
              }}
              close={close}
            />
          )}
        </OpenCloseModal>
      </Flex>
    </FitSpace>
  );
}

export function UserRoles({ userId }: { userId: number }): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  const roles = useAppSelector(state => {
    return {
      roles: Object.values(state.users.roles),
      status: state.admin.rolesStatus,
    };
  }, customStateEquals);

  React.useEffect(() => {
    if (roles.status === 'NOT_INITIALIZED') {
      dispatch(getAllRoles());
    }
  }, [roles.status, dispatch]);

  const userRoles = useUserRoles(userId);

  React.useEffect(() => {
    if (userRoles.status === 'NOT_INITIALIZED') {
      dispatch(getFullUser(userId));
    }
  }, [userRoles.status, userId, dispatch]);

  const addUserToGroup = React.useCallback(
    (option: { value: number } | null) => {
      if (option != null) {
        dispatch(
          giveRoleToUser({
            userId: userId,
            roleId: option.value,
          }),
        );
      }
    },
    [dispatch, userId],
  );

  const removeUserFromGroupCb = React.useCallback(
    async (roleId: number) => {
      return dispatch(
        removeRoleFromUser({
          userId: userId,
          roleId: roleId,
        }),
      );
    },
    [dispatch, userId],
  );

  const options = roles.roles.map(role => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <FitSpace direction="column">
      <CardContainer>
        {userRoles.roles.map(role => (
          <RoleCard key={role.id} role={role}>
            <ActionIconButton
              shouldConfirm
              className={cardSecButtonStyle}
              icon={faMinusCircle}
              title={i18n.deleteRole}
              onClick={() => removeUserFromGroupCb(role.id)}
            />
          </RoleCard>
        ))}
      </CardContainer>
      <Flex direction="row" justify="space-between" align="center">
        <Select
          className={css({ flexGrow: 1 })}
          onChange={addUserToGroup}
          placeholder={i18n.name}
          options={options}
          styles={{
            container: provided => {
              return {
                ...provided,
              };
            },
            control: provided => {
              return {
                ...provided,
                marginTop: '2px',
                height: '50px',
              };
            },
            menu: provided => {
              return {
                ...provided,
                top: 'unset',
                bottom: '44px',
                marginTop: '0px',
              };
            },
          }}
        />
      </Flex>
    </FitSpace>
  );
}

export interface UserCardProps {
  user: IUserWithId;
  children?: React.ReactNode;
  extraDetails?: React.ReactNode;
  size?: SizeType;
}

export default function UserCard({
  user,
  children,
  extraDetails,
  size = 'BIG',
}: UserCardProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const detail = useAppSelector(state => {
    return state.users.users[user.id];
  }, shallowEqual);

  const accountId = detail != null && detail !== 'LOADING' ? detail.mainAccount : undefined;

  const account = useAccount(accountId);

  const sudoCb = React.useCallback(() => {
    if (accountId != null) {
      dispatch(runAs(accountId));
    }
  }, [dispatch, accountId]);

  return (
    <Card key={user.id} size={size} illustration="ICON_grey_user_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{user.name || ''}</div>
        <div className={cardDetailsStyle}>
          {i18n.lastSeenAt} {new Date(user.lastSeenAt || 0).toLocaleString()}
        </div>
        {extraDetails}
      </FitSpace>
      <OpenCloseModal
        icon={faPen}
        iconTitle={i18n.editUser}
        title={user.name || ''}
        illustration={'ICON_dark-blue_user_fa'}
        showCloseButton={true}
        route={`/${user.id}/settings`}
      >
        {close => <UserSettings userId={user.id} close={close} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.showRoles}
        title={i18n.userIsMemberOf(
          account != null && account != 'LOADING' ? getDisplayName(account) : user.name || '',
        )}
        illustration={'ICON_dark-blue_user_fa'}
        showCloseButton={true}
        route={`/${user.id}/roles`}
      >
        {() => <UserRoles userId={user.id} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faKey}
        iconTitle={i18n.showPermissions}
        title={user.name || ''}
        illustration={'ICON_dark-blue_users_fa'}
        showCloseButton={true}
        route={`/${user.id}/permissions`}
      >
        {() => <UserPermissions userId={user.id} />}
      </OpenCloseModal>

      <IconButton icon={faPlay} onClick={sudoCb} />

      {children}
    </Card>
  );
}
