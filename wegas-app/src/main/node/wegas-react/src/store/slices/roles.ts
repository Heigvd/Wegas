/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface Roles {
  [id: string]: Role;
}

/** Always available, whatever roles a scenario defines (see `Roles.setRoles`). */
export const DEFAULT_ROLES: Roles = {
  SCENARIO_EDITOR: {
    id: 'SCENARIO_EDITOR',
    label: {
      EN: 'Scenario editor',
      FR: 'Editeur de scenario',
      IT: 'Editore di scenario',
      DE: 'Redakteur für Szenario',
    },
    availableTabs: true,
  },
};

/**
 * The editor roles a scenario defines through `Roles.setRoles` in a client
 * script. A role restricts the editor tabs shown; the user's current role is
 * not stored here but in RoleProvider (and localStorage).
 */
export interface RolesState {
  /** identifies the roles set; saved layouts are stored per rolesId and role */
  rolesId: string;
  defaultRoleId: string;
  roles: Roles;
}

const initialState: RolesState = {
  rolesId: 'DEFAULT_ROLES',
  defaultRoleId: DEFAULT_ROLES.SCENARIO_EDITOR.id,
  roles: DEFAULT_ROLES,
};

/* ------------------------------------------------------------------ *
 * Slice
 * ------------------------------------------------------------------ */

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    rolesSet(state, action: PayloadAction<RolesState>) {
      state.roles = action.payload.roles;
      state.defaultRoleId = action.payload.defaultRoleId;
      state.rolesId = action.payload.rolesId;
    },
  },
});

export const { rolesSet } = rolesSlice.actions;
export default rolesSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectRoles = (s: RootState): Roles => s.roles.roles;

export const selectDefaultRoleId = (s: RootState): string =>
  s.roles.defaultRoleId;

export const selectRolesId = (s: RootState): string => s.roles.rolesId;

/**
 * The tabs a role may see: `true` for all of them, and also for an unknown
 * role, so a stale role never hides the whole editor.
 */
export const selectRoleAvailableTabs = (
  s: RootState,
  roleId: string,
): Role['availableTabs'] => s.roles.roles[roleId]?.availableTabs ?? true;