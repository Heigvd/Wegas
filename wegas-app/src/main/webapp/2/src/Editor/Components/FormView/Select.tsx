import * as React from 'react';
import { css, cx } from 'emotion';
import { CommonViewContainer, CommonView } from './commonView';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { flex, flexColumn } from '../../../css/classes';
import { ListDescriptorChild } from '../../editionConfig';
import { inputStyleCSS } from '../../../Components/Inputs/inputStyles';
import { classNameOrEmpty } from '../../../Helper/className';

export interface Choice {
  value?: {};
  label?: string;
  disabled?: boolean;
  selected?: boolean;
  view?: {
    cssClass?: string;
  };
  children?: Choice[];
}
export type Choices = (string | Choice)[];
interface ISelectProps extends WidgetProps.BaseProps {
  view: {
    choices: Choices;
    undefined?: boolean;
  } & CommonView &
    LabeledView;
}
export interface IAsyncSelectProps extends WidgetProps.BaseProps {
  view: {
    choices: (() => Promise<Choices>) | Choices;
    undefined?: boolean;
    openChoices?: boolean;
  } & CommonView &
    LabeledView;
}
const selectStyle = css({
  ...inputStyleCSS,
  // display: 'inline-block',
  padding: '2px 4px',
  // border: '1px solid lightgray',
  // backgroundColor: 'lightgray',
  textAlign: 'center',
  alignItems: 'center',
});

function genItems(o: string | Choice) {
  if (typeof o !== 'object') {
    return (
      <option
        key={`k-${o}`}
        value={typeof o === 'string' ? o : JSON.stringify(o)}
      >
        {o}
      </option>
    );
  }
  const { label = o.value, value, disabled } = o;
  return (
    <option
      key={`k-${value}`}
      value={typeof value === 'string' ? value : JSON.stringify(value)}
      disabled={disabled}
    >
      {label}
    </option>
  );
}

const defaultTitle: Choice = {
  value: '[[[default]]]',
  label: '- please select -',
  selected: true,
  disabled: true,
};

const undefinedTitle: Choice = {
  value: undefined,
  label: '- undefined -',
  selected: true,
  disabled: false,
};

interface SelectorProps extends ClassStyleId {
  choices: Choices;
  value: string;
  onChange?: (
    event: React.ChangeEvent<{
      value: string;
    }>,
  ) => void;
  readOnly?: boolean;
}

export function Selector({
  choices,
  id,
  className,
  style,
  value,
  onChange,
  readOnly,
}: SelectorProps) {
  return choices.length > 1 ? (
    <select
      id={id}
      className={selectStyle + classNameOrEmpty(className)}
      style={style}
      value={value}
      onChange={onChange}
      disabled={readOnly}
    >
      {choices.map(genItems)}
    </select>
  ) : choices.length === 1 ? (
    <span className={selectStyle + classNameOrEmpty(className)} style={style}>
      {'string' === typeof choices[0]
        ? choices[0]
        : (choices[0] as Choice).label}
    </span>
  ) : (
    <span className={selectStyle + classNameOrEmpty(className)} style={style}>
      {value}
    </span>
  );
}

export function SearchableSelector() {
  return <span>To implement</span>;
}

function SelectView(props: ISelectProps) {
  const onChange = function onChange(
    event: React.ChangeEvent<{ value: string }>,
  ) {
    let parsedValue = undefined;
    try {
      parsedValue = JSON.parse(event.target.value);
    } finally {
      props.onChange(parsedValue);
    }
  };
  const selectChoices = [
    ...(props.view.undefined ? [undefinedTitle] : []),
    ...props.view.choices,
  ];
  const choices =
    props.value != undefined || props.view.undefined
      ? selectChoices.some(c => {
          if ('string' === typeof c) {
            return props.value === c;
          }
          return props.value === c.value;
        })
        ? selectChoices
        : [
            {
              label: props.value,
              value: props.value,
              disabled: true,
            } as Choice | string,
          ].concat(selectChoices)
      : ([defaultTitle] as (Choice | string)[]).concat(selectChoices || []);

  const value =
    JSON.stringify(props.value) || JSON.stringify(defaultTitle.value);
  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <div className={cx(flex, flexColumn)}>
            {labelNode}
            <Selector
              id={inputId}
              value={value}
              choices={choices}
              onChange={onChange}
              readOnly={props.view.readOnly}
            />
          </div>
        )}
      </Labeled>
    </CommonViewContainer>
  );
}

interface ListChildrenSelectViewProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
}

export function ListChildrenSelectView(props: ListChildrenSelectViewProps) {
  return (
    <SelectView
      {...props}
      view={{
        ...props.view,
        choices: [...((ListDescriptorChild as unknown) as string[])],
      }}
    />
  );
}

export function ListChildrenNullSelectView(props: ListChildrenSelectViewProps) {
  return (
    <SelectView
      {...props}
      view={{
        ...props.view,
        choices: [
          { label: 'None', value: '' },
          ...((ListDescriptorChild as unknown) as string[]),
        ],
      }}
    />
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
