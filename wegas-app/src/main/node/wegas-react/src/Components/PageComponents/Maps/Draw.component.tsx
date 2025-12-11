import * as React from 'react';
import {
  useScriptObjectWithFallback,
  useUpdatedContextRef,
} from '../../Hooks/useScript';
import { styleSourceToOlStyle } from '../../Maps/helpers/LayerStyleHelpers';
import { drawSchema } from '../../Maps/helpers/schemas/DrawSchemas';
import { WegasDraw, WegasDrawProps } from '../../Maps/WegasDraw';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerDrawProps extends WegasComponentProps {
  drawProps: {
    [P in keyof Omit<WegasDrawProps, 'style'>]: WegasDrawProps[P] | IScript;
  } & { style?: StyleObject | IScript };
}

export default function PlayerDraw({
  drawProps,
  context,
}: PlayerDrawProps) {
  const contextRef = useUpdatedContextRef(context);
  const drawEvaluatedProps = useScriptObjectWithFallback(
    drawProps,
    contextRef,
  );
  const style = styleSourceToOlStyle(drawEvaluatedProps.style);

  return <WegasDraw {...drawEvaluatedProps} style={style} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerDraw,
    componentType: 'Maps',
    id: 'WegasMapDraw',
    name: 'Features draw',
    icon: 'map',
    illustration: 'image',
    schema: { drawProps: drawSchema },
  }),
);
