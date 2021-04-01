import * as React from 'react';

interface PRChartProps {
  data: {
    [id: string]:
      | {
          numberOfValues: number;
          mean?: number | null;
          min?: number | null;
          max?: number | null;
          median?: number | null;
          sd?: number | null;
          histogram?:
            | {
                min: number;
                max: number;
                maxValue: number | null;
                minValue: number | null;
                count: number;
              }[]
            | {
                [label: string]: number;
              };
          type: string;
          id: number;
          name: string;
          label: string;
          data: [];
          averageNumberOfWords?: number;
          averageNumberOfCharacters?: number;
        }
      | number;
  };
}

export function PRChart({ data }: PRChartProps) {
  const object = Object.entries(data).map(([key, value]) => (
    <div key={key}>
      <h2>{value.toString()}</h2>
    </div>
  ));
  return <h2>{object}</h2>;
}
