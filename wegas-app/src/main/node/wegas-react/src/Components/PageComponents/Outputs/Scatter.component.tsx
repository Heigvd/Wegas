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
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Legend, Tooltip);

type Point = { x: number; y: number };

interface Data {
  label: IScript;
  points: IScript;
  fill?: string;
}

export interface PlayerScatterChartProps extends WegasComponentProps {
  height?: number;
  data: Data[];
  showLine: boolean;
}

type ChartProps = React.ComponentProps<typeof Scatter>;

function PlayerScatterChart({
  height,
  showLine,
  data,
  className,
  style,
  id,
  options,
  context,
}: PlayerScatterChartProps): JSX.Element {
  const labelScripts: IScript[] = [];
  const pointScripts: IScript[] = [];

  (data || []).forEach(dataSet => {
    labelScripts.push(dataSet.label);
    pointScripts.push(dataSet.points);
  });

  const labels = useScript<string[]>(labelScripts, context);
  const points = useScript<Point[][]>(pointScripts, context);

  const chartData: ChartProps['data'] = {
    datasets: [],
  };

  const chartOptions: ChartProps['options'] = {
    showLine: showLine,
  };

  (labels || []).forEach((label, i) => {
    if (points != null) {
      const dataSet = points[i];
      chartData.datasets!.push({
        label,
        data: dataSet,
        backgroundColor: data[i]?.fill,
      });
    }
  });

  return (
    <div
      id={id}
      className={
        className +
        classOrNothing(halfOpacity, options.disabled || options.locked)
      }
      style={style}
    >
      <Scatter data={chartData} options={chartOptions} height={height} />
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
      data: schemaProps.array({
        label: 'Datasets',
        itemSchema: {
          label: schemaProps.scriptString({
            label: 'Name',
          }),
          points: schemaProps.customScript({
            label: 'Points',
            //@ts-ignore this works fine
            returnType: ['{x:number;y:number}[]'],
          }),
          fill: {
            type: 'string',
            value: '',
            view: {
              type: 'colorpicker',
              label: 'Fill color',
            },
          },
        },
      }),
      height: schemaProps.number({
        label: 'Height',
        required: false,
        value: undefined,
      }),
      showLine: schemaProps.boolean({
        label: 'Show lines',
        value: false,
      }),
      ...classStyleIdShema,
    },
  }),
);
