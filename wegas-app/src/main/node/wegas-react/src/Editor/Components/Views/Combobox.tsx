import * as React from 'react';
import Downshift, { ControllerStateAndHelpers } from 'downshift';
import { css, cx } from '@emotion/css';
import matchSorter, { Options } from 'match-sorter';
import { FontAwesome } from './FontAwesome';
import { Button } from '../../../Components/Inputs/Buttons/Button';

interface ComboboxProps<T> {
  label?: string;
  items: T[];
  clearOnSelect?: boolean;
  openOnFocus?: boolean;
  searchKeys?: Options<T>['keys'];
  itemToValue: (item: T | null) => string;
  itemToMenuItem: (item: T) => React.ReactNode;
  isOpen?: boolean;
  onChange: (item: T | null) => void;
  placeholder?: string;
}
const inline = css({
  backgroundColor: 'white',
  position: 'relative',
});
const highlighted = css({
  boxShadow: '0 0 1px 1px lightblue',
});
const menuStyle = css({
  position: 'absolute',
  zIndex: 1,
  padding: '0.2em',
  boxSizing: 'border-box',
  boxShadow: '0 1px 1px',
  backgroundColor: 'inherit',
  width: '100%',
});
function SelectIcon({ isOpen }: { isOpen: boolean }) {
  return <FontAwesome icon={isOpen ? 'chevron-up' : 'chevron-down'} />;
}
export class Combobox<T> extends React.Component<ComboboxProps<T>> {
  constructor(props: ComboboxProps<T>) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(item: T | null, stateAndHelpers: ControllerStateAndHelpers<T>) {
    if (this.props.clearOnSelect) {
      stateAndHelpers.clearSelection();
    }
    this.props.onChange(item);
  }
  render() {
    return (
      <Downshift
        isOpen={this.props.isOpen}
        itemToString={this.props.itemToValue}
        onChange={this.handleChange}
      >
        {({
          getInputProps,
          getLabelProps,
          isOpen,
          highlightedIndex,
          inputValue,
          getItemProps,
          getToggleButtonProps,
          openMenu,
        }) => {
          return (
            <span className={inline}>
              <label {...getLabelProps()}>{this.props.label}</label>
              <span>
                <input
                  {...getInputProps({
                    placeholder: this.props.placeholder,
                    onFocus: () => this.props.openOnFocus && openMenu(),
                  })}
                />
                <Button {...getToggleButtonProps()}>
                  <SelectIcon isOpen={isOpen} />
                </Button>
              </span>
              {isOpen ? (
                <div className={menuStyle}>
                  {matchSorter(this.props.items, inputValue, {
                    keys: this.props.searchKeys,
                  }).map((i, index) => {
                    return (
                      <div
                        key={index}
                        {...getItemProps({
                          className: cx({
                            [highlighted]: highlightedIndex === index,
                          }),
                          item: i,
                        })}
                      >
                        {this.props.itemToMenuItem(i)}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </span>
          );
        }}
      </Downshift>
    );
  }
}
