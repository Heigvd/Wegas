export type SimpleSchema =
  | {}
  | {
      properties?: {
        [props: string]: SimpleSchema;
      };
      additionalProperties?: SimpleSchema;
    }
  | { items?: SimpleSchema[] | SimpleSchema };

export type CustomSchemaFN = (
  entity: IMergeable,
  baseSchema: SimpleSchema,
) => SimpleSchema | undefined;

export interface GlobalShemaClass {
  /**
   * setSchema - Allow to create custom views for WegasEntities in form components
   * @param schemaFN - The function that returns the customized schema. If no simplefilter is sat it should return something only when matches internal function filter (using the entity arg).
   * @param simpleFilter - A simple filter over a WegasEntity. Always use this one first if you want your view to be used with all entity of a certain class. Don't use it if you want your schema to be used with more than one entity.
   */
  setSchema: (
    schemaFN: CustomSchemaFN,
    simpleFilter?: ScriptableInterfaceName,
  ) => void;
}
