interface TranslatableObject<T> {
  [lang: string]: T;
}

interface Role {
  id: string;
  label: TranslatableObject<string>;
  availableTabs: string[] | true;
}

interface RolesMehtods {
  setRoles: <T extends { [id: string]: Role }>(
    roles: T,
    defaultRoleId: keyof T,
    rolesId: string,
  ) => void;
}
