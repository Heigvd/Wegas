import { cx } from '@emotion/css';
import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { Choice, Choices, Selector } from '../../../Components/Selector';
import { flex, flexColumn } from '../../../css/classes';
import { ListDescriptorChild } from '../../editionConfig';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

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

function SelectView(props: ISelectProps) {
  const onChange = (value: string) => {
    let parsedValue: string | undefined = value;
    try {
      parsedValue = JSON.parse(parsedValue);
    } catch (_e) {
      parsedValue =
        typeof parsedValue === 'string' ||
        typeof parsedValue === 'number' ||
        typeof parsedValue === 'boolean'
          ? String(parsedValue)
          : undefined;
    } finally {
      props.onChange(parsedValue);
    }
  };

  const undefinedTitle: Choice = {
    value: undefined,
    label: '- undefined -',
    selected: true,
    disabled: true,
  };

  const selectChoices: Choices = [
    ...(props.view.undefined ? [undefinedTitle] : []),
    ...props.view.choices,
  ];

  const defaultTitle: Choice = {
    value: '[[[default]]]',
    label: '- please select -',
    selected: true,
    disabled: true,
  };

  const value =
    typeof props.value === 'string'
      ? props.value
      : JSON.stringify(props.value) || JSON.stringify(defaultTitle.value);

  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <div className={cx(flex, flexColumn)}>
            {labelNode}
            <Selector
              id={inputId}
              value={value}
              choices={selectChoices}
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
        choices: [...(ListDescriptorChild as unknown as string[])],
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
          ...(ListDescriptorChild as unknown as string[]),
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
