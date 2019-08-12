import * as React from 'react';
import PropTypes from 'prop-types';
import Chartist from 'chartist';
import 'chartist/dist/chartist.min.css';
import { computeData, computeDiffs, translate } from './dataCompute';
import '../../css/chartist.css';

const CHART_BAR_OPT = {
    width: 600,
    height: 400,
    axisY: {
        labelInterpolationFnc: function label(value) {
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
const inlineStyle = {
    display: 'inline-block',
    whiteSpace: 'normal',
};
const noWrap = {
    whiteSpace: 'nowrap',
};
const legendStyle = {
    marginRight: 20,
    padding: '3px 10px',
};
const noDisplay = {
    display: 'none',
};
function inlineSvgStyle(node) {
    const tw = document.createTreeWalker(node, 1);
    let currentNode = tw.nextNode();
    while (currentNode) {
        currentNode.setAttribute(
            'style',
            getComputedStyle(currentNode).cssText
            );
        currentNode = tw.nextNode();
    }
    return node;
}

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
class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            questionGroup: {},
        };
    }

    componentDidMount() {
        this.chart = new Chartist.Bar(
            this.refs.graph,
            {
                labels: [],
                series: [],
            },
            CHART_BAR_OPT
            );
        this.diffChart = new Chartist.Bar(
            this.refs.diffs,
            {
                labels: [],
                series: [],
            },
            DIFF_BAR_OPT
            );
    }
    componentDidUpdate() {
        if (!this.props.questionName) {
            return;
        }
        const question = JSON.search(this.props.snapshot, `//*[@class='QuestionDescriptor'][name='${this.props.questionName}']`)[0];
        computeData(question, this.props.logId, this.props.groups)
            .then(data => {
                this.chart.update(data);
                return data;
            })
            .then(computeDiffs)
            .then(data => this.diffChart.update(data));
    }
    componentWillUnmount() {
        this.chart.detach();
        this.diffChart.detach();
    }

    genAll() {
        const windowHandler = window.open();
        const {groups, snapshot, logId} = this.props;
        const tmpChart = new Chartist.Bar(
            this.refs.tmpChart,
            {
                labels: [],
                series: [],
            },
            CHART_BAR_OPT
            );
        const tmpDiff = new Chartist.Bar(
            this.refs.tmpDiff,
            {
                labels: [],
                series: [],
            },
            DIFF_BAR_OPT
            );
        let promiseChain = Promise.resolve();
        JSON.search(snapshot, '//*[@class="QuestionDescriptor"]').forEach(
            question => {
                promiseChain = promiseChain.then(() => {
                    if (windowHandler.closed) {
                        throw new Error('Window has been closed, halting');
                    }
                    return computeData(question, logId, groups)
                        .then(data => {
                            tmpChart.update(data);
                            return data;
                        })
                        .then(computeDiffs)
                        .then(data => tmpDiff.update(data))
                        .then(() => {
                            return Promise.all([
                                inlineSvgStyle(tmpChart.container.firstChild),
                                inlineSvgStyle(tmpDiff.container.firstChild),
                            ]);
                        })
                        .then(([chart, diff]) => {
                            const container = document.createElement('div');
                            const labelQ = question.label;
                            const label =
                                JSON.search(
                                    snapshot,
                                    `//*[name="${question.name}"]/ancestor::*[@class="ListDescriptor"]`
                                    ).reduce(
                                (pre, cur) =>
                                `${pre}${
                                    translate(cur.label)
                                    } → `,
                                ''
                                ) +
                                translate(labelQ);
                            container.setAttribute(
                                'style',
                                'white-space:nowrap'
                                );
                            container.innerHTML = `<div>${label}</div>`;
                            container.appendChild(chart);
                            container.appendChild(diff);
                            windowHandler.document.body.appendChild(container);
                            return;
                        })
                        .catch(err => console.error(err));
                });
            }
        );
        promiseChain
            .catch(err => {
                console.error(err);
            })
            .then(() => {
                tmpChart.detach();
                tmpDiff.detach();
            });
        return promiseChain;
    }

    render() {
        const legends = this.props.groups.map((val, index) => (
                <span
                    className={`color ct-series-${String.fromCharCode(97 + index)}`}
                    key={index}
                    style={legendStyle}
                    >{`Group ${index + 1}`}</span>
                ));
        return (
            <div ref="box">
                <span className="legend">{legends}</span>
                <div style={noWrap}>
                    <div ref="graph" style={inlineStyle} />
                    <div ref="diffs" style={inlineStyle} />
                </div>
                <div ref="tmpChart" style={noDisplay} />
                <div ref="tmpDiff" style={noDisplay} />
            </div>
            );
    }
}
Graph.propTypes = {
    groups: PropTypes.arrayOf(PropTypes.array),
    questionName: PropTypes.string,
};
Graph.defaultProps = {
    groups: [],
};
export default Graph;
