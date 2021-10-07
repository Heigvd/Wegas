import { css } from '@emotion/css';
import * as React from 'react';
import Select from 'react-select';
import { classNameOrEmpty } from '../Helper/className';
import { commonTranslations } from '../i18n/common/common';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { inputStyleCSS } from './Inputs/SimpleInput';
import { themeVar } from './Theme/ThemeVars';

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

const selectStyle = css({
  ...inputStyleCSS,
  alignItems: 'center',
  border: 'none',
  borderRadius: 'unset',
  ':hover': {
    border: 'none',
  },
  minWidth: '100px',
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

type SelectProps = React.ComponentProps<typeof Select>;

interface Option {
  value: string;
  label: string;
  color?: string;
  isDisabled?: boolean;
  isFixed?: boolean;
}

type Options = Option[];

function buildOption(choice: string | Choice): Option {
  if (typeof choice === 'string') {
    return { value: choice, label: choice };
  } else {
    const strValue =
      typeof choice.value === 'string'
        ? choice.value
        : JSON.stringify(choice.value);
    return {
      value: strValue,
      label: choice.label || strValue,
      isDisabled: choice.disabled,
    };
  }
}

function buildOptions(choices: Choices): Options {
  return choices.map(choice => buildOption(choice));
}

function findOption(options: Options, value: string): Option | undefined {
  return options.find(opt => opt.value === value);
}

export const selectStyles: SelectProps['styles'] = {
  control: (provided, state) => {
    return {
      ...provided,
      border: `1px solid ${
        state.isFocused
          ? themeVar.colors.PrimaryColor
          : themeVar.colors.DisabledColor
      }`,
      borderRadius: themeVar.dimensions.BorderRadius,
      backgroundColor: themeVar.colors.BackgroundColor,
      ':hover': {
        border: '1px solid ' + themeVar.colors.PrimaryColor,
      },
      boxShadow: 'unset',
    };
  },
  menu: provided => {
    // the zIndex battle : Select VS tineMCE toolbar
    return { ...provided, zIndex: 2 };
  },
  option: (provided, state) => {
    if (state.isSelected) {
      return {
        ...provided,
        backgroundColor: themeVar.colors.PrimaryColor,
        color: themeVar.colors.LightTextColor,
      };
    } else if (state.isFocused) {
      return {
        ...provided,
        backgroundColor: themeVar.colors.HoverColor,
        color: themeVar.colors.DarkTextColor,
      };
    } else {
      return { ...provided };
    }
  },
};

interface SelectorProps extends ClassStyleId, DisabledReadonly {
  choices: Choices;
  value: string | undefined;
  onChange?: (value: string) => void;
  allowUndefined?: boolean;
}

export function Selector({
  choices,
  id,
  className,
  /*style,*/
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

  return (
    <Select
      id={id}
      isDisabled={readOnly || disabled}
      className={selectStyle + classNameOrEmpty(className)}
      isClearable={allowUndefined}
      options={options}
      placeholder={placeholder}
      value={currentOption}
      onChange={onChangeCb}
      styles={selectStyles}
    />
  );
}
