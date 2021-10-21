import produce from 'immer';
import * as React from 'react';
import {
  IAbstractEntity,
  IChoiceDescriptor,
  IEvaluationDescriptor,
  IEvaluationDescriptorContainer,
  IListDescriptor,
  IPeerReviewDescriptor,
  IQuestionDescriptor,
  IResult,
  IWhQuestionDescriptor,
} from 'wegas-ts-api';
import { DropMenu, DropMenuProps } from '../../../Components/DropMenu';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { Actions } from '../../../data';
import { entityIs } from '../../../data/entities';
import { VariableDescriptor } from '../../../data/selectors';
import { store, StoreDispatch } from '../../../data/Stores/store';
import { getChildren, getClassLabel, getIcon } from '../../editionConfig';
import { IconComp, withDefault } from '../Views/FontAwesome';

function buildMenuItems(
  variable: IAbstractEntity,
): Promise<DropMenuItem<IAbstractEntity['@class']>[]> {
  return getChildren(variable).then(children => {
    return children
      .map(i => {
        const Label = asyncSFC(async () => {
          const entity = { '@class': i };
          return (
            <>
              <IconComp icon={withDefault(getIcon(entity), 'question')} />
              {getClassLabel(entity)}
            </>
          );
        });
        return {
          label: <Label />,
          value: i,
        };
      })
      .filter(
        item =>
          !entityIs(variable, 'ListDescriptor') ||
          variable.allowedTypes.length === 0 ||
          variable.allowedTypes.includes(item.value),
      );
  });
}

interface AddMenuProps {
  label?: React.ReactNode;
  prefixedLabel?: boolean;
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
  onSelect?: DropMenuProps<string, DropMenuItem<string>>['onSelect'];
  focusTab?: (tab: string) => void;
  style?: React.CSSProperties;
}

/**
 * handle Add button for List / Question
 */
export const AddMenuParent = asyncSFC(
  async ({
    variable,
    label,
    prefixedLabel,
    localDispatch,
    forceLocalDispatch,
    onSelect,
    focusTab,
    style,
  }: {
    variable: IListDescriptor | IQuestionDescriptor | IWhQuestionDescriptor;
  } & AddMenuProps) => {
    const items = await buildMenuItems(variable);
    return (
      <DropMenu
        style={style}
        label={label}
        prefixedLabel={prefixedLabel}
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          let dispatch = store.dispatch;
          if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
            dispatch = localDispatch;
          } else {
            focusTab && focusTab('Variable Properties');
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
    forceLocalDispatch,
    onSelect,
    focusTab,
  }: {
    variable: IChoiceDescriptor;
  } & AddMenuProps) => {
    const items = await buildMenuItems(variable);
    return (
      <DropMenu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          const globalDispatch = store.dispatch;
          let dispatch = globalDispatch;
          if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
            dispatch = localDispatch;
          } else {
            focusTab && focusTab('Variable Properties');
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
/**
 * Handle Add button for Choice
 */
export const AddMenuFeedback = asyncSFC(
  async ({
    variable,
    localDispatch,
    forceLocalDispatch,
    onSelect,
    focusTab,
    path,
  }: {
    variable: IEvaluationDescriptorContainer;
    path: 'feedback' | 'fbComments';
  } & AddMenuProps) => {
    const items = await buildMenuItems(variable);
    return (
      <DropMenu
        items={items}
        icon="plus"
        onSelect={(i, e) => {
          onSelect && onSelect(i, e);
          const globalDispatch = store.dispatch;
          let dispatch = globalDispatch;
          if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
            dispatch = localDispatch;
          } else {
            focusTab && focusTab('Variable Properties');
          }

          const parent = VariableDescriptor.select(
            variable.parentId,
          ) as IPeerReviewDescriptor;

          dispatch(
            Actions.EditorActions.createVariable(i.value, parent, {
              save: (entity: IEvaluationDescriptor) => {
                const newChoice = produce(parent, v => {
                  v[path].evaluations.push(entity);
                });
                const index = newChoice[path].evaluations.length - 1;
                globalDispatch(
                  Actions.VariableDescriptorActions.updateDescriptor(newChoice),
                ).then(() =>
                  dispatch(
                    Actions.EditorActions.editVariable(newChoice, [
                      path,
                      'evaluations',
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
