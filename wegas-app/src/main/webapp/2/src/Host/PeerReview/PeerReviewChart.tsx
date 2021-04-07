import { css, cx } from 'emotion';
import * as React from 'react';
import { flex, flexWrap } from '../../css/classes';
import { PeerReviewData } from './PeerReviewPage';
import { Bar } from 'react-chartjs-2';
const chartStyle = css({
  width: '350px',
  padding: '1.5rem 3rem 1.5rem 0',
});
const chartLegendStyle = css({
  fontSize: '12px',
  opacity: '0.5',
  fontStyle: 'italic',
});

export interface ExtraProps {
  [id: number]: ChartObjectProps ;
  maxNumberOfValue: number;
}

export type ChartObjectProps = TextSummary | GradeSummary | CategorizationSummary;

interface TextSummary {
  type: 'TextSummary',
  name: string,
  label: string,
  id: number,
  numberOfValues: number,
  averageNumberOfWords: number,
  averageNumberOfCharacters: number,
  data: [],
}

interface IHistogramValues {
          min: number,
          max: number,
          maxValue: number | null,
          minValue: number | null,
          count: number,
}

interface GradeSummary {
      numberOfValues: number,
      mean: number,
      min: number,
      max: number,
      median: number,
      sd: number,
      histogram: IHistogramValues[],
      type: 'GradeSummary',
      id: number,
      name: string,
      label: string,
      data: [],
}

interface CategorizationSummary {
      type: 'CategorizationSummary',
      name: string,
      id: number,
      label: string,
      numberOfValues: number,
      histogram: {
        inutile: number,
        'peu utile': number,
        moyenne: number,
        utile: number,
        excellente: number,
      },
      data: [],
}

interface PRChartProps {
  completeData: PeerReviewData
}


/* function isTextSummary(val: any): val is TextSummary {
return val != null && typeof val === "object" && val.type === "TextSummary"
}
function isGradeSummary(val: any): val is GradeSummary {
  return val != null && typeof val === "object" && val.type === "GradeSummary"
}
function isCategorizationSummary(val: any): val is CategorizationSummary {
  return val != null && typeof val === "object" && val.type === "CategorizationSummary"
} */

// TODO max numberof values to put in a global const!!!
function TextSummary(prop : TextSummary){
  return(
    <div className={chartStyle}>
          <h3>{prop.label}</h3>
          <div>
            <p>
              {'Nombre moyen de mots: '}
              <strong>
              {prop.averageNumberOfWords &&
                Math.round(prop.averageNumberOfWords * 100) / 100}
              </strong>
            </p>
            <p>
              {'Nombre moyen de caractères: '}
              <strong>
              {prop.averageNumberOfCharacters &&
                Math.round(prop.averageNumberOfCharacters * 100) / 100}
              </strong>
            </p>
          </div>
          <p className={chartLegendStyle}>
            Basé sur: {prop.numberOfValues}
          </p>
      </div>
  )
}

const dataTestForCharts = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
    }]
}

function GradeSummary(prop: GradeSummary){
  return(
    <div className={chartStyle}>
          <h3>{prop.label}</h3>
          <div>
            <Bar data={dataTestForCharts} />
    </div>
          <div className={chartLegendStyle}>
            <p>Moy.: {prop.mean && Math.round(prop.mean * 100) / 100}</p>
            <p>Med.: {prop.median}</p>
            <p>Sd.: {prop.sd && Math.round(prop.sd * 100) / 100}</p>
            <p>
              Basé sur: {prop.numberOfValues}
            </p>
          </div>
    </div>
  )
}

function CategorizationSummary(prop: CategorizationSummary){
  return(
    <div className={chartStyle}>
          <h3>{prop.label}</h3>
          <div>There will be a chart here</div>
          <p className={chartLegendStyle}>
            Basé sur: {prop.numberOfValues}
          </p>
        </div>
  )
}

export function CreateTypedChart(prop : ChartObjectProps){
  switch(prop.type){
    case 'TextSummary':
      return <TextSummary {...prop}/>;
    case 'GradeSummary':
      return <GradeSummary {...prop} />
    case 'CategorizationSummary':
      return <CategorizationSummary {...prop} />
    default:
      return <div>Sorry, nothing to return.</div>
  }
}

export function PRChart({completeData}: PRChartProps) {
  //const maxValues = data.maxNumberOfValue;

    let reviewSectionOrder:{i: number, value:ChartObjectProps}[] = [];
    let commentsSectionOrder:{i: number, value:ChartObjectProps}[] = [];


    function createOrderStructure() {
      Object.entries(completeData.extra).forEach(([key, value]) => {
        if(typeof value === "object"){
          let chartID = value.id;

          completeData.structure.reviews.forEach((obj, i)=> {
            if(obj.id?.includes(chartID.toString())) {
              reviewSectionOrder.push({i, value});
            }
          })
          completeData.structure.comments.forEach((obj, i)=> {
            if(obj.id?.includes(chartID.toString())) {
              commentsSectionOrder.push({i, value});
            }
          })
        }
        }
      );
    }
    createOrderStructure();

// chart compo qui prend les extras (n importe lequel)
// creer les compos selon interface (type)
// branchez les compo (switch) dans le compo général

  return (
    <>
      <h2>Review Charts</h2>
      <div className={cx(flex, flexWrap)}>
        {reviewSectionOrder.sort((a, b)=>a.i - b.i).map((item)=><CreateTypedChart key={item.value.id} {...item.value} />)}
      </div>
      <h2>Comments charts</h2>
      <div className={cx(flex, flexWrap)}>
        {commentsSectionOrder.sort((a, b)=>a.i - b.i).map((item)=><CreateTypedChart key={item.value.id} {...item.value} />)}
      </div>
    </>
  );
}
