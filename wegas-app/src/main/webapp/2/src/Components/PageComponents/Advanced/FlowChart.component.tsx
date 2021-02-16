import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { useScript } from '../../Hooks/useScript';
import { IScript } from 'wegas-ts-api';
import {
  FlowChart,
  FlowChartProps,
  FlowLine,
  Process,
} from '../../FlowChart/FlowChart';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from '../Inputs/tools';

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
  onNew,
  onConnect,
  context,
  className,
  style,
  id,
}: PlayerFlowChartProps<F, P>) {
  const titleText = useScript<string>(title, context);
  const scriptProcesses = useScript<Process<F>[]>(processes);

  const { handleOnChange: handleOnMove } = useOnVariableChange(onMove, context);
  const { handleOnChange: handleOnNew } = useOnVariableChange(onNew, context);
  const { handleOnChange: handleOnConnect } = useOnVariableChange(
    onConnect,
    context,
  );

  return (
    <FlowChart
      title={titleText}
      processes={scriptProcesses}
      onMove={(process, newPosition) =>
        handleOnMove && handleOnMove({ process, newPosition })
      }
      onNew={(sourceProcess, newPosition, flowLine) =>
        handleOnNew && handleOnNew({ sourceProcess, newPosition, flowLine })
      }
      onConnect={(sourceProcess, targetProcess, flowLine) =>
        handleOnConnect &&
        handleOnConnect({ sourceProcess, targetProcess, flowLine })
      }
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
      title: schemaProps.scriptString({ label: 'Title', richText: true }),
      processes: schemaProps.scriptVariable({
        label: 'Processes',
        returnType: [
          '{id: string;position:{x:number,y:number};connections:{id: string;connectedTo: string}[];}[]' as WegasScriptEditorReturnTypeName,
        ],
      }),
      onMove: onVariableChangeSchema('On move action'),
      onNew: onVariableChangeSchema('On new action'),
      onConnect: onVariableChangeSchema('On connect action'),
    },
  }),
);
