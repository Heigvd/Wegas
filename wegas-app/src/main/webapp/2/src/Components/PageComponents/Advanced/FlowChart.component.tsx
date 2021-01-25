import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useScript } from '../../Hooks/useScript';
import { IScript } from 'wegas-ts-api';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import {
  FlowChart,
  FlowChartProps,
  FlowLine,
  Process,
} from '../../FlowChart/FlowChart';
import { OnVariableChange, useOnVariableChange } from '../Inputs/tools';
import { wlog } from '../../../Helper/wegaslog';

interface PlayerFlowChartProps<F extends FlowLine, P extends Process<F>>
  extends WegasComponentProps,
    Omit<FlowChartProps<F, P>, 'processes' | 'onMove' | 'onNew' | 'onConnect'> {
  title?: IScript;
  processes?: IScript;
  onMove: OnVariableChange;
  onNew: OnVariableChange;
  onConnect: OnVariableChange;
}

export default function PlayerFlowChart<
  F extends FlowLine,
  P extends Process<F>
>({
  title,
  processes,
  onMove,
  context,
  className,
  style,
  id,
}: PlayerFlowChartProps<F, P>) {
  const titleText = useScript<string>(title, context);
  const scriptProcesses = useScript<Process<F>[]>(processes);

  const { handleOnChange: handleOnMove } = useOnVariableChange(onMove, context);

  wlog(scriptProcesses);

  return (
    <FlowChart
      title={titleText}
      processes={scriptProcesses}
      onMove={(process, newPosition) =>
        handleOnMove && handleOnMove({ process, newPosition })
      }
      onNew={() => {}}
      onConnect={() => {}}
      className={className}
      style={style}
      id={id}
    />
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerFlowChart,
    componentType: 'Advanced',
    name: 'Flow chart',
    icon: 'atom',
    schema: {
      processes: schemaProps.scriptVariable({
        label: 'Processes',
        returnType: [
          '{id: string;position:{x:number,y:number};connections:{id: string;connectedTo: string}[];}[]',
        ],
      }),
      title: schemaProps.scriptString({ label: 'Title', richText: true }),
    },
  }),
);
