import * as React from 'react';
import { useScriptObjectWithFallback } from '../../Hooks/useScript';
import { styleSourceToOlStyle } from '../../Maps/helpers/LayerStyleHelpers';
import { selectSchema } from '../../Maps/helpers/schemas/SelectSchemas';
import { WegasSelect, WegasSelectProps } from '../../Maps/WegasSelect';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';

interface PlayerSelectProps extends WegasComponentProps {
  selectProps: {
    [P in keyof Omit<WegasSelectProps, 'style'>]: WegasSelectProps[P] | IScript;
  } & { style?: StyleObject | IScript };
}

export default function PlayerSelect({ selectProps }: PlayerSelectProps) {
  const selectEvaluatedProps = useScriptObjectWithFallback(selectProps);
  const style = styleSourceToOlStyle(selectEvaluatedProps.style);

  return <WegasSelect {...selectEvaluatedProps} style={style} />;
}

registerComponent(
  pageComponentFactory({
    component: PlayerSelect,
    componentType: 'Maps',
    name: 'Select',
    icon: 'map',
    illustration: 'scatter',
    schema: { selectProps: selectSchema },
  }),
);
