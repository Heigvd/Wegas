type ITeam = import('wegas-ts-api').ITeam;

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
  schema?: (
    team: ITeam,
  ) => {
    [id: string]: ReturnType<
      SchemaPropsDefinedType[keyof SchemaPropsDefinedType]
    >;
  };
}

type WegasDashboardRegisterAction = (
  id: string,
  doFn: (team: ITeam, payload?: unknown) => void,
  config?: WegasDashboardActionConfig,
) => void;
