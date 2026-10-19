import * as React from 'react';
import { defaultPaddingLeft } from '../../css/classes';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentEditorLanguage } from '../../store/slices/languages';
import {
  DEFAULT_ROLES,
  selectDefaultRoleId,
  selectRoles,
} from '../../store/slices/roles';
import { commonTranslations } from '../../i18n/common/common';
import {
  internalTranslate,
  useInternalTranslate,
} from '../../i18n/internalTranslator';
import { CheckBox } from '../Inputs/Boolean/CheckBox';

const EditorRoleData = 'WEGAS_USER_ROLE';

interface RoleContext {
  currentRole: string;
  setRole: (role: string) => void;
}

export const roleCTX = React.createContext<RoleContext>({
  currentRole:
    window.localStorage.getItem(EditorRoleData) ||
    DEFAULT_ROLES.SCENARIO_EDITOR.id,
  setRole: () => {},
});

function RoleContext({
  children,
}: React.PropsWithChildren<UnknownValuesObject>) {
  const defaultRoleId = useAppSelector(selectDefaultRoleId);
  const availableRoles = useAppSelector(selectRoles);

  const [storedRole, setRole] = React.useState<string>(
    window.localStorage.getItem(EditorRoleData) || defaultRoleId,
  );

  React.useEffect(() => {
    setRole(window.localStorage.getItem(EditorRoleData) || defaultRoleId);
  }, [
    defaultRoleId
  ]);

  const currentRole = Object.values(availableRoles).some(
    role => role.id === storedRole,
  ) ? storedRole : defaultRoleId;

  return (
    <roleCTX.Provider
      value={{
        currentRole: currentRole,
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
  const availableRoles = useAppSelector(selectRoles);
  const { currentRole, setRole } = React.useContext(roleCTX);
  const lang = useAppSelector(selectCurrentEditorLanguage);
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
