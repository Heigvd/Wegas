import { css, cx } from 'emotion';
import * as React from 'react';
import { flex, flexWrap } from '../../css/classes';

const chartStyle = css({
  width: '350px',
  padding: '1.5rem 3rem 1.5rem 0',
});
const chartLegendStyle = css({
  fontSize: '12px',
  opacity: '0.5',
  fontStyle: 'italic',
});

interface PRChartProps {
  data: {
    [id: string]: ChartObjectProps | number;
  };
}

interface ChartObjectProps {
  numberOfValues: any;
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
//TODO use lib (Chart.js)? to create charts
export function PRChart({ data }: PRChartProps) {
  const maxValues = data.maxNumberOfValue;

  const evalJustifications = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666595 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>
            <p>
              {'Nombre moyen de mots: '}
              <strong>
              {value.averageNumberOfWords &&
                Math.round(value.averageNumberOfWords * 100) / 100}
              </strong>
            </p>
            <p>
              {'Nombre moyen de caractères: '}
              <strong>
              {value.averageNumberOfCharacters &&
                Math.round(value.averageNumberOfCharacters * 100) / 100}
              </strong>
            </p>
          </div>
          <p className={chartLegendStyle}>
            Basé sur: {value.numberOfValues} / {maxValues}
          </p>
        </div>
      ),
  );

  const noteFond = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666598 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>There will be a chart here</div>
          <div className={chartLegendStyle}>
            <p>Moy.: {value.mean && Math.round(value.mean * 100) / 100}</p>
            <p>Med.: {value.median}</p>
            <p>Sd.: {value.sd && Math.round(value.sd * 100) / 100}</p>
            <p>
              Basé sur: {value.numberOfValues} / {maxValues}
            </p>
          </div>
        </div>
      ),
  );

  const noteForme = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666601 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>There will be a chart here</div>
          <div className={chartLegendStyle}>
            <p>Moy.: {value.mean && Math.round(value.mean * 100) / 100}</p>
            <p>Med.: {value.median}</p>
            <p>Sd.: {value.sd && Math.round(value.sd * 100) / 100}</p>
            <p>
              Basé sur: {value.numberOfValues} / {maxValues}
            </p>
          </div>
        </div>
      ),
  );

  const note = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666575 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>There will be a chart here</div>
          <div className={chartLegendStyle}>
            <p>Moy.: {value.mean && Math.round(value.mean * 100) / 100}</p>
            <p>Med.: {value.median}</p>
            <p>Sd.: {value.sd && Math.round(value.sd * 100) / 100}</p>
            <p>
              Basé sur: {value.numberOfValues} / {maxValues}
            </p>
          </div>
        </div>
      ),
  );


  const justification = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666578 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>
            <p>
              {'Nombre moyen de mots: '}
              <strong>
              {value.averageNumberOfWords &&
                Math.round(value.averageNumberOfWords * 100) / 100}
              </strong>
            </p>
            <p>
              {'Nombre moyen de caractères: '}
              <strong>
              {value.averageNumberOfCharacters &&
                Math.round(value.averageNumberOfCharacters * 100) / 100}
              </strong>
            </p>
          </div>
          <p className={chartLegendStyle}>
            Basé sur: {value.numberOfValues} / {maxValues}
          </p>
        </div>
      ),
  );

  const pertinenceEval = Object.entries(data).map(
    ([key, value]) =>
      typeof value === 'object' &&
      value.id === 19666581 && (
        <div key={key} className={chartStyle}>
          <h3>{value.label}</h3>
          <div>There will be a chart here</div>
          <p className={chartLegendStyle}>
            Basé sur: {value.numberOfValues} / {maxValues}
          </p>
        </div>
      ),
  );

  /*
function CreateCharts(key: string, value: ChartObjectProps) {
  if(value.label){
    switch (value.label) {
      case 'Note':
         const noteChart =
         <div key={key}>
          <h2>{value.label}</h2>
          <div>I'm the chart - from the future</div>
          <div>Basé sur: {value.numberOfValues} / {maxValues}</div>
          </div>
          return noteChart;
      case 'Note fond':
        break;
      case 'Note forme':
        break;
    }
  }
} */

  /* const reviewCharts = Object.entries(data).map(([key, value]) => (
     typeof value === "object" && value.type === "GradeSummary" &&
    <div key={key} className={chartStyle}>
      <h2>{value.label}</h2>
      <div>I'm the chart - from the future</div>
      <div>Basé sur: {value.numberOfValues} / {maxValues}</div>
    </div>
  ))

  const commentsCharts = Object.entries(data).map(([key, value]) => (
    typeof value === "object" && value.type === ("TextSummary" || "CategorizationSummary") &&
    <div key={key} className={chartStyle}>
      <h2>{value.label}</h2>
      <div>I'm the chart - from the future</div>
      <div>Basé sur: {value.numberOfValues} / {maxValues}</div>
    </div>
  ))
  // y a un 3eme type......
  // en fait le display suit pas les types retournés

  */

  return (
    <>
      <h2>Review Charts</h2>
      <div className={cx(flex, flexWrap)}>
        {evalJustifications}
        {noteFond}
        {noteForme}
      </div>
      <h2>Comments charts</h2>
      <div className={cx(flex, flexWrap)}>
        {note}
        {justification}
        {pertinenceEval}
      </div>
    </>
  );
}
