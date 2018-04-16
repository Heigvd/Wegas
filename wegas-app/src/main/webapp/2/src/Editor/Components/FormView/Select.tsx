import * as React from 'react';
import { css } from 'glamor';
import { CommonViewContainer, CommonView } from './commonView';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';

interface Choice {
  value: {};
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  view?: {
    cssClass?: string;
  };
  children?: Choice[];
}
type Choices = (string | Choice)[];
interface ISelectProps extends WidgetProps.BaseProps {
  view: {
    choices: Choices;
  } & CommonView & LabeledView;
}
interface IAsyncSelectProps extends WidgetProps.BaseProps {
  view: {
    choices: (() => Promise<Choices>) | Choices;
  } & CommonView & LabeledView;
}
const selectStyle = css({
  padding: '2px 4px',
  border: '1px solid lightgray',
  minWidth: '5em',
});

function genItems(o: string | Choice) {
  if (typeof o !== 'object') {
    return (
      <option key={`k-${o}`} value={JSON.stringify(o)}>
        {o}
      </option>
    );
  }
  const { label = o.value, value, disabled } = o;
  return (
    <option
      key={`k-${value}`}
      value={JSON.stringify(value)}
      disabled={disabled}
    >
      {label}
    </option>
  );
}

const title: Choice = {
  value: '[[[default]]]',
  label: '- please select -',
  selected: true,
  disabled: true,
};

function SelectView(props: ISelectProps) {
  const onChange = function onChange(
    event: React.ChangeEvent<{ value: string }>,
  ) {
    props.onChange(JSON.parse(event.target.value));
  };
  const choices: (Choice | string)[] = ([title] as (Choice | string)[]).concat(
    props.view.choices || [],
  );
  const menuItems = choices.map(genItems);
  const value = JSON.stringify(props.value) || JSON.stringify(title.value);
  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <>
            {labelNode}
            <div>
              <select
                id={inputId}
                className={`${selectStyle}`}
                value={value}
                onChange={onChange}
              >
                {menuItems}
              </select>
            </div>
          </>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

function Sel(props: IAsyncSelectProps) {
  const { view } = props;
  const { choices } = view;
  return Promise.resolve(
    typeof choices === 'function' ? choices() : choices,
  ).then(ch => <SelectView {...props} view={{ ...view, choices: ch }} />);
}
export default asyncSFC(Sel);
