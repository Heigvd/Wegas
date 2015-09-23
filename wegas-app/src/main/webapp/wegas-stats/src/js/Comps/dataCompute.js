import { getQuestionData } from '../API/neo4j';

function genLabel(questionName, snapshot) {
    const question = JSON.search(snapshot, `//*[@class='QuestionDescriptor'][name='${questionName}']`)[0];
    const labels = [];
    if (question) {
        question.items.forEach(function(i) {
            if (i.results.length) {
                i.results.forEach(function(r) {
                    labels.push(JSON.search(snapshot, `//*[name="${i.name}"]`)[0].label +
                        (r.label ? ` (${r.label})` : ''));
                });
            } else {
                labels.push(JSON.search(snapshot, `//*[name="${i.name}"]`)[0].label);
            }
        });
    }
    return labels;
}
function questionSerie(questionName, questionData, snapshot) {
    const question = JSON.search(snapshot, `//*[@class='QuestionDescriptor'][name='${questionName}']`)[0];
    const choices = new Map();
    const serie = [];
    let count = 0;

    question.items.forEach(function(i) {
        choices.set(i.name, new Map());
        if (i.results.length) {
            i.results.forEach(function(r) {
                choices.get(i.name).set(r.label, 0);
            });
        } else {
            choices.get(i.name).set('', 0);
        }
    });


    questionData.forEach(function(i) {
        choices.get(i.choice).set(i.result, choices.get(i.choice).get(i.result) + 1);
        count += 1;
    });

    choices.forEach(function(v) {
        v.forEach(function(val) {
            serie.push(val / (count ? count : 1) * 100);
        });
    });
    return {
        serie,
        count
    };
}
function computeData({question, snapshot, logId, groups}) {
    const data = {
        labels: genLabel(question, snapshot),
        series: []
    };
    return Promise.all(groups.map((g, index) => {
        if (g.length) {
            return getQuestionData(logId, question, ...g)
                .then(data => questionSerie(question, data, snapshot, index));
        } else {
            return {
                serie: [],
                count: 0
            };
        }
    }))
        .then(questions => {
            for (let q in questions) {
                data.series[q] = {
                    data: questions[q].serie
                };
            }
            return data;
        })
        .catch(err => {
            console.error(err);
        });
}
function computeDiffs(data) {
    const ref = data.series[0].data;
    const newData = {
        labels: data.labels,
        series: []
    };
    for (let i in data.series) {
        newData.series[i] = {
            data: data.series[i].data.map((val, index) => ref[index] - val) //quote DJ : "doit moins avoir"
        };
    }
    return newData;

}
export { computeData, computeDiffs };
