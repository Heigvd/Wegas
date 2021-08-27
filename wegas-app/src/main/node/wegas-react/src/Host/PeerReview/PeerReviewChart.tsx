import { css, cx } from 'emotion';
import * as React from 'react';
import { flex, flexWrap } from '../../css/classes';
import { PeerReviewData } from './PeerReviewPage';
import { Bar, defaults } from 'react-chartjs-2';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { peerReviewTranslations } from '../../i18n/peerReview/peerReview';

if (defaults.global.legend != null) {
  defaults.global.legend.display = false;
}

const chartStyle = css({
  minWidth: '350px',
  width: '30%',
  padding: '1.5rem 3rem 1.5rem 0',
});
const chartLegendStyle = css({
  fontSize: '12px',
  opacity: '0.5',
  fontStyle: 'italic',
});

export interface ExtraProps {
  [id: number]: ChartObjectProps;
  maxNumberOfValue: number;
}

export type ChartObjectProps =
  | TextSummary
  | GradeSummary
  | CategorizationSummary;

interface TextSummary {
  type: 'TextSummary';
  name: string;
  label: string;
  id: number;
  numberOfValues: number;
  averageNumberOfWords: number;
  averageNumberOfCharacters: number;
  data: [];
}

interface IHistogramValues {
  min: number;
  max: number;
  maxValue: number | null;
  minValue: number | null;
  count: number;
}

interface GradeSummary {
  numberOfValues: number;
  mean: number;
  min?: number;
  max?: number;
  median: number;
  sd: number;
  histogram: IHistogramValues[];
  type: 'GradeSummary';
  id: number;
  name: string;
  label: string;
  data: [];
}

interface CategorizationSummary {
  type: 'CategorizationSummary';
  name: string;
  id: number;
  label: string;
  numberOfValues: number;
  histogram: {
    inutile: number;
    'peu utile': number;
    moyenne: number;
    utile: number;
    excellente: number;
  };
  data: [];
}

interface PRChartProps {
  completeData: PeerReviewData;
}

const chartOptions = {
  maintainAspectRatio: false,
  scales: {
    yAxes: [
      {
        ticks: {
          beginAtZero: true,
        },
      },
    ],
  },
};

interface DataForCharts {
  labels: string[];
  datasets: [
    {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    },
  ];
}

// TODO max numberof values to put in a global const!!!
function TextSummary({
  label,
  averageNumberOfCharacters,
  averageNumberOfWords,
  numberOfValues,
  maxValue,
}: TextSummary & { maxValue: number }) {
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  return (
    <div className={chartStyle}>
      <h3>{label}</h3>
      <div>
        <p>
          {`${i18nValues.orchestrator.stats.avgWc} : `}
          <strong>
            {averageNumberOfWords &&
              Math.round(averageNumberOfWords * 100) / 100}
          </strong>
        </p>
        <p>
          {`${i18nValues.orchestrator.stats.avgCc} : `}
          <strong>
            {averageNumberOfCharacters &&
              Math.round(averageNumberOfCharacters * 100) / 100}
          </strong>
        </p>
      </div>
      <p className={chartLegendStyle}>
        {i18nValues.orchestrator.stats.basedOn(
          String(numberOfValues),
          String(maxValue),
        )}
      </p>
    </div>
  );
}

function GradeSummary({
  min,
  max,
  histogram,
  label,
  mean,
  median,
  sd,
  numberOfValues,
  maxValue,
}: GradeSummary & { maxValue: number }) {
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const labels: string[] = [];
  for (let i = min || 1; i <= (max || 6); i += 1) {
    labels.push(i.toString());
  }
  const data: number[] = [];
  histogram.forEach(hist => {
    data.push(hist.count);
  });
  const dataSet: DataForCharts = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: 'rgba(140, 182, 46, 0.8)',
      },
    ],
  };
  return (
    <div className={chartStyle}>
      <h3>{label}</h3>
      <div>
        <Bar data={dataSet} options={chartOptions} height={230} />
      </div>
      <div className={chartLegendStyle}>
        <p>
          {`${i18nValues.orchestrator.stats.mean} : `}
          {mean && Math.round(mean * 100) / 100}
        </p>
        <p>
          {`${i18nValues.orchestrator.stats.median} : `}
          {median}
        </p>
        <p>
          {`${i18nValues.orchestrator.stats.sd} : `}
          {sd && Math.round(sd * 100) / 100}
        </p>
        <p>
          {i18nValues.orchestrator.stats.basedOn(
            String(numberOfValues),
            String(maxValue),
          )}
        </p>
      </div>
    </div>
  );
}

function CategorizationSummary({
  histogram,
  label,
  numberOfValues,
  maxValue,
}: CategorizationSummary & { maxValue: number }) {
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const labels: string[] = [];
  const data: number[] = [];
  Object.keys(histogram).forEach(key => {
    labels.push(key.toString());
  });
  Object.values(histogram).forEach(val => {
    data.push(val);
  });
  const dataSet: DataForCharts = {
    labels: labels,
    datasets: [
      {
        data: data,
        backgroundColor: 'rgba(140, 182, 46, 0.8)',
      },
    ],
  };
  return (
    <div className={chartStyle}>
      <h3>{label}</h3>
      <div>
        <Bar data={dataSet} options={chartOptions} height={230} />
      </div>
      <p className={chartLegendStyle}>
        {i18nValues.orchestrator.stats.basedOn(
          String(numberOfValues),
          String(maxValue),
        )}
      </p>
    </div>
  );
}

export function CreateTypedChart(
  prop: ChartObjectProps & { maxValue: number },
) {
  switch (prop.type) {
    case 'TextSummary':
      return <TextSummary {...prop} />;
    case 'GradeSummary':
      return <GradeSummary {...prop} />;
    case 'CategorizationSummary':
      return <CategorizationSummary {...prop} />;
    default:
      return <div>Unknown type of data</div>;
  }
}

export function PRChart({ completeData }: PRChartProps) {
  const maxValues = completeData.extra.maxNumberOfValue;

  const reviewSectionOrder: { i: number; value: ChartObjectProps }[] = [];
  const commentsSectionOrder: { i: number; value: ChartObjectProps }[] = [];

  function createOrderStructure() {
    Object.values(completeData.extra).forEach(value => {
      if (typeof value === 'object') {
        const chartID = value.id;

        completeData.structure.reviews.forEach((obj, i) => {
          if (obj.id?.includes(chartID.toString())) {
            reviewSectionOrder.push({ i, value });
          }
        });
        completeData.structure.comments.forEach((obj, i) => {
          if (obj.id?.includes(chartID.toString())) {
            commentsSectionOrder.push({ i, value });
          }
        });
      }
    });
  }
  createOrderStructure();

  // chart compo qui prend les extras (n importe lequel)
  // creer les compos selon interface (type)
  // branchez les compo (switch) dans le compo général

  return (
    <>
      <h2>Review Charts</h2>
      <div className={cx(flex, flexWrap)}>
        {reviewSectionOrder
          .sort((a, b) => a.i - b.i)
          .map(item => (
            <CreateTypedChart
              key={item.value.id}
              {...item.value}
              maxValue={maxValues}
            />
          ))}
      </div>
      <h2>Comments charts</h2>
      <div className={cx(flex, flexWrap)}>
        {commentsSectionOrder
          .sort((a, b) => a.i - b.i)
          .map(item => (
            <CreateTypedChart
              key={item.value.id}
              {...item.value}
              maxValue={maxValues}
            />
          ))}
      </div>
    </>
  );
}
