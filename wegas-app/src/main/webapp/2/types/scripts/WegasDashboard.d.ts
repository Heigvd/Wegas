type STeam = import('wegas-ts-api').STeam;

interface WegasDashboardConfig {
  dashboard?: string;
  section?: string;
  label?: string;
}

interface WegasDashboardVariableConfig<T = null> extends WegasDashboardConfig {
  id?: string;
  formatter?: (variable: T) => string;
  transformer?: (variable: T) => string;
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
  schema: (
    team: STeam,
  ) => {
    description: string;
    properties: {
      [id: string]: ReturnType<
        SchemaPropsDefinedType[keyof SchemaPropsDefinedType]
      >;
    };
  };
}

type WegasDashboardRegisterAction = (
  id: string,
  doFn: (team: STeam, payload?: any) => void,
  config?: WegasDashboardActionConfig,
) => void;
