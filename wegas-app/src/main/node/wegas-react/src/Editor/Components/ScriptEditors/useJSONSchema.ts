import { cloneDeep } from 'lodash-es';
import { usePageComponentStore } from '../../../Components/PageComponents/tools/componentFactory';
import {
  actionsChoices,
  decorationsChoices,
  layoutCommonChoices,
  layoutConditionnalChoices,
} from '../../../Components/PageComponents/tools/options';
import { AvailableSchemas } from '../FormView';
import { hashListChoicesToSchema } from '../FormView/HashList';
import { wegasComponentCommonSchema } from '../Page/ComponentProperties';

/**
 * useJSONSchema - Creates the schema for the JSON of a page
 */
export function useJSONSchema() {
  const components = usePageComponentStore(s => s);
  const childrenLayoutOptionSchema = Object.values(components)
    .filter(component => component.container?.childrenLayoutOptionSchema)
    .reduce((o, c) => [...o, ...c.container!.childrenLayoutOptionSchema!], []);

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
      } as AvailableSchemas;
    }

    const properties = {
      ...wegasComponentCommonSchema,
      ...componentSchemaProperties,
      ...component.container?.childrenAdditionalShema,
      ...hashListChoicesToSchema([
        // ...Object.values(layoutChoices).reduce((o, c) => [...o, ...c], []),
        ...childrenLayoutOptionSchema,
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
          enum: [component.componentId],
        },
        props: {
          type: 'object',
          required: requiredProperties,
          properties: {
            ...wegasComponentCommonSchema,
            ...componentSchemaProperties,
            ...hashListChoicesToSchema([
              ...childrenLayoutOptionSchema,
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
