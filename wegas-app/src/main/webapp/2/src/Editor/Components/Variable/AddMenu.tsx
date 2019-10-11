import * as React from 'react';
import produce from 'immer';
import { Actions } from '../../../data';
import { getIcon, getLabel, getChildren } from '../../editionConfig';
import { StoreDispatch, getDispatch } from '../../../data/store';
import { Menu, MenuProps } from '../../../Components/Menu';
import { FontAwesome, withDefault } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';

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

interface AddMenuProps {
  localDispatch?: StoreDispatch;
  onSelect?: MenuProps<{
    label: JSX.Element;
    value: string;
  }>['onSelect'];
  focusTab?: (tab: string) => void;
}

/**
 * handle Add button for List / Question
 */
export const AddMenuParent = asyncSFC(
  async ({
    variable,
    localDispatch,
    onSelect,
    focusTab,
  }: {
    variable: IListDescriptor | IQuestionDescriptor;
  } & AddMenuProps) => {
    const items = await buildMenuItems(variable);
    return (
      <Menu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          let dispatch = getDispatch() as StoreDispatch;
          if (e.ctrlKey && localDispatch) {
            dispatch = localDispatch;
          } else {
            focusTab && focusTab('Editor');
          }
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
    localDispatch,
    onSelect,
    focusTab,
  }: {
    variable: IChoiceDescriptor;
  } & AddMenuProps) => {
    const items = await buildMenuItems(variable);
    return (
      <Menu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          const globalDispatch = getDispatch() as StoreDispatch;
          let dispatch = globalDispatch;
          if (e.ctrlKey && localDispatch) {
            dispatch = localDispatch;
          } else {
            focusTab && focusTab('Editor');
          }

          dispatch(
            Actions.EditorActions.createVariable(i.value, variable, {
              save: (entity: IResult) => {
                const newChoice = produce(variable, v => {
                  v.results.push(entity);
                });
                const index = newChoice.results.length - 1;
                globalDispatch(
                  Actions.VariableDescriptorActions.updateDescriptor(newChoice),
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
