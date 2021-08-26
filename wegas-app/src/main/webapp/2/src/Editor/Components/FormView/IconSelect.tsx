import * as React from 'react';
import Select from './Select';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView } from './labeled';
import { CommonView } from './commonView';

import { icons } from '../../../Editor/Components/Views/FontAwesome';

interface IIconSelectProps extends WidgetProps.BaseProps {
  view: {} & CommonView & LabeledView;
}

function IconSelect(props: IIconSelectProps) {
  const { ...restView } = props.view;

  const choices = Object.keys(icons);

  return <Select {...props} view={{ ...restView, choices }} />;
}

export default IconSelect;
