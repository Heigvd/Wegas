import * as React from 'react';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { schemaProps } from '../tools/schemaProps';
import { WegasComponentProps } from '../tools/EditableComponent';
import { IScript } from 'wegas-ts-api';
import { classStyleIdShema } from '../tools/options';
import { halfOpacity } from '../../../css/classes';
import { classOrNothing } from '../../../Helper/className';

import { Scatter } from 'react-chartjs-2';
import { useScript } from '../../Hooks/useScript';

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  Plugin,
} from 'chart.js';

import 'chartjs-plugin-dragdata';
import { entityIs } from '../../../data/entities';


//////////////////////////////////////////////////////
// The CreatePoint Plugin
//////////////////////////////////////////////////////
import { wlog } from '../../../Helper/wegaslog';

interface DoubleClickOptions {
  onDoubleClick?: ValueCb;
};

let clickTime: number | undefined = undefined;

const ChartJSDoubleClickPlugin: Plugin<"scatter"> = {
  id: 'doubleClick',
  //  afterInit: function (chartInstance, _args, options: DoubleClickOptions) {
  //    const plugins = chartInstance.config.options?.plugins as {
  //      doubleClick?: CreateDoubleClickOptions;
  //    };
  //    if (plugins?.doubleClick) {
  //      const pluginOptions = plugins?.createPoint as DoubleClickOptions;
  //      const canvas = chartInstance.canvas as Node;
  //    }
  //  },
  beforeEvent: function (chart, args, anyOptions) {
    const options = anyOptions as unknown as DoubleClickOptions;
    if (options.onDoubleClick) {
      if (args.event.type === 'click') {
        const currentTime = new Date().getTime();
        if (clickTime) {
          const delta = currentTime - clickTime;
          wlog("Delta: ", delta);
          if (delta < 350) {
            // double-click detected
            const x = chart.scales.x.getValueForPixel(args.event.x!);
            const y = chart.scales.y.getValueForPixel(args.event.y!);

            wlog("Double click", x, y);
            if (x != undefined && y != undefined) {
              options.onDoubleClick({ x, y });
            }
            clickTime = undefined;
          } else {
            wlog("Too late");
            clickTime = currentTime;
          }
        } else {
          wlog("First late");
          clickTime = currentTime;
        }
      }
    }
  },
}

ChartJS.register(ChartJSDoubleClickPlugin)



//////////////////////////////////////////////////////



ChartJS.register(LinearScale, PointElement, LineElement, Legend, Tooltip);

type Point = { x: number; y: number };

interface Data {
  label: string;
  points: Point[];
  fill?: string;
  allowDrag?: boolean;
}

type ChartProps = React.ComponentProps<typeof Scatter>;

type DragCb = (e: MouseEvent, datasetIndex: number, index: number, value: { x: number; y: number }) => boolean;
type ValueCb = (value: { x: number; y: number }) => void;

type ChartOptionsWithPlugins = ChartProps['options'] & {
  plugins?: {
    doubleClick?: DoubleClickOptions;
    dragData?: {
      /**
       * rounds the values to n decimal places
       * in this case 1, e.g 0.1234 => 0.1)
       */
      round?: number;
      /**
       * also enable dragging along the x-axis.
       * this solely works for continous, numerical x-axis scales (no categories or dates)!
       */
      dragX?: boolean;
      /**
       * how the tooltip while dragging [default = true]
       */
      showTooltip?: boolean;
      onDragStart?: DragCb;
      onDrag?: DragCb;
      onDragEnd?: DragCb;
    }
  }
}

type Scales = ChartOptionsWithPlugins['scales'];

function useScales(scales: undefined | Scales | IScript, context?: Record<string, unknown>): undefined | Scales {
  const evaluated = useScript<Scales>(entityIs(scales, 'Script') ? scales : undefined, context);
  if (evaluated != null) {
    return evaluated
  } else if (typeof scales === 'object') {
    return scales as Scales;
  } else {
    return undefined;
  }
}


export interface PlayerScatterChartProps extends WegasComponentProps {
  height?: number;
  series: IScript;
  showLine: boolean;
  allowDoubleClick: boolean;
  onDblClickCallback?: IScript;
  allowDrag?: boolean;
  onDragCallback: IScript;
  onDragStartCallback: IScript;
  onDragEndCallback: IScript;
  scales?: Scales | IScript;
}

