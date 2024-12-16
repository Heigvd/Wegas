import { css } from '@emotion/css';
import * as React from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { classNameOrEmpty } from '../Helper/className';
import { componentsTranslations } from '../i18n/components/components';
import { useInternalTranslate } from '../i18n/internalTranslator';
import { inputStyleCSS } from './Inputs/SimpleInput';
import { themeVar } from './Theme/ThemeVars';

export interface Choice {
  value?: unknown;
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
  background: 'none',
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
  value: string | undefined;
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

function findOption(
  options: Options,
  value: string | undefined,
): Option | undefined {
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
    return { ...provided, zIndex: 2, marginTop: 0 };
  },
  menuList: provided => {
    return {
      ...provided,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: '4px',
    };
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
  placeholder: (provided) => {
    return {
      ...provided,
      color: themeVar.colors.DarkTextColor,
      opacity: '0.3',
    }
  }
};

// interface SelectorProps extends ClassStyleId, DisabledReadonly {
//   choices: Choices;
//   value: string | undefined;
//   onChange?: (value: string | undefined) => void;
//   allowUndefined?: boolean;
//   allowAnyValue?: boolean;
// }

interface SelectorProps<
  T extends true | false,
  R = T extends true ? string | undefined : string,
> extends ClassStyleId,
    DisabledReadonly {
  choices: Choices;
  value: string | undefined;
  placeholder?: string | undefined;
  noOptionsMessage?: string | undefined;
  onChange?: (value: R) => void;
  allowUndefined?: T;
  allowAnyValue?: boolean;
  clearable?: boolean;
}

export function Selector<T extends true | false>({
  choices,
  id,
  className,
  /*style,*/
  value,
  placeholder,
  noOptionsMessage,
  onChange,
  allowUndefined,
  clearable,
  allowAnyValue = false,
  readOnly,
  disabled,
}: SelectorProps<T>): JSX.Element {
  const i18nValues = useInternalTranslate(componentsTranslations).select;

  const options = buildOptions(choices);

  const onChangeCb = React.useCallback(
    (option: { value: string } | null) => {
      if (onChange) {
        const value = (option?.value ||
          (allowUndefined ? undefined : '')) as T extends true
          ? string | undefined
          : string;

        onChange(value);
      }
    },
    [allowUndefined, onChange],
  );

  const currentOption = findOption(options, value) || { label: value, value };

  const Comp = React.useMemo(
    () => (allowAnyValue ? CreatableSelect : Select),
    [allowAnyValue],
  ) as typeof Select;

  return (
    <Comp
      id={id}
      isDisabled={readOnly || disabled}
      className={selectStyle + classNameOrEmpty(className)}
      classNamePrefix={'wegas-select'}
      isClearable={clearable}
      options={options}
      placeholder={placeholder ?? i18nValues.plzChooseValue}
      noOptionsMessage={() => noOptionsMessage ?? i18nValues.noChoiceInfo}
      // Providing an empty object overrides the placeholder
      value={currentOption.value?.length === 0 ? null : currentOption}
      onChange={onChangeCb}
      styles={selectStyles}
      menuPosition="fixed"
    />
  );
}
