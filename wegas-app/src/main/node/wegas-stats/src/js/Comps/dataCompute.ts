import {IQuestionDescriptor, ITranslatableContent} from 'wegas-ts-api';
import {getQuestionData, QuestionData} from '../API/neo4j';
import {entityIs, WithItems} from '../API/wegas';
import {GameOption} from './GameSelect';

export function translate(trContent: ITranslatableContent, fallback?: string): string {
  for (const lang in trContent.translations) {
    const tr = trContent.translations[lang];
    if (tr && tr.translation) {
      return tr.translation;
    }
  }
  return fallback || '';
}

export function genLabel(question?: IQuestionDescriptor): string[] {
  const labels: string[] = [];
  if (question) {
    const list = question as unknown as WithItems;
    list.items.forEach(function (child) {
      if (entityIs(child, "ChoiceDescriptor")) {
        if (child.results.length) {
          child.results.forEach(function (result) {
            labels.push(translate(child.label) + translate(result.label));
          });
        } else {
          labels.push(translate(child.label));
        }
      }
    });
  }
  return labels;
}

interface Series {
  serie: number[];
  count: number;
}

function questionSerie(question: IQuestionDescriptor, questionData: QuestionData[]): Series {
  const choices: Map<string, Map<string, number>> = new Map();
  const serie: number[] = [];
  const list = question as unknown as WithItems;

  let count = 0;

  list.items.forEach(function (choice) {
    const map = new Map<string, number>();
    choices.set(choice.name!, map);

    if (entityIs(choice, "ChoiceDescriptor")) {
      if (choice.results.length) {
        choice.results.forEach(function (result) {
          map.set(result.name!, 0);
        });
      } else {
        map.set('', 0);
      }
    }
  });


  questionData.forEach(function (questionItem) {
    const entry = choices.get(questionItem.choice);
    if (entry != null) {
      const r = entry.get(questionItem.result);
      if (r != null) {
        entry.set(questionItem.result, r + 1);
      } else {
        entry.set(questionItem.result, 1);
      }
    } else {
      // eslint-disable-next-line no-console
      console.error("Choice not found");
    }
    count += 1;
  });

  choices.forEach(function (choice) {
    choice.forEach(function (val) {
      serie.push(val / (count ? count : 1) * 100);
    });
  });
  return {
    serie,
    count,
  };
}

export interface ComputedData {
  labels: string[];
  series: Record<string, {data: number[]}>;
}

export async function computeData(question: IQuestionDescriptor, logId: string, groups: GameOption[][]): Promise<ComputedData> {
  const data: ComputedData = {
    labels: genLabel(question),
    series: {}
  };

  const series = await Promise.all(groups.map(async (group) => {
    if (group.length) {
      const questionData = await getQuestionData(logId, question.name!, ...group)
      return questionSerie(question, questionData);
    }
    return {
      serie: [],
      count: 0,
    };
  }));

  for (const quest in series) {
    const question = series[quest];
    if (question != null) {
      data.series[quest] = {
        data: question.serie,
      };
    }
  }

  return data;
}

export function computeDiffs(data: ComputedData) {
  const ref = data.series[0].data;
  const newData: ComputedData = {
    labels: data.labels,
    series: {},
  };
  let item;
  function diff(val: number, index: number) {
    return Math.abs(ref[index] - val); // quote DJ : "doit moins avoir" => Abs
  }

  for (item in data.series) {
    newData.series[item] = {
      data: data.series[item].data.map(diff),
    };
  }
  return newData;
}