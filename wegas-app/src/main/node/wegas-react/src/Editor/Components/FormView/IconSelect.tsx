import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import { icons } from '../../../Editor/Components/Views/FontAwesome';
import { CommonView } from './commonView';
import { LabeledView } from './labeled';
import Select from './Select';

interface IIconSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
}

function IconSelect(props: IIconSelectProps) {
  const { ...restView } = props.view;

  const choices = Object.keys(icons);

  return <Select {...props} view={{ ...restView, choices }} />;
}

export default IconSelect;
