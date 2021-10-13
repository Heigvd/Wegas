import * as React from 'react';
import { defaultPaddingLeft } from '../../css/classes';
import { DEFAULT_ROLES } from '../../data/Reducer/globalState';
import { selectCurrentEditorLanguage } from '../../data/selectors/Languages';
import { useStore } from '../../data/Stores/store';
import { internalTranslate } from '../../i18n/internalTranslator';
import { DropMenu } from '../DropMenu';
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
  // const [availableRoles, setAvailableRoles] = React.useState(DEFAULT_ROLES);

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

export function RoleSelector({
  buttonClassName,
  className,
  style,
}: ClassStyleId & { buttonClassName?: string }) {
  const availableRoles = useStore(s => s.global.roles.roles);
  const lang = useStore(selectCurrentEditorLanguage);
  const { currentRole, setRole } = React.useContext(roleCTX);

  return React.useMemo(
    () => (
      <DropMenu
        label={internalTranslate(availableRoles[currentRole].label, lang)}
        items={Object.values(availableRoles).map(role => ({
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
        }))}
        containerClassName={className}
        buttonClassName={buttonClassName}
        style={style}
        direction="right"
      />
    ),
    [
      availableRoles,
      currentRole,
      lang,
      className,
      buttonClassName,
      style,
      setRole,
    ],
  );
}
