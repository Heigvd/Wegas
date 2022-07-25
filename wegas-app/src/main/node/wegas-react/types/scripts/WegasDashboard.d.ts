interface WegasDashboardConfig {
  dashboard?: string;
  section?: string;
  label?: string;
}

type ValueKind = 'number' | 'string' | 'text' | 'boolean' | 'object' | 'inbox';

interface WegasDashboardVariableConfig<
  T extends SVariableInstance = SVariableInstance,
> extends WegasDashboardConfig {
  id?: string;
  kind?: ValueKind;
  formatter?: (variable: T) => string | { component: string; props: {} };
  index?: number;
  active?: boolean;
  sortable?: boolean;
  preventClick?: boolean;
  sortFn?: (variableA: T, variableB: T) => number;
  mapFn?: (
    teamId: number,
    instance: T,
    ...extraArgs: SVariableInstance[]
  ) => unknown;
  mapFnExtraArgs?: string[];
}

type WegasDashboardRegisterVariable = (
  id: string,
  config?: WegasDashboardVariableConfig,
) => void;

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
  questName: string,
  cfg: {
    label: string;
    react: true;
  },
) => void;

declare const WegasDashboard: {
  registerAction: WegasDashboardRegisterAction;
  registerQuest: WegasDashboardRegisterQuest;
  registerVariable: WegasDashboardRegisterVariable;
};
