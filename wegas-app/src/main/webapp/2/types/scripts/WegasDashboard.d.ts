type STeam = import('wegas-ts-api').STeam;

interface WegasDashboardConfig {
  dashboard?: string;
  section?: string;
  label?: string;
}

type ValueKind = 'number' | 'string' | 'text' | 'boolean' | 'object' | 'inbox';

interface WegasDashboardVariableConfig<T = null> extends WegasDashboardConfig {
  id?: string;
  kind?: ValueKind;
  formatter?: (variable: T) => string;
  transformer?: (variable: T) => string | { component: string; props: {} };
  index?: number;
  active?: boolean;
  sortable?: boolean;
  preventClick?: boolean;
  sortFn?: (variableA: T, variableB: T) => number;
  mapFn?: (variable: T) => unknown;
  mapFnExtraArgs?: unknown[];
}

interface WegasDashboardActionConfig extends WegasDashboardConfig {
  icon?: string;
  hasGlobal?: boolean;
  order?: number;
}

type ActionFunction = (team: STeam, payload?: any) => void;
type ActionSchema = () => {
  description: string;
  properties: {
    [id: string]: ReturnType<
      SchemaPropsDefinedType[keyof SchemaPropsDefinedType]
    >;
  };
};

interface ModalAction {
  type: 'ModalAction';
  actions: { doFn: ActionFunction; schemaFn: ActionSchema }[];
  showAdvancedImpact?: boolean;
}

type WegasDashboardRegisterAction = (
  id: string,
  actions: ModalAction,
  config?: WegasDashboardActionConfig,
) => void;

type WegasDashboardRegisterQuest = (
  questName: string, cfg: {
    label: string,
    react: true
  }
) => void;
