import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
  PageComponentMandatoryProps,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { css, cx } from 'emotion';
import { themeVar } from '../../Theme';
import List, { ListProps } from '../../Layouts/List';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.searchColor,
});

export const childHighlightCSS = {
  borderStyle: 'dotted',
  borderWidth: '1px',
  borderColor: themeVar.searchColor,
};

export const childHighlightStyle = css({
  '&>*': childHighlightCSS,
});

type PlayerListProps = ListProps<WegasComponent> & PageComponentMandatoryProps;

function PlayerList(props: PlayerListProps) {
  const { EditHandle, showBorders } = props;
  const [showLayout, setShowLayout] = React.useState(
    showBorders ? true : false,
  );

  React.useEffect(() => {
    if (showBorders !== undefined) {
      setShowLayout(showBorders);
    }
  }, [showBorders]);

  return (
    <div
      className={cx(showLayout && layoutHighlightStyle)}
      style={{ width: '100%', display: 'flex' }}
    >
      <div
        style={{
          display: props.horizontal ? 'block' : 'inline-flex',
          width: '100%',
          height: '100%',
        }}
      >
        <EditHandle
          togglerProps={{
            onClick: setShowLayout,
            checked: showLayout,
            hint: 'Highlight list borders (only during edition mode)',
          }}
          vertical={!props.horizontal}
        />
        <List
          {...props}
          className={cx(props.className, showLayout && childHighlightStyle)}
        />
      </div>
    </div>
  );
}

registerComponent(
  pageComponentFactory(
    PlayerList,
    'List',
    'bars',
    {
      children: schemaProps.hidden(false),
      style: schemaProps.code('Style', false, 'JSON'),
      className: schemaProps.string('ClassName', false),
      horizontal: schemaProps.boolean('Horizontal', false),
      shrink: schemaProps.boolean('Shrink', false),
      center: schemaProps.boolean('Center', false),
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
