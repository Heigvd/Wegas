import * as React from 'react';
import { Choices, default as Select } from './Select';
import { WidgetProps } from 'jsoninput/typings/types';
import { LabeledView } from './labeled';
import { CommonView } from './commonView';
import * as VariableDescriptor from '../../../data/selectors/VariableDescriptorSelector';
import * as GameModel from '../../../data/selectors/GameModel';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { entityIs } from '../../../data/entities';
import { IVariableDescriptor } from 'wegas-ts-api';

interface IFlatVariableSelectProps extends WidgetProps.BaseProps {
  view: {
    maxLevel?: number;
    root?: string | string[];
    classFilter?: string | string[];
    selectableLevels: number[];
  } & CommonView &
    LabeledView;
}

function genSpaces(nb: number) {
  let ret = '';
  for (let i = 0; i < nb; i += 1) {
    ret += '\u00a0\u00a0\u00a0'; // 3 whitespaces
  }
  return ret;
}
function genChoices(
  items: (IVariableDescriptor | undefined)[],
  level: number,
  maxLevel: number,
  classFilter: string[],
  selectable?: number[],
): Choices {
  const enableFolder = classFilter.indexOf('ListDescriptor') > -1;
  let ret: Choices = [];
  if (items && level <= maxLevel) {
    items.forEach(i => {
      if (i) {
        if (entityIs(i, 'ListDescriptor')) {
          const newItems = genChoices(
            VariableDescriptor.select(i.itemsIds),
            level + 1,
            maxLevel,
            classFilter,
            selectable,
          );
          if (newItems.length > 0 || enableFolder) {
            ret.push({
              label: genSpaces(level) + editorLabel(i),
              value: i.name!,
              /*children: newItems,*/
              disabled:
                !enableFolder ||
                (selectable && selectable.indexOf(level) === -1),
            });
            ret = ret.concat(newItems);
          }
        } else if (
          !classFilter.length ||
          classFilter.indexOf(i['@class']!) !== -1
        ) {
          ret.push({
            label: genSpaces(level) + editorLabel(i),
            value: i.name!,
            disabled: selectable && selectable.indexOf(level) === -1,
          });
        }
      }
    });
  }
  return ret;
}

function FlatVariableSelect(props: IFlatVariableSelectProps) {
  const { maxLevel, root, classFilter, selectableLevels, ...restView } =
    props.view;

  const filter: string[] = classFilter
    ? Array.isArray(classFilter)
      ? classFilter
      : [classFilter]
    : [];
  let items: any[];
  if (root) {
    if (!Array.isArray(root)) {
      items = [VariableDescriptor.first('name', root)];
    } else {
      items = root.map(name => [VariableDescriptor.first('name', name)]);
    }
  } else {
    items = VariableDescriptor.select(GameModel.selectCurrent().itemsIds);
  }

  const choices = genChoices(
    items,
    0,
    maxLevel || Infinity,
    filter,
    selectableLevels,
  );

  return <Select {...props} view={{ ...restView, choices }} />;
}

export default FlatVariableSelect;
