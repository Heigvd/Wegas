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
  label: string;
  points: Point[];
  fill?: string;
  allowDrag?: boolean;
}

export interface PlayerScatterChartProps extends WegasComponentProps {
  height?: number;
  series: IScript;
  showLine: boolean;
}
/*
 * TODO
 *********
 *  1) if any serie | s.allowDrag then
 *     - enable dragData plugin
 *     - onDragEnd = call
 */

type ChartProps = React.ComponentProps<typeof Scatter>;

function PlayerScatterChart({
  height,
  showLine,
  series,
  className,
  style,
  id,
  options,
  context,
}: PlayerScatterChartProps): JSX.Element {
  const evaluatedData = useScript<Data[]>(series, context);

  const chartData: ChartProps['data'] = {
    datasets: (evaluatedData || [])
      .filter(serie => !!serie)
      .map(serie => {
        return {
          label: serie.label,
          data: serie.points,
          backgroundColor: serie.fill,
        };
      }),
  };

  const chartOptions: ChartProps['options'] = {
    responsive: true,
    showLine: showLine,
    animation: false,
    plugins: {},
  };

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
      series: {
        view: {
          type: 'customscript',
          label: 'Series',
          returnType: [
            '{label: string, points:{x:number, y:number}[], fill?: string, allowDrag?: boolean}[]',
          ],
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
      ...classStyleIdShema,
    },
  }),
);
