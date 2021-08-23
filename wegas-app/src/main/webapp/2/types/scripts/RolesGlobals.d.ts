interface TranslatableObject<T> {
  [lang: string]: T;
}

interface Role {
  id: string;
  label: TranslatableObject<string>;
  availableTabs: string[] | true;
}

interface RolesMehtods {
  addRole: (newRole: Role, defaultRole?: boolean) => void;
}
