/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import type { RootState } from '../store';
import reducer, {
  DEFAULT_ROLES,
  rolesSet,
  RolesState,
  selectDefaultRoleId,
  selectRoleAvailableTabs,
  selectRoles,
  selectRolesId,
} from './roles';

/**
 * `RootState` is imported as a *type only*, so this spec never loads the store
 * module (and none of the app it drags in). The cast is the price.
 */
const wrap = (roles: RolesState) => ({ roles } as unknown as RootState);

const initial = () => reducer(undefined, { type: 'unrelated/action' });

const TRAINER: Role = {
  id: 'TRAINER',
  label: { EN: 'Trainer' },
  availableTabs: ['Variables', 'Files'],
};

describe('roles slice', () => {
  it('starts with the scenario editor as the only, default role', () => {
    const s = wrap(initial());

    expect(selectRoles(s)).toBe(DEFAULT_ROLES);
    expect(selectDefaultRoleId(s)).toBe('SCENARIO_EDITOR');
    expect(selectRolesId(s)).toBe('DEFAULT_ROLES');
  });

  it('replaces the roles set', () => {
    const roles = { ...DEFAULT_ROLES, TRAINER };
    const s = wrap(
      reducer(
        initial(),
        rolesSet({ roles, defaultRoleId: 'TRAINER', rolesId: 'PMG_ROLES' }),
      ),
    );

    expect(selectRoles(s)).toEqual(roles);
    expect(selectDefaultRoleId(s)).toBe('TRAINER');
    expect(selectRolesId(s)).toBe('PMG_ROLES');
  });

  it('gives a role its tabs, and every tab to an unknown role', () => {
    const s = wrap(
      reducer(
        initial(),
        rolesSet({
          roles: { ...DEFAULT_ROLES, TRAINER },
          defaultRoleId: 'TRAINER',
          rolesId: 'PMG_ROLES',
        }),
      ),
    );

    expect(selectRoleAvailableTabs(s, 'TRAINER')).toEqual([
      'Variables',
      'Files',
    ]);
    expect(selectRoleAvailableTabs(s, 'SCENARIO_EDITOR')).toBe(true);
    expect(selectRoleAvailableTabs(s, 'REMOVED_ROLE')).toBe(true);
  });
});