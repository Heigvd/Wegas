import { pageComponentFactory, registerComponent } from './componentFactory';
import List, { ListProps } from '../AutoImport/Layout/List';
import { schemaProps } from './schemaProps';

const PlayerList: React.FunctionComponent<ListProps> = List;

registerComponent(
  pageComponentFactory(
    PlayerList,
    'List',
    'bars',
    {
      children: schemaProps.hidden(undefined, true),
      style: schemaProps.code('Style', false, 'JSON'),
      className: schemaProps.string('ClassName', false),
      horizontal: schemaProps.boolean('Horizontal', false),
    },
    ['ISListDescriptor'],
    (val?: Readonly<ISListDescriptor>) =>
      val
        ? {
            children: [], //TODO : get children entites and translated them into WegasComponents
          }
        : {
            children: [],
          },
  ),
);
