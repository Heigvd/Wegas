import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { FlowChart, FlowChartProps } from '../../FlowChart/FlowChart';
import {
  LabeledFlowLine,
  LabeledFlowLineComponent,
  LabeledProcess,
  PlayerFlowChartProcessComponent,
} from '../../FlowChart/PlayerFlowChartComponents';
import { useScript } from '../../Hooks/useScript';
import {
  OnVariableChange,
  onVariableChangeSchema,
  useOnVariableChange,
} from '../Inputs/tools';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

const defaultProcessInitialSize = {
  width: 100,
  height: 50,
};

interface PlayerFlowChartProps<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>,
> extends WegasComponentProps,
    Omit<FlowChartProps<F, P>, 'processes' | 'onMove' | 'onNew' | 'onConnect' | 'title'> {
  title?: IScript;
  processes?: IScript;
  onMove: OnVariableChange;
  onNew: OnVariableChange;
  onConnect: OnVariableChange;
}

export default function PlayerFlowChart<
  F extends LabeledFlowLine,
  P extends LabeledProcess<F>,
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
  options,
}: PlayerFlowChartProps<F, P>) {
  const { editMode } = React.useContext(pageCTX);
  const titleText = useScript<string>(title, context);
  const scriptProcesses = useScript<LabeledProcess<F>[]>(processes);

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
      onConnect={(sourceProcess, targetProcess, flowLine, backward) =>
        handleOnConnect &&
        handleOnConnect({ sourceProcess, targetProcess, flowLine, backward })
      }
      className={className}
      style={style}
      id={id}
      Flowline={LabeledFlowLineComponent}
      Process={PlayerFlowChartProcessComponent}
      processInitialSize={defaultProcessInitialSize}
      disabled={editMode || options.disabled || options.locked}
      readOnly={options.readOnly}
    />
  );
}

const returnType = [
  `{id: string; label:string; position:{x:number,y:number}; connections:{id: string; label:string; connectedTo: string}[];}[]`,
];

registerComponent(
  pageComponentFactory({
    component: PlayerFlowChart,
    componentType: 'Advanced',
    id: 'Flow chart',
    name: 'Flow chart',
    icon: 'atom',
    illustration: 'flowChart',
    schema: {
      title: schemaProps.scriptString({ label: 'Title', richText: true }),
      processes: schemaProps.scriptVariable({
        label: 'Processes',
        returnType,
      }),
      onMove: onVariableChangeSchema('On move action'),
      onNew: onVariableChangeSchema('On new action'),
      onConnect: onVariableChangeSchema('On connect action'),
    },
  }),
);
