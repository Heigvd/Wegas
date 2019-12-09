import { pageComponentFactory, registerComponent } from './componentFactory';
import List from '../AutoImport/Layout/List';
import { schemaProps } from './schemaProps';

registerComponent(
  pageComponentFactory(
    List,
    'List',
    'bars',
    {
      children: schemaProps.hidden(true),
      style: schemaProps.code('Style', 'JSON'),
      horizontal: schemaProps.boolean('Horizontal'),
    },
    ['ISBooleanInstance'],
    (val?: Readonly<ISBooleanInstance>) => ({
      children: [],
      horizontal: val ? val.value : undefined,
    }),
  ),
);
