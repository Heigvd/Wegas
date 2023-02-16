import * as React from 'react';
import {
  IAbstractEntity,
  IChoiceDescriptor,
  IEvaluationDescriptorContainer,
  IListDescriptor,
  IQuestionDescriptor,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { DropMenu, DropMenuProps } from '../../../Components/DropMenu';
import { entityIs } from '../../../data/entities';
import { getChildren, getClassLabel, getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';

export function makeMenuFromClass(className: IAbstractEntity['@class']) {
  const Label = () => {
    const entity = { '@class': className };
    return (
      <>
        <IconComp icon={withDefault(getIcon(entity), 'question')} />
        {getClassLabel(entity)}
      </>
    );
  };
  return {
    label: <Label />,
    value: className,
  };
}

export function buildMenuItems(
  variable: IAbstractEntity,
): DropMenuItem<IAbstractEntity['@class']>[] {
  return getChildren(variable)
    .map(makeMenuFromClass)
    .filter(
      item =>
        !entityIs(variable, 'ListDescriptor') ||
        variable.allowedTypes.length === 0 ||
        variable.allowedTypes.includes(item.value),
    );
}

export interface AddMenuProps {
  label?: React.ReactNode;
  prefixedLabel?: boolean;
  onSelect?: DropMenuProps<
    string,
    DropMenuItem<IAbstractEntity['@class']>
  >['onSelect'];
  style?: React.CSSProperties;
}

/**
 * handle Add button for List / Question
 */
export const AddMenuParent = ({
  variable,
  label,
  prefixedLabel,
  onSelect,
  style,
}: {
  variable: IListDescriptor | IQuestionDescriptor | IWhQuestionDescriptor;
} & AddMenuProps) => {
  const items = buildMenuItems(variable);
  return (
    <DropMenu
      style={style}
      label={label}
      prefixedLabel={prefixedLabel}
      items={items}
      icon="plus"
      onSelect={onSelect}
    />
  );
};

/**
 * Handle Add button for Choice
 */
export const AddMenuChoice = ({
  variable,
  onSelect,
}: {
  variable: IChoiceDescriptor;
} & AddMenuProps) => {
  const items = buildMenuItems(variable);
  return <DropMenu items={items} icon="plus" onSelect={onSelect} />;
};

/**
 * Handle Add button for Choice
 */
export const AddMenuFeedback = ({
  variable,
  onSelect,
}: {
  variable: IEvaluationDescriptorContainer;
} & AddMenuProps) => {
  const items = buildMenuItems(variable);
  return <DropMenu items={items} icon="plus" onSelect={onSelect} />;
};
