import * as React from 'react';
import { defaultPaddingLeft } from '../../css/classes';
import { DEFAULT_ROLES } from '../../data/Reducer/globalState';
import { selectCurrentEditorLanguage } from '../../data/selectors/Languages';
import { useStore } from '../../data/Stores/store';
import { commonTranslations } from '../../i18n/common/common';
import {
  internalTranslate,
  useInternalTranslate,
} from '../../i18n/internalTranslator';
import { CheckBox } from '../Inputs/Boolean/CheckBox';

export const EditorRoleData = 'WEGAS_USER_ROLE';

export interface RoleContext {
  currentRole: string;
  setRole: (role: string) => void;
}

export const roleCTX = React.createContext<RoleContext>({
  currentRole:
    window.localStorage.getItem(EditorRoleData) ||
    DEFAULT_ROLES.SCENARIO_EDITOR.id,
  setRole: () => {},
});

function RoleContext({ children }: React.PropsWithChildren<{}>) {
  const defaultRoleId = useStore(s => s.global.roles.defaultRoleId);
  const [currentRole, setRole] = React.useState<string>(
    window.localStorage.getItem(EditorRoleData) || defaultRoleId,
  );

  return (
    <roleCTX.Provider
      value={{
        currentRole,
        setRole: role => {
          window.localStorage.setItem(EditorRoleData, role);
          setRole(role);
        },
      }}
    >
      {children}
    </roleCTX.Provider>
  );
}

export const RoleProvider = React.memo(RoleContext);

export function useRolesToggler() {
  const availableRoles = useStore(s => s.global.roles.roles);
  const { currentRole, setRole } = React.useContext(roleCTX);
  const lang = useStore(selectCurrentEditorLanguage);
  const i18nValues = useInternalTranslate(commonTranslations);
  return {
    label: i18nValues.role,
    items: Object.values(availableRoles).map(role => ({
      value: role.id,
      label: (
        <div
          className={defaultPaddingLeft}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setRole(role.id);
          }}
        >
          <CheckBox
            label={internalTranslate(role.label, lang)}
            value={currentRole === role.id}
            onChange={() => setRole(role.id)}
            radio
            horizontal
          />
        </div>
      ),
      noCloseMenu: true,
    })),
  };
}
