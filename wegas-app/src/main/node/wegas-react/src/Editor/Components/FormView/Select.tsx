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
import { themeVar } from '../../../Components/Theme/ThemeVars';
import Select from 'react-select';

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
export const selectStyle = css({
  ...inputStyleCSS,
  padding: '2px 30px 2px 4px',
  alignItems: 'center',
});

export const selectArrowStyle = css({
  select: {
    appearance: 'none',
    background: 'transparent',
    backgroundImage:
      'linear-gradient(45deg, transparent 50%, ' +
      themeVar.colors.PrimaryColor +
      ' 50%), linear-gradient(135deg, ' +
      themeVar.colors.PrimaryColor +
      ' 50%, transparent 50%)',
    backgroundSize: '6px 6px, 6px 6px',
    backgroundRepeat: 'no-repeat',
    backgroundPosition:
      'calc(100% - 14px) calc(1em - 5px), calc(100% - 8px) calc(1em - 5px)',
  },
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

interface SelectorProps extends ClassStyleId, DisabledReadonly {
  choices: Choices;
  value: string | undefined;
  onChange?: (value: string) => void;
  allowUndefined?: boolean;
}

interface Option {
  value: string;
  label: string;
}

type Options = Option[];


function buildOption(choice: string | Choice): Option {
  if (typeof choice === 'string') {
    return { value: choice, label: choice };
  } else {
    const strValue = typeof choice.value === 'string' ? choice.value : JSON.stringify(choice.value);
    return { value: strValue, label: choice.label || strValue };
  }
}

function buildOptions(choices: Choices): Options {
  return choices.map(choice => buildOption(choice));
}

function findOption(options: Options, value: string): Option | undefined {
  return options.find(opt => opt.value === value);
}

export function Selector({
  choices,
  id,
  className,
  style,
  value = '',
  onChange,
  allowUndefined = false,
  readOnly,
  disabled,
}: SelectorProps): JSX.Element {
  const i18nValues = useInternalTranslate(commonTranslations);
  const placeholder = i18nValues.plzChooseValue;

  const options = buildOptions(choices);

  const onChangeCb = React.useCallback(
    (option: { value: string } | null) => {
      if (onChange) {
        onChange(option?.value || '');
      }
    },
    [onChange],
  );

  const currentOption = findOption(options, value);

  if (!readOnly && !disabled) {
    return (
      <Select
        id={ id }
        className={ selectStyle + classNameOrEmpty(className) }
        isClearable={ allowUndefined }
        options={ options }
        placeholder={placeholder}
        value={ currentOption }
        onChange={ onChangeCb }
        styles={ {
          control: (provided, state) => {
            return {
              ...provided,
              border: `2px solid ${ state.isFocused
                ? themeVar.colors.ActiveColor
                : themeVar.colors.PrimaryColor
                }`,
              borderRadius: themeVar.dimensions.BorderRadius,
              backgroundColor: themeVar.colors.BackgroundColor,
              ':hover': {
                border: '2px solid ' + themeVar.colors.PrimaryColor,
              },
              boxShadow: 'unset',
            };
          },
          option: (provided, state) => {
            if (state.isFocused) {
              return {
                ...provided,
                backgroundColor: themeVar.colors.HoverColor,
                color: themeVar.colors.PrimaryColorShade,
              };
            } else if (state.isSelected) {
              return {
                ...provided,
                backgroundColor: themeVar.colors.PrimaryColor,
                color: themeVar.colors.BackgroundColor,
              };
            } else {
              return { ...provided };
            }
          },
        } }
      />

    );
  } else {
    return (
      <span className={ selectStyle + classNameOrEmpty(className) } style={ style }>
        { value }
      </span>
    );
  }
}

export function SearchableSelector() {
  return <span>To implement</span>;
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
  const selectChoices: Choices = [
    ...(props.view.undefined ? [undefinedTitle] : []),
    ...props.view.choices,
  ];
  // const choices =
  //   props.value != undefined || props.view.undefined
  //     ? selectChoices.some(c => {
  //         if ('string' === typeof c) {
  //           return props.value === c;
  //         }
  //         return props.value === c.value;
  //       })
  //       ? selectChoices
  //       : [
  //           {
  //             label: props.value,
  //             value: props.value,
  //             disabled: true,
  //           } as Choice | string,
  //         ].concat(selectChoices)
  //     : ([defaultTitle] as (Choice | string)[]).concat(selectChoices || []);

  const value =
    typeof props.value === 'string'
      ? props.value
      : JSON.stringify(props.value) || JSON.stringify(defaultTitle.value);

  return (
    <CommonViewContainer view={ props.view } errorMessage={ props.errorMessage }>
      <Labeled { ...props.view }>
        { ({ inputId, labelNode }) => (
          <div className={ cx(flex, flexColumn, selectArrowStyle) }>
            { labelNode }
            <Selector
              id={ inputId }
              value={ value }
              choices={ selectChoices }
              onChange={ onChange }
              readOnly={ props.view.readOnly }
            />
          </div>
        ) }
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
      { ...props }
      view={ {
        ...props.view,
        choices: [...(ListDescriptorChild as unknown as string[])],
      } }
    />
  );
}

export function ListChildrenNullSelectView(props: ListChildrenSelectViewProps) {
  return (
    <SelectView
      { ...props }
      view={ {
        ...props.view,
        choices: [
          { label: 'None', value: '' },
          ...(ListDescriptorChild as unknown as string[]),
        ],
      } }
    />
  );
}

function Sel(props: IAsyncSelectProps) {
  const { view } = props;
  const { choices } = view;
  return Promise.resolve(
    typeof choices === 'function' ? choices() : choices,
  ).then(ch => <SelectView { ...props } view={ { ...view, choices: ch } } />);
}
export default asyncSFC(Sel);
