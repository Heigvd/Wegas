import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import { cloneDeep } from 'lodash-es';
import { SchemaPropsSchemas } from '../../../Components/PageComponents/tools/schemaProps';
import { wegasComponentCommonSchema } from '../Page/ComponentProperties';
import { hashListChoicesToSchema } from '../FormView/HashList';
import {
  layoutCommonChoices,
  layoutConditionnalChoices,
  actionsChoices,
  decorationsChoices,
} from '../../../Components/PageComponents/tools/options';

const emptySchema = {};

/**
 * useJSONSchema - Creates the schema for the JSON of a page
 * @param enabled - If false, avoid calculation of the shema and return {}
 */
export function useJSONSchema(enabled: boolean = true) {
  const components = usePageComponentStore(s => s);

  if (!enabled) {
    return emptySchema;
  }

  const childrenSchemas = Object.values(components)
    .filter(component => component.container != null)
    .reduce((o, c) => [...o, ...c.container!.childrenSchema], []);

  const componentSchemas = Object.values(components).map(component => {
    const componentSchemaProperties = cloneDeep(
      component.schema.properties || {},
    );
    if ('children' in componentSchemaProperties) {
      componentSchemaProperties['children'] = {
        type: 'array',
        required: true,
        items: {
          $ref: '#/definitions/___self',
        },
      } as SchemaPropsSchemas;
    }

    const properties = {
      ...wegasComponentCommonSchema,
      ...componentSchemaProperties,
      ...hashListChoicesToSchema([
        // ...Object.values(layoutChoices).reduce((o, c) => [...o, ...c], []),
        ...childrenSchemas,
        ...layoutCommonChoices,
      ]),
      ...hashListChoicesToSchema(layoutConditionnalChoices),
      ...hashListChoicesToSchema(actionsChoices),
      ...hashListChoicesToSchema(decorationsChoices),
    };

    const requiredProperties = Object.entries(properties).reduce(
      (o, [type, component]) => (component.required ? [...o, type] : o),
      [],
    );

    return {
      type: 'object',
      required: ['type', 'props'],
      isContainer: component.container != null,
      properties: {
        type: {
          type: 'string',
          enum: [component.componentName],
        },
        props: {
          type: 'object',
          required: requiredProperties,
          properties: {
            ...wegasComponentCommonSchema,
            ...componentSchemaProperties,
            ...hashListChoicesToSchema([
              // ...Object.values(layoutChoices).reduce(
              //   (o, c) => [...o, ...c],
              //   [],
              // ),
              ...childrenSchemas,
              ...layoutCommonChoices,
            ]),
            ...hashListChoicesToSchema(layoutConditionnalChoices),
            ...hashListChoicesToSchema(actionsChoices),
            ...hashListChoicesToSchema(decorationsChoices),
          },
        },
      },
    };
  });

  return {
    oneOf: componentSchemas.filter(component => component.isContainer),
    definitions: {
      ___self: {
        allOf: [
          {
            $ref: '#/definitions/components',
          },
          {
            type: 'object',
            properties: {
              type: {},
              props: {},
            },
            additionalProperties: false,
          },
        ],
      },
      components: {
        defaultSnippets: [
          {
            label: 'New Component',
            body: {
              type: '$1',
            },
          },
        ],
        oneOf: componentSchemas,
      },
    },
  };
}
