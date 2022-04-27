import { ViewOptions } from 'ol/View';
import * as React from 'react';
import { entityIs } from '../../../data/entities';
import { useScript } from '../../Hooks/useScript';
// import { useScript } from '../../Hooks/useScript';
import { WegasMap } from '../../Maps/WegasMap';
import { childrenDeserializerFactory } from '../Layouts/FlexList.component';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import { extentSchema, pointSchema } from './helpers/OLHelpers';

const defaultOptions: ViewOptions = {};

interface PlayerMapProps extends WegasComponentProps {
  // inbox?: IScript;
  mapOptions: IScript | ViewOptions;
}

export default function PlayerMap({ children, mapOptions }: PlayerMapProps) {
  const scriptedOptions = useScript<ViewOptions>(
    entityIs(mapOptions, 'Script') ? mapOptions : undefined,
  );
  const currentOptions = entityIs(mapOptions, 'Script')
    ? scriptedOptions
    : mapOptions;

  return (
    <WegasMap options={currentOptions || defaultOptions}>{children}</WegasMap>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerMap,
    componentType: 'Maps',
    container: {
      ChildrenDeserializer: childrenDeserializerFactory(),
    },
    name: 'Map',
    icon: 'map',
    illustration: 'scatter',
    schema: {
      mapOptions: {
        type: 'object',
        view: {
          type: 'scriptable',
          label: 'View options',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['unknown'],
          },
          literalSchema: schemaProps.hashlist({
            label: 'View options',
            choices: [
              {
                label: 'Center',
                value: {
                  prop: 'center',
                  schema: pointSchema('Center'),
                },
              },
              {
                label: 'Projection',
                value: {
                  prop: 'projection',
                  schema: schemaProps.string({ label: 'Projection' }),
                },
              },
              {
                label: 'Extent',
                value: {
                  prop: 'extent',
                  schema: extentSchema(),
                },
              },
              {
                label: 'Max resolution',
                value: {
                  prop: 'maxResolution',
                  schema: schemaProps.number({ label: 'Max resolution' }),
                },
              },
              {
                label: 'Min resolution',
                value: {
                  prop: 'minResolution',
                  schema: schemaProps.number({ label: 'Min resolution' }),
                },
              },
              {
                label: 'Resolution',
                value: {
                  prop: 'resolution',
                  schema: schemaProps.number({ label: 'Resolution' }),
                },
              },
              {
                label: 'Max zoom',
                value: {
                  prop: 'maxZoom',
                  schema: schemaProps.number({ label: 'Max zoom' }),
                },
              },
              {
                label: 'Min zoom',
                value: {
                  prop: 'minZoom',
                  schema: schemaProps.number({ label: 'Min zoom' }),
                },
              },
              {
                label: 'Zoom',
                value: {
                  prop: 'zoom',
                  schema: schemaProps.number({ label: 'Zoom' }),
                },
              },
            ],
            objectViewStyle: true,
          }),
        },
      },
    },
    allowedVariables: [],
    getComputedPropsFromVariable: () => ({
      children: [],
    }),
    behaviour: {
      filterChildrenName: ['Layer', 'TileLayer', 'Overlay'],
    },
  }),
);
