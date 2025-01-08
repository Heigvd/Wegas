import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  Plugin,
  PointElement,
  Tooltip,
} from 'chart.js';
import 'chartjs-plugin-dragdata';
import ZoomPlugin from 'chartjs-plugin-zoom';
import * as React from 'react';
import { Scatter } from 'react-chartjs-2';
import { ChartJSOrUndefined } from 'react-chartjs-2/dist/types';
import { IScript } from 'wegas-ts-api';
import { flex, halfOpacity } from '../../../css/classes';
import { entityIs } from '../../../data/entities';
import { classOrNothing } from '../../../Helper/className';
//////////////////////////////////////////////////////
// The CreatePoint Plugin
//////////////////////////////////////////////////////
import { wlog } from '../../../Helper/wegaslog';
import { useDeepMemo } from '../../Hooks/useDeepMemo';
import {
  ScriptCallback,
  useScript,
  useScriptCallback,
} from '../../Hooks/useScript';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { classStyleIdSchema } from '../tools/options';
import { schemaProps } from '../tools/schemaProps';

interface DoubleClickOptions {
  onDoubleClick?: ValueCb;
}

let clickTime: number | undefined = undefined;

const ChartJSDoubleClickPlugin: Plugin<'scatter'> = {
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
          wlog('Delta: ', delta);
          if (delta < 350) {
            // double-click detected
            const x = chart.scales.x.getValueForPixel(args.event.x!);
            const y = chart.scales.y.getValueForPixel(args.event.y!);

            wlog('Double click', x, y);
            if (x != undefined && y != undefined) {
              options.onDoubleClick({ x, y });
            }
            clickTime = undefined;
          } else {
            wlog('Too late');
            clickTime = currentTime;
          }
        } else {
          wlog('First late');
          clickTime = currentTime;
        }
      }
    }
  },
};

ChartJS.register(ChartJSDoubleClickPlugin);

//////////////////////////////////////////////////////

ChartJS.register(LinearScale, PointElement, LineElement, Legend, Tooltip);
ChartJS.register(ZoomPlugin);

type Point = { x: number; y: number };

interface Data {
  label: string;
  points: Point[];
  fill?: string;
  allowDrag?: boolean;
}

type ChartProps = React.ComponentProps<typeof Scatter>;

type DragCb = (
  e: MouseEvent,
  datasetIndex: number,
  index: number,
  value: { x: number; y: number },
) => boolean;
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
    };
  };
};

type Scales = ChartOptionsWithPlugins['scales'];

function useScales(
  scales: undefined | Scales | IScript,
  context?: Record<string, unknown>,
): undefined | Scales {
  const evaluated = useScript<Scales>(
    entityIs(scales, 'Script') ? scales : undefined,
    context,
  );
  if (evaluated != null) {
    return evaluated;
  } else if (typeof scales === 'object') {
    return scales as Scales;
  } else {
    return undefined;
  }
}

export interface PlayerScatterChartProps extends WegasComponentProps {
  height?: number;
  series: IScript;
  legendPosition: 'top' | 'right' | 'bottom' | 'left';
  legendAlign: 'start' | 'center' | 'end';
  showLine: boolean;
  allowZoom: boolean;
  responsive: boolean;
  allowDoubleClick: boolean;
  onDblClickCallback?: ScriptCallback;
  allowDrag?: boolean;
  onDragCallback: ScriptCallback;
  onDragStartCallback: ScriptCallback;
  onDragEndCallback: ScriptCallback;
  scales?: Scales | IScript;
}