function PlayerScatterChart({
  height,
  showLine,
  series,
  allowDoubleClick,
  onDblClickCallback,
  allowDrag,
  onDragCallback,
  onDragStartCallback,
  onDragEndCallback,
  scales: scriptableScales,
  className,
  style,
  id,
  options,
  context,
}: PlayerScatterChartProps): JSX.Element {
  const evaluatedData = useScript<Data[]>(series, context);

  const dblCb = useScript<ValueCb>(onDblClickCallback, context);

  const dragStartCb = useScript<DragCb>(onDragStartCallback, context);
  const dragCb = useScript<DragCb>(onDragCallback, context);
  const dragEndCb = useScript<DragCb>(onDragEndCallback, context);

  const scales = useScales(scriptableScales, context);

  //  const eMinY = useScriptableNumber(minY, context);
  //  const eMaxY = useScriptableNumber(maxY, context);
  //  const eMinX = useScriptableNumber(minX, context);
  //  const eMaxX = useScriptableNumber(maxX, context);

  const chartData: ChartProps['data'] = {
    datasets: (evaluatedData || [])
      .filter(serie => !!serie)
      .map(serie => {
        return {
          label: serie.label,
          data: serie.points,
          backgroundColor: serie.fill,
          pointHitRadius: allowDrag ? 5 : undefined,
          dragData: allowDrag,
        };
      }),
  };

  const chartOptions: ChartOptionsWithPlugins = {
    responsive: false,
    showLine: showLine,
    animation: false,
    plugins: {},
    scales: scales,
  };

  if (allowDrag) {
    chartOptions.plugins!.dragData = {
      dragX: true,
      onDragStart: dragStartCb,
      onDrag: dragCb,
      onDragEnd: dragEndCb,
    }
  }

  if (allowDoubleClick && dblCb) {
    chartOptions.plugins!.doubleClick = {
      onDoubleClick: dblCb,
    }
  }

  return (
    <div
      id={ id }
      className={
        className +
        classOrNothing(halfOpacity, options.disabled || options.locked)
      }
      style={ style }
    >
      <Scatter data={ chartData } options={ chartOptions } height={ height } />
    </div>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerScatterChart,
    componentType: 'Output',
    name: 'Scatter',
    icon: 'chart-line',
    illustration: 'scatter',
    schema: {
      series: {
        view: {
          type: 'customscript',
          label: 'Series',
          returnType: [
            '{label: string, points:{x:number, y:number}[], fill?: string, allowDrag?: boolean}[]',
          ],
        },
      },
      allowDoubleClick: {
        type: 'boolean',
        value: false,
        view: {
          label: 'Allow Double-Click',
          description: "allow double-clicks"
        }
      },
      onDblClickCallback: {
        type: 'object',
        value: { '@class': 'Script', language: 'typescript', content: 'undefined;' },
        view: {
          label: 'onDblClick callback',
          type: 'customscript',
          returnType: ['undefined', '((value: { x: number; y: number }) => void)']
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDoubleClick;
        }
      },
      allowDrag: {
        type: 'boolean',
        value: false,
        view: {
          label: 'Allow Drag',
        }
      },
      onDragCallback: {
        type: 'object',
        value: { '@class': 'Script', language: 'typescript', content: 'undefined;' },
        view: {
          label: 'onDrag callback',
          type: 'customscript',
          returnType: ['undefined', '((e: MouseEvent, datasetIndex: number, index: number, value: { x: number; y: number }) => boolean)']
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        }
      },
      onDragStartCallback: {
        type: 'object',
        value: { '@class': 'Script', language: 'typescript', content: 'undefined;' },
        view: {
          label: 'onDragStart callback',
          type: 'customscript',
          returnType: ['undefined', '((e: MouseEvent, datasetIndex: number, index: number, value: { x: number; y: number }) => boolean)']
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        }
      },
      onDragEndCallback: {
        type: 'object',
        value: { '@class': 'Script', language: 'typescript', content: 'undefined;' },
        view: {
          label: 'onDragStart callback',
          type: 'customscript',
          returnType: ['undefined', '((e: MouseEvent, datasetIndex: number, index: number, value: { x: number; y: number }) => boolean)']
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        }
      },
      height: schemaProps.number({
        label: 'Height',
        required: false,
        value: undefined,
      }),
      showLine: schemaProps.boolean({
        label: 'Show lines',
        value: false,
      }),
      scales: {
        view: {
          type: 'scriptable',
          label: 'Scales',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['unknown'],
            scriptContext: 'Client'
          },
          literalSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                view: { label: 'X' },
                properties: {
                  min: schemaProps.number({ label: 'min', layout: 'extraShortInline' }),
                  max: schemaProps.number({ label: 'max', layout: 'extraShortInline' })
                }
              },
              y: {
                type: 'object',
                view: { label: 'Y' },
                properties: {
                  min: schemaProps.number({ label: 'min', layout: 'extraShortInline' }),
                  max: schemaProps.number({ label: 'max', layout: 'extraShortInline' })
                }
              }
            }
          }
        }
      },
      ...classStyleIdShema,
    },
  }),
);
