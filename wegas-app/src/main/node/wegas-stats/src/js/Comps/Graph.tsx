import * as React from "react";
import Chartist from "chartist";
import "chartist/dist/chartist.min.css";
import {computeData, computeDiffs} from "./dataCompute";
import "../../css/chartist.css";
import {useAppSelector} from "../Store/hooks";
import {entityIs, WithItems} from "../API/wegas";
import {IQuestionDescriptor, IVariableDescriptor} from "wegas-ts-api";
import {GameOption} from "./GameSelect";

const CHART_BAR_OPT = {
  width: 600,
  height: 400,
  axisY: {
    labelInterpolationFnc: function label(value: any) {
      return `${value}%`;
    },
    scaleMinSpace: 20,
    onlyInteger: true,
  },
  axisX: {
    offset: 50,
  },
  low: 0,
  high: 100,
};
const DIFF_BAR_OPT = CHART_BAR_OPT;
/* Object.assign({}, CHART_BAR_OPT, {
 low: -100,
 }); */
const inlineStyle: React.CSSProperties = {
  display: "inline-block",
  whiteSpace: "normal",
};
const noWrap: React.CSSProperties = {
  whiteSpace: "nowrap",
};
const legendStyle: React.CSSProperties = {
  marginRight: 20,
  padding: "3px 10px",
};
interface GraphProps {
  groups: GameOption[][];
  questionName: string | null;
  logId: string;
}

export default function Graph({groups, questionName, logId}: GraphProps) {

  const chartRef = React.useRef<Chartist.IChartistBarChart>()
  const diffRef = React.useRef<Chartist.IChartistBarChart>()

  const chartDivRef = React.useRef<HTMLDivElement>();
  const diffDivRef = React.useRef<HTMLDivElement>();

  const initChart = React.useCallback((ref: HTMLDivElement | null) => {
    chartDivRef.current = ref || undefined;
    if (ref != null) {
      chartRef.current = new Chartist.Bar(chartDivRef.current, {labels: [], series: []}, CHART_BAR_OPT);
    } else if (chartRef.current != null) {
      chartRef.current.detach();
    }
  }, []);

  const initDiffChart = React.useCallback((ref: HTMLDivElement | null) => {
    diffDivRef.current = ref || undefined;
    if (ref != null) {
      diffRef.current = new Chartist.Bar(diffDivRef.current, {labels: [], series: []}, DIFF_BAR_OPT);
    } else if (diffRef.current != null) {
      diffRef.current.detach();
    }
  }, []);

  const questionDescriptor = useAppSelector(state => {

    function search(children: IVariableDescriptor[]): IQuestionDescriptor | undefined {
      for (const child of children) {
        if (entityIs(child, 'QuestionDescriptor')) {
          if (child.name === questionName) {
            return child;
          }
        } else if (entityIs(child, 'ListDescriptor')) {
          const found = search((child as unknown as WithItems).items);
          if (found != null) {
            return found;
          }
        }
      }
    }

    if (questionName) {
      return search(state.variables.variables);
    } else {
      return undefined;
    }
  });

  React.useEffect(() => {
    // questionDescriptor changed
    // rebuild charts
    if (questionDescriptor != null) {
      computeData(questionDescriptor, logId, groups)
        .then((data) => {
          if (chartRef.current != null) {
            chartRef.current.update(data);
          }
          return data;
        })
        .then(computeDiffs)
        .then((data) => {
          if (diffRef.current != null) {
            diffRef.current.update(data);
          }
        });

    }

  }, [questionDescriptor, groups, logId]);





  const legends = groups.map((_val, index) => (
    <span
      className={`color ct-series-${String.fromCharCode(97 + index)}`}
      key={index}
      style={legendStyle}
    >{`Group ${index + 1}`}</span>
  ));
  return (
    <div>
      <span className="legend">{legends}</span>
      <div style={noWrap}>
        <div ref={initChart} style={inlineStyle} />
        <div ref={initDiffChart} style={inlineStyle} />
      </div>
    </div>
  );
}

//const noDisplay: React.CSSProperties = {
//  display: "none",
//};

//function inlineSvgStyle(node: Element) {
//  const tw = document.createTreeWalker(node, 1);
//  let currentNode = tw.nextNode();
//  while (currentNode != null) {
//    currentNode.setAttribute("style", getComputedStyle(currentNode).cssText);
//    currentNode = tw.nextNode();
//  }
//  return node;
//}

// function svgToPng(node) {
//     inlineSvgStyle(node);
//     return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.src = 'data:image/svg+xml;base64,' +
//         btoa(window.unescape(encodeURIComponent((new XMLSerializer()).serializeToString(node))));
//         img.onload = function onload() {
//             const can = document.createElement('canvas');
//             const ctx = can.getContext('2d');
//             const target = new Image();
//             can.width = img.width;
//             can.height = img.height;
//             ctx.drawImage(img, 0, 0, img.width, img.height);
//             target.src = can.toDataURL();
//             resolve(target);
//         };
//         img.onerror = reject;
//     });
// }


  //  genAll() {
  //    const windowHandler = window.open();
  //    const { groups, snapshot, logId } = this.props;
  //    const tmpChart = new Chartist.Bar(
  //      this.refs.tmpChart,
  //      {
  //        labels: [],
  //        series: [],
  //      },
  //      CHART_BAR_OPT
  //    );
  //    const tmpDiff = new Chartist.Bar(
  //      this.refs.tmpDiff,
  //      {
  //        labels: [],
  //        series: [],
  //      },
  //      DIFF_BAR_OPT
  //    );
  //    let promiseChain = Promise.resolve();
  //    JSON.search(snapshot, '//*[@class="QuestionDescriptor"]').forEach(
  //      (question) => {
  //        promiseChain = promiseChain.then(() => {
  //          if (windowHandler.closed) {
  //            throw new Error("Window has been closed, halting");
  //          }
  //          return computeData(question, logId, groups)
  //            .then((data) => {
  //              tmpChart.update(data);
  //              return data;
  //            })
  //            .then(computeDiffs)
  //            .then((data) => tmpDiff.update(data))
  //            .then(() => {
  //              return Promise.all([
  //                inlineSvgStyle(tmpChart.container.firstChild),
  //                inlineSvgStyle(tmpDiff.container.firstChild),
  //              ]);
  //            })
  //            .then(([chart, diff]) => {
  //              const container = document.createElement("div");
  //              const labelQ = question.label;
  //              const label =
  //                JSON.search(
  //                  snapshot,
  //                  `//*[name="${question.name}"]/ancestor::*[@class="ListDescriptor"]`
  //                ).reduce((pre, cur) => `${pre}${translate(cur.label)} → `, "") +
  //                translate(labelQ);
  //              container.setAttribute("style", "white-space:nowrap");
  //              container.innerHTML = `<div>${label}</div>`;
  //              container.appendChild(chart);
  //              container.appendChild(diff);
  //              windowHandler.document.body.appendChild(container);
  //              return;
  //            })
  //            .catch((err) => console.error(err));
  //        });
  //      }
  //    );
  //    promiseChain
  //      .catch((err) => {
  //        console.error(err);
  //      })
  //      .then(() => {
  //        tmpChart.detach();
  //        tmpDiff.detach();
  //      });
  //    return promiseChain;
  //  }