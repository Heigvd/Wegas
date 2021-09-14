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
  faPlusCircle,
  faTrash,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import AsyncSelect from 'react-select/async';
import { IPermission, IRoleWithId } from 'wegas-ts-api';
import {
  createPermissionForRole,
  createRole,
  deleteRole,
  getAllRoles,
  getRestClient,
  getRoleMembers,
  giveRoleToUser,
  removeRoleFromUser,
} from '../../API/api';
import useTranslations from '../../i18n/I18nContext';
import { useRoleMembers, useRolePermissions } from '../../selectors/userSelector';
import { customStateEquals, useAppDispatch, useAppSelector } from '../../store/hooks';
import ActionIconButton from '../common/ActionIconButton';
import Button from '../common/Button';
import Card, { cardSecButtonStyle } from '../common/Card';
import CardContainer from '../common/CardContainer';
import DropDownPanel from '../common/DropDownPanel';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import Input from '../common/Input';
import OpenCloseModal from '../common/OpenCloseModal';
import { successColor } from '../styling/color';
import { cardDetailsStyle, cardTitleStyle, mainButtonStyle, panelPadding } from '../styling/style';
import { PermissionCard, PermissionEditor } from './PermissionCard';
import UserCard from './UserCard';

interface CreateRoleProps {
  close: () => void;
}

export function CreateRole({ close }: CreateRoleProps): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

  const [name, setName] = React.useState('');

  const onCreateCb = React.useCallback(() => {
    if (name != null) {
      dispatch(createRole(name)).then(() => close());
    }
  }, [dispatch, name, close]);

  return (
    <FitSpace direction="column">
      <h3>{i18n.createRole}</h3>
      <Input
        placeholder={i18n.roleName}
        className={css({ minWidth: '400px', paddingBottom: '20px' })}
        value={name}
        onChange={setName}
      />

      <Flex justify="flex-end">
        <Button label={i18n.cancel} onClick={close} />
        <Button className={mainButtonStyle} label={i18n.create} onClick={onCreateCb} />
      </Flex>
    </FitSpace>
  );
}

const emptyPermission: IPermission = {
  '@class': 'Permission',
  value: '',
};

export function RolePermissions({ role }: { role: IRoleWithId }): JSX.Element {
  const i18n = useTranslations();

  const dispatch = useAppDispatch();
  const perms = useRolePermissions(role.id);

  return (
    <FitSpace direction="column" overflow="auto">
      <CardContainer>
        {perms.map(p => (
          <PermissionCard key={p.id} permission={p} />
        ))}
      </CardContainer>

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
                dispatch(createPermissionForRole({ id: role.id, permission: p })).then(a => {
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

export function RoleMembers({ role }: { role: IRoleWithId }): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();
  const members = useRoleMembers(role.id);

  React.useEffect(() => {
    if (members.status === 'NOT_INITIALIZED') {
      dispatch(getRoleMembers(role.id));
    }
  }, [members.status, dispatch, role.id]);

  const addUserToGroup = React.useCallback(
    (option: { value: number } | null) => {
      if (option != null) {
        dispatch(
          giveRoleToUser({
            userId: option.value,
            roleId: role.id,
          }),
        );
      }
    },
    [dispatch, role.id],
  );

  const removeUserFromGroupCb = React.useCallback(
    async (userId: number) => {
      return dispatch(
        removeRoleFromUser({
          userId: userId,
          roleId: role.id,
        }),
      );
    },
    [dispatch, role.id],
  );

  const promiseOptions = async (inputValue: string) => {
    if (inputValue.length < 3) {
      return [];
    } else {
      const result = await getRestClient().UserController.autoCompleteFull(inputValue);
      return result.map(account => {
        return {
          value: account.parentId!,
          label: `${account.firstname} ${account.lastname} (@${account.emailDomain})`,
        };
      });
    }
  };

  return (
    <FitSpace direction="column" overflow="auto">
      <CardContainer>
        {members.users.map(user => (
          <UserCard key={user.id} user={user}>
            <ActionIconButton
              shouldConfirm
              className={cardSecButtonStyle}
              icon={faMinusCircle}
              title={i18n.removeRole}
              onClick={() => removeUserFromGroupCb(user.id)}
            />
          </UserCard>
        ))}
      </CardContainer>
      <Flex direction="row" justify="space-between" align="center">
        <AsyncSelect
          className={css({ flexGrow: 1 })}
          onChange={addUserToGroup}
          placeholder={i18n.addMemberInvite}
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
          cacheOptions
          defaultOptions
          loadOptions={promiseOptions}
        />
      </Flex>
    </FitSpace>
  );
}

export function RoleCard({ role }: { role: IRoleWithId }): JSX.Element {
  const i18n = useTranslations();

  const dispatch = useAppDispatch();

  const deleteRoleCb = React.useCallback(async () => {
    dispatch(deleteRole(role.id));
  }, [dispatch, role.id]);

  const isProtected =
    role.name === 'Administrator' || role.name === 'Scenarist' || role.name === 'Trainer';

  return (
    <Card illustration="ICON_dark-blue_users_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{role.name}</div>
        <div className={cardDetailsStyle}>
          {i18n.numberOfMembers} {role.numberOfMember}
        </div>
      </FitSpace>

      <OpenCloseModal
        icon={faUsers}
        iconTitle={i18n.showMembers}
        title={role.name}
        illustration={'ICON_dark-blue_users_fa'}
        showCloseButton={true}
        route={`/${role.id}/members`}
      >
        {() => <RoleMembers role={role} />}
      </OpenCloseModal>

      <OpenCloseModal
        icon={faKey}
        iconTitle={i18n.showPermissions}
        title={role.name}
        illustration={'ICON_dark-blue_users_fa'}
        showCloseButton={true}
        route={`/${role.id}/permissions`}
      >
        {() => <RolePermissions role={role} />}
      </OpenCloseModal>

      {!isProtected ? (
        <ActionIconButton
          shouldConfirm
          className={cardSecButtonStyle}
          icon={faTrash}
          title={i18n.deleteRole}
          onClick={deleteRoleCb}
        />
      ) : null}
    </Card>
  );
}

export default function Roles(): JSX.Element {
  const dispatch = useAppDispatch();
  const i18n = useTranslations();

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

  const [viewMode, setViewMode] = React.useState<'EXPANDED' | 'COLLAPSED'>('COLLAPSED');

  if (typeof roles === 'string') {
    return (
      <div>
        <h3>{i18n.roles}</h3>
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
          <CreateRole
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
              onClick={() => {
                setViewMode('EXPANDED');
              }}
            >
              {i18n.createRole}
            </IconButton>
          </Flex>
          <CardContainer>
            {roles.roles.map(role => (
              <RoleCard key={role.id} role={role} />
            ))}
          </CardContainer>
        </FitSpace>
      </FitSpace>
    );
  }
}