function PlayerScatterChart({
  height,
  showLine,
  allowZoom,
  responsive,
  series,
  legendPosition,
  legendAlign,
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

  const contextRef = React.useRef(context);
  contextRef.current = context;

  const dblCb = useScriptCallback<ValueCb>(onDblClickCallback, contextRef);

  const dragStartCb = useScriptCallback<DragCb>(
    onDragStartCallback,
    contextRef,
  );
  const dragCb = useScriptCallback<DragCb>(onDragCallback, contextRef);
  const dragEndCb = useScriptCallback<DragCb>(onDragEndCallback, contextRef);

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
    responsive: responsive,
    showLine: showLine,
    animation: false,
    plugins: {
      legend: {
        position: legendPosition,
        align: legendAlign,
      },
    },
    scales: scales,
  };

  const chartRef = React.useRef<ChartJSOrUndefined<'scatter'>>();
  const [zoomEnabled, setZoomEnabled] = React.useState(false);

  const toggleZoomCb = React.useCallback(() => {
    setZoomEnabled(s => !s);
  }, [setZoomEnabled]);

  const resetZoomCb = React.useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  }, []);

  if (allowZoom) {
    chartOptions.plugins!.zoom = {
      zoom: {
        wheel: {
          enabled: zoomEnabled,
        },
      },
      pan: {
        enabled: true,
      },
    };
  }

  if (allowDrag) {
    chartOptions.plugins!.dragData = {
      dragX: true,
      onDragStart: dragStartCb,
      onDrag: dragCb,
      onDragEnd: dragEndCb,
    };
  }

  if (allowDoubleClick && dblCb) {
    chartOptions.plugins!.doubleClick = {
      onDoubleClick: dblCb,
    };
  }

  const memoChartOptions = useDeepMemo(chartOptions);

  return (
    <div
      id={id}
      className={
        className +
        classOrNothing(halfOpacity, options.disabled || options.locked)
      }
      style={style}
    >
      <Scatter
        ref={chartRef}
        data={chartData}
        options={memoChartOptions}
        height={height}
      />
      <div className={flex}>
        {allowZoom ? (
          <>
            <IconButton
              icon="undo"
              tooltip="reset zoom"
              onClick={resetZoomCb}
            />
            <CheckBox
              value={zoomEnabled}
              onChange={toggleZoomCb}
              label="enable zoom"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerScatterChart,
    componentType: 'Output',
    id: 'Scatter',
    name: 'Scatter plot',
    icon: 'chart-line',
    illustration: 'scatter',
    schema: {
      series: {
        view: {
          type: 'customscript',
          language: 'TypeScript',
          label: 'Series',
          returnType: [
            '{label: string, points:{x:number, y:number}[], fill?: string, allowDrag?: boolean}[]',
          ],
        },
      },
      legendPosition: schemaProps.select({
        label: 'Legend Position',
        value: 'top',
        values: ['top', 'right', 'bottom', 'left'],
        required: false,
      }),
      legendAlign: schemaProps.select({
        label: 'Legend Alignment',
        value: 'center',
        values: ['start', 'center', 'end'],
        required: false,
      }),
      allowDoubleClick: {
        type: 'boolean',
        value: false,
        view: {
          label: 'Allow Double-Click',
          description: 'allow double-clicks',
        },
      },
      onDblClickCallback: {
        type: 'object',
        value: {
          '@class': 'ScriptCallback',
          args: [],
          content: '',
        },
        view: {
          label: 'onDblClick callback',
          type: 'callback',
          callbackProps: {
            args: [['value', ['{ x: number; y: number }']]],
          },
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDoubleClick;
        },
      },
      allowDrag: {
        type: 'boolean',
        value: false,
        view: {
          label: 'Allow Drag',
        },
      },
      onDragCallback: {
        type: 'object',
        value: {
          '@class': 'ScriptCallback',
          args: [],
          content: '',
        },
        view: {
          label: 'onDrag callback',
          type: 'callback',
          callbackProps: {
            args: [
              ['e', ['MouseEvent']],
              ['datasetIndex', ['number']],
              ['index', ['number']],
              ['value', ['{ x: number; y: number }']],
            ],
            returnType: ['boolean'],
          },
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        },
      },
      onDragStartCallback: {
        type: 'object',
        value: {
          '@class': 'ScriptCallback',
          args: [],
          content: ';',
        },
        view: {
          label: 'onDragStart callback',
          type: 'callback',
          callbackProps: {
            args: [
              ['e', ['MouseEvent']],
              ['datasetIndex', ['number']],
              ['index', ['number']],
              ['value', ['{ x: number; y: number }']],
            ],
            returnType: ['boolean'],
          },
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        },
      },
      onDragEndCallback: {
        type: 'object',
        value: {
          '@class': 'ScriptCallback',
          args: [],
          content: ';',
        },
        view: {
          label: 'onDragStart callback',
          type: 'callback',
          callbackProps: {
            args: [
              ['e', ['MouseEvent']],
              ['datasetIndex', ['number']],
              ['index', ['number']],
              ['value', ['{ x: number; y: number }']],
            ],
            returnType: ['boolean'],
          },
        },
        visible: (_value, formValue) => {
          return formValue?.componentProperties?.allowDrag;
        },
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
      allowZoom: schemaProps.boolean({
        label: 'Allow zoom',
        value: false,
      }),
      responsive: schemaProps.boolean({
        label: 'Responsive',
        value: false,
      }),
      scales: {
        view: {
          type: 'scriptable',
          label: 'Scales',
          scriptProps: {
            language: 'TypeScript',
            returnType: ['unknown'],
          },
          literalSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'object',
                view: { label: 'X' },
                properties: {
                  min: schemaProps.number({
                    label: 'min',
                    layout: 'extraShortInline',
                  }),
                  max: schemaProps.number({
                    label: 'max',
                    layout: 'extraShortInline',
                  }),
                },
              },
              y: {
                type: 'object',
                view: { label: 'Y' },
                properties: {
                  min: schemaProps.number({
                    label: 'min',
                    layout: 'extraShortInline',
                  }),
                  max: schemaProps.number({
                    label: 'max',
                    layout: 'extraShortInline',
                  }),
                },
              },
            },
          },
        },
      },
      ...classStyleIdSchema,
    },
  }),
);
