import * as React from 'react';
import { defaultPaddingLeft } from '../../css/classes';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { languagesTranslations } from '../../i18n/languages/languages';
import { DropMenu } from '../DropMenu';
import { CheckBox } from '../Inputs/Boolean/CheckBox';

export const EditorRoleData = 'WEGAS_USER_ROLE';
const availableRoles = ['CONTENT_EDITOR', 'SCENARIO_EDITOR'] as const;

export type UserRole = typeof availableRoles[number];

export interface RoleContext {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

export const roleCTX = React.createContext<RoleContext>({
  currentRole: window.localStorage.getItem(EditorRoleData) as UserRole,
  setRole: () => {},
});

function RoleContext({ children }: React.PropsWithChildren<{}>) {
  const [currentRole, setRole] = React.useState<UserRole>(
    window.localStorage.getItem(EditorRoleData) as UserRole,
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

export function RoleSelector({
  buttonClassName,
  className,
  style,
}: ClassStyleId & { buttonClassName?: string }) {
  const { role } = useInternalTranslate(commonTranslations);
  const i18nLanguagesValues = useInternalTranslate(languagesTranslations);
  const { currentRole, setRole } = React.useContext(roleCTX);

  return React.useMemo(
    () => (
      <DropMenu
        label={role}
        items={availableRoles.map(role => ({
          value: role,
          label: (
            <div
              className={defaultPaddingLeft}
              onClick={e => {
                e.preventDefault();
                setRole(role);
              }}
            >
              <CheckBox
                label={i18nLanguagesValues[role]}
                value={currentRole === role}
                onChange={() => setRole(role)}
                radio
                horizontal
              />
            </div>
          ),
          noCloseMenu: true,
        }))}
        containerClassName={className}
        buttonClassName={buttonClassName}
        style={style}
        direction="right"
      />
    ),
    [
      role,
      className,
      buttonClassName,
      style,
      currentRole,
      i18nLanguagesValues,
      setRole,
    ],
  );
}
