import * as React from 'react';
import produce from 'immer';
import { Actions } from '../../../data';
import { getIcon, getLabel, getChildren } from '../../editionConfig';
import { StoreDispatch } from '../../../data/store';
import { Menu, MenuProps } from '../../../Components/Menu';
import { FontAwesome, withDefault } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';

export interface MenuItem {
  label: JSX.Element;
  value: string;
}
function buildMenuItems(variable: IAbstractEntity) {
  return getChildren(variable).then(children => {
    return children.map(i => {
      const Label = asyncSFC(async () => {
        const entity = { '@class': i };
        const [icon, label = ''] = await Promise.all([
          getIcon(entity),
          getLabel(entity),
        ]);
        return (
          <>
            <FontAwesome icon={withDefault(icon, 'question')} fixedWidth />
            {label}
          </>
        );
      });
      return {
        label: <Label />,
        value: i,
      };
    });
  });
}
/**
 * handle Add button for List / Question
 */
export const AddMenuParent = asyncSFC(
  async ({
    variable,
    dispatch,
    onSelect,
  }: {
    variable: IListDescriptor | IQuestionDescriptor;
    dispatch?: StoreDispatch;
    onSelect: MenuProps<MenuItem>['onSelect'];
  }) => {
    const items = await buildMenuItems(variable);
    return (
      <Menu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          dispatch &&
            dispatch(Actions.EditorActions.createVariable(i.value, variable));
        }}
      />
    );
  },
);
/**
 * Handle Add button for Choice
 */
export const AddMenuChoice = asyncSFC(
  async ({
    variable,
    dispatch,
    onSelect,
  }: {
    variable: IChoiceDescriptor;
    dispatch?: StoreDispatch;
    onSelect?: MenuProps<MenuItem>['onSelect'];
  }) => {
    const items = await buildMenuItems(variable);
    return (
      <Menu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          dispatch &&
            dispatch(
              Actions.EditorActions.createVariable(i.value, variable, {
                save: (entity: IResult) => {
                  const newChoice = produce(variable, v => {
                    v.results.push(entity);
                  });
                  const index = newChoice.results.length - 1;
                  dispatch(
                    Actions.VariableDescriptorActions.updateDescriptor(
                      newChoice,
                    ),
                  ).then(() =>
                    dispatch(
                      Actions.EditorActions.editVariable(newChoice, [
                        'results',
                        String(index),
                      ]),
                    ),
                  );
                },
              }),
            );
        }}
      />
    );
  },
);
