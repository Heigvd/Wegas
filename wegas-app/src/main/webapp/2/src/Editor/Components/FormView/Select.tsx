import * as React from 'react';
import { css, cx } from 'emotion';
import { CommonViewContainer, CommonView } from './commonView';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { flex, flexColumn } from '../../../css/classes';
import { ListDescriptorChild } from '../../editionConfig';
import { classNameOrEmpty } from '../../../Helper/className';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';
import { inputStyleCSS } from '../../../Components/Inputs/SimpleInput';
import { themeVar } from '../../../Components/Style/ThemeVars';

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
  padding: '2px 30px 2px 4px',
  textAlign: 'center',
  alignItems: 'center',
});

const selectArrowStyle = css({
  select: {
    appearance: "none",
    background: "transparent",
    backgroundImage: "linear-gradient(45deg, transparent 50%, " + themeVar.Common.colors.PrimaryColor +" 50%), linear-gradient(135deg, " + themeVar.Common.colors.PrimaryColor +" 50%, transparent 50%)",
    backgroundSize:"8px 8px, 8px 8px",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "calc(100% - 15px) calc(1em - 5px), calc(100% - 7px) calc(1em - 5px)",
  }
});
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

function genItems(o: string | Choice) {
  if (typeof o !== 'object') {
    return (
      <option key={`k-${o}`} value={o}>
        {o}
      </option>
    );
  }
  const { label = o.value, value, disabled: choiceDisabled } = o;
  const strValue = typeof value === 'string' ? value : JSON.stringify(value);
  return (
    <option key={`k-${value}`} value={strValue} disabled={choiceDisabled}>
      {label}
    </option>
  );
}

interface SelectorProps extends ClassStyleId, DisabledReadonly {
  choices: Choices;
  value: string | number | undefined;
  onChange?: (
    event: React.ChangeEvent<{
      value: string;
    }>,
  ) => void;
}

export function Selector({
  choices,
  id,
  className,
  style,
  value = '',
  onChange,
  readOnly,
  disabled,
}: SelectorProps) {
  const i18nValues = useInternalTranslate(commonTranslations);
  return choices.length > 1 ? (
    <select
      id={id}
      className={selectStyle + classNameOrEmpty(className)}
      style={style}
      value={value}
      onChange={onChange}
      disabled={disabled || readOnly}
    >
      <option value="" disabled hidden>
        - {i18nValues.plzChooseValue} -
      </option>
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
    let parsedValue: string | undefined = event.target.value;
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
    typeof props.value === 'string'
      ? props.value
      : JSON.stringify(props.value) || JSON.stringify(defaultTitle.value);

  return (
    <CommonViewContainer view={props.view} errorMessage={props.errorMessage}>
      <Labeled {...props.view}>
        {({ inputId, labelNode }) => (
          <div className={cx(flex, flexColumn, selectArrowStyle)}>
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
