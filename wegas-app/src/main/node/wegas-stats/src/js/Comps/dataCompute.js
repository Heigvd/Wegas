import { getQuestionData } from '../API/neo4j';

function translate(trContent, fallback){
    for (const lang in trContent.translations){
        const tr = trContent.translations[lang];
        if (tr && tr.translation){
            return tr.translation;
        }
    }
    return fallback || '';
}

function genLabel(question) {
    const labels = [];
    if (question) {
        question.items.forEach(function(choice) {
            if (choice.results.length) {
                choice.results.forEach(function(result) {
                    labels.push(translate(choice.label) + translate(result.label));
                });
            } else {
                labels.push(translate(choice.label));
            }
        });
    }
    return labels;
}

function questionSerie(question, questionData) {
    const choices = new Map();
    const serie = [];
    let count = 0;

    question.items.forEach(function(choice) {
        choices.set(choice.name, new Map());
        if (choice.results.length) {
            choice.results.forEach(function(result) {
                choices.get(choice.name).set(result.name, 0);
            });
        } else {
            choices.get(choice.name).set('', 0);
        }
    });


    questionData.forEach(function(questionItem) {
        choices.get(questionItem.choice).set(questionItem.result, (choices.get(questionItem.choice).get(questionItem.result) || 0) + 1);
        count += 1;
    });

    choices.forEach(function(choice) {
        choice.forEach(function(val) {
            serie.push(val / (count ? count : 1) * 100);
        });
    });
    return {
        serie,
        count,
    };
}

function computeData( question, logId, groups ) {
    const data = {
        labels: genLabel(question),
        series: [],
    };
    return Promise.all(groups.map((group, index) => {
        if (group.length) {
            return getQuestionData(logId, question.name, ...group)
                .then(questionData => questionSerie(question, questionData, index));
        }
        return {
            serie: [],
            count: 0,
        };
    }))
        .then(questions => {
            let quest;
            for (quest in questions) {
                if (questions.hasOwnProperty(quest)) {
                    data.series[quest] = {
                        data: questions[quest].serie,
                    };
                }
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
        series: [],
    };
    let item;
    function diff(val, index) {
        return Math.abs(ref[index] - val); // quote DJ : "doit moins avoir" => Abs
    }

    for (item in data.series) {
        if (data.series.hasOwnProperty(item)) {
            newData.series[item] = {
                data: data.series[item].data.map(diff),
            };
        }
    }
    return newData;
}

export { computeData, computeDiffs, translate };
