import * as React from 'react';
import ReactSelect from 'react-select';
import {shallowEqual, useAppSelector} from '../Store/hooks';
import {translate} from './dataCompute';
import {IVariableDescriptor} from 'wegas-ts-api';
import {entityIs, WithItems} from '../API/wegas';

interface QuestionSelectProps {
  onSelect: (questionName: string | null) => void;
  value: string | null;
}
const pleaseSelect = {
  label:'-- select --',
  value: null,
}

export default function QuestionSelect({onSelect}: QuestionSelectProps): JSX.Element {
  const questionDescriptors = useAppSelector(state => {

    const result: IVariableDescriptor[][] = [];

    function processChildren(ancestor: IVariableDescriptor[], children: IVariableDescriptor[]) {
      for (const child of children) {
        if (entityIs(child, 'QuestionDescriptor')) {
          result.push([...ancestor, child]);
        } else if (entityIs(child, 'ListDescriptor')) {
          processChildren([...ancestor, child], (child as unknown as WithItems).items)
        }
      }
    }

    processChildren([], state.variables.variables);

    return result;

  }, shallowEqual);

  const options = questionDescriptors.map(list => {
    const q = list[list.length - 1];
    return {
      label: list.map(item => translate(item.label, item.name!)).join(" \u2192 "),
      value: q.name
    };
  })

  const style = {
    display: 'inline-block',
    minWidth: '60em',
  };
  return (
    <div style={style}>
      <ReactSelect
        options={[pleaseSelect, ...options]}
        onChange={v => onSelect(v?.value || null)}
      />
    </div>
  );
}
