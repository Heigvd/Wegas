export type SimpleSchema =
  | {}
  | {
      properties?: {
        [props: string]: SimpleSchema;
      };
      additionalProperties?: SimpleSchema;
    }
  | { items?: SimpleSchema[] | SimpleSchema };

export interface TypedEntity extends ISMergeable {
  '@class': WegasClassNames;
}

export type CustomSchemaFN = <T extends TypedEntity>(
  entity: T,
  // eslint-disable-next-line
  baseSchema: any,
) => SimpleSchema | void;

export interface GlobalSchemaClass {
  /**
   * setSchema - Creates custom views for WegasEntities in form components
   * @param name - The name of the custom schema. Allows to override a previous custom schema.
   * @param schemaFN - The function that returns the customized schema. If no simplefilter is sat it should return something only when matches internal function filter (using the entity arg).
   * @param simpleFilter - A simple filter over a WegasEntity. Always use this one first if you want your view to be used with all entity of a certain class. Don't use it if you want your schema to be used with more than one entity.
   */
  addSchema: (
    name: string,
    schemaFN: CustomSchemaFN,
    simpleFilter?: WegasClassNames,
  ) => void;
  /**
   * removeSchema - Remove a custom schema by name.
   * @param name - The name of the custom schema
   */
  removeSchema: (name: string) => void;
}
