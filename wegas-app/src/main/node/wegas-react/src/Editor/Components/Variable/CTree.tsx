import { css, cx } from '@emotion/css';
import produce from 'immer';
import { get } from 'lodash-es';
import * as React from 'react';
import {
  IEvaluationDescriptor,
  IEvaluationDescriptorContainer,
  IPeerReviewDescriptor,
  IResult,
  IVariableDescriptor,
} from 'wegas-ts-api';
import { useOnEditionChangesModal } from '../../../Components/Modal';
import { isActionAllowed } from '../../../Components/PageComponents/tools/options';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { TreeNode } from '../../../Components/TreeView/TreeNode';
import {
  flex,
  flexBetween,
  globalSelection,
  localSelection,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { entityIs, varIsList } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { Edition, VariableEdition } from '../../../data/Reducer/globalState';
import { State } from '../../../data/Reducer/reducers';
import { VariableDescriptor } from '../../../data/selectors';
import { store, useStore } from '../../../data/Stores/store';
import { shallowIs } from '../../../Helper/shallowIs';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { getEntityActions } from '../../editionConfig';
import { mainLayoutId } from '../../layouts';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import {
  AddMenuChoice,
  AddMenuFeedback,
  AddMenuParent,
  AddMenuProps,
} from './AddMenu';
import { VariableTreeTitle } from './VariableTreeTitle';
import { SharedTreeProps, TREEVIEW_ITEM_TYPE } from './VariableTreeView';

const nodeStyle = css({
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderRadius:
    themeVar.dimensions.BorderRadius +
    '0 0 ' +
    themeVar.dimensions.BorderRadius,
  padding: '2px',
  alignItems: 'center',
  flex: '1 1 auto',
  height: '1.5rem',
  fontSize: '0.95em',
});

export const actionNodeContentStyle = cx(
  css({
    cursor: 'pointer',
    button: {
      opacity: 0,
    },
    ':hover': {
      border: '1px solid ' + themeVar.colors.PrimaryColor,
      button: {
        opacity: 1,
      },
    },
  }),
);

/**
 * test a variable and children's editorLabel against a text
 */
function isMatch(variableId: number, search: string, deep: boolean): boolean {
  const variable = VariableDescriptor.select(variableId);
  if (variable == null) {
    return false;
  }
  if (
    deep &&
    Object.values(variable).filter(value =>
      JSON.stringify(value).toLowerCase().includes(search.toLowerCase()),
    ).length > 0
  ) {
    return true;
  }
  if (editorLabel(variable).toLowerCase().includes(search.toLowerCase())) {
    return true;
  }
  if (varIsList(variable)) {
    return variable.itemsIds.some(id => isMatch(id, search, deep));
  }
  return false;
}

/**
 * test a variable and children's editorLabel against a text
 */
function isOpen(variableId: number, search: string, deep: boolean): boolean {
  const variable = VariableDescriptor.select(variableId);
  if (variable == null) {
    return false;
  }
  if (varIsList(variable)) {
    return variable.itemsIds.some(id => isMatch(id, search, deep));
  }
  return false;
}

function isEditing(
  variableId: number,
  subPath?: string[],
  editing?: Readonly<Edition>,
): editing is Readonly<VariableEdition> {
  return (
    editing !== undefined &&
    (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
    editing.entity &&
    variableId === editing.entity.id &&
    shallowIs(subPath || [], editing.path)
  );
}
export interface CTreeProps {
  variableId: number;
  subPath?: string[];
}

export function CTree({
  variableId,
  disabled,
  forceLocalDispatch,
  localDispatch,
  localState,
  noVisibleRoot,
  readOnly,
  subPath,
}: Omit<
  CTreeProps & SharedTreeProps,
  'variables' | 'noHeader'
>): JSX.Element | null {
  const i18nValues = useInternalTranslate(commonTranslations);
  const actionAllowed = isActionAllowed({
    disabled: disabled,
    readOnly: readOnly,
  });

  const infoSelector = React.useCallback(
    (state: State) => {
      let variable:
        | undefined
        | IVariableDescriptor
        | IResult
        | IEvaluationDescriptorContainer =
        VariableDescriptor.select(variableId);
      if (Array.isArray(subPath) && subPath.length > 0) {
        variable = get(variable, subPath) as
          | IVariableDescriptor
          | IResult
          | IEvaluationDescriptorContainer;
      }

      return {
        variable: variable,
        open: isOpen(
          variableId,
          state.global.search.value || '',
          state.global.search.deep,
        ),
        match: isMatch(
          variableId,
          state.global.search.value || '',
          state.global.search.deep,
        ),
        editing: isEditing(variableId, subPath, state.global.editing),
        searching: state.global.search.value != null,
      };
    },
    [subPath, variableId],
  );

  const { editing, variable, match, searching, open } = useStore(infoSelector);

  const localEditing = isEditing(variableId, subPath, localState);

  const onEditionChanges = useOnEditionChangesModal(
    forceLocalDispatch,
    localState,
    localDispatch,
  );

  const onClickAction = React.useCallback(
    (e: ModifierKeysEvent) => {
      let dispatch = store.dispatch;
      if ((forceLocalDispatch || e.ctrlKey) && localDispatch) {
        dispatch = localDispatch;
      } else {
        if (
          entityIs(variable, 'FSMDescriptor') ||
          entityIs(variable, 'DialogueDescriptor')
        ) {
          focusTab(mainLayoutId, 'State Machine');
        }
        focusTab(mainLayoutId, 'Variable Properties');
      }

      getEntityActions(variable!).then(({ edit }) =>
        dispatch(edit(VariableDescriptor.select(variableId)!, subPath)),
      );
    },
    [forceLocalDispatch, localDispatch, subPath, variableId, variable],
  );
  const onMenuParentSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >((i, e) => {
    if (
      entityIs(variable, 'ListDescriptor') ||
      entityIs(variable, 'QuestionDescriptor') ||
      entityIs(variable, 'WhQuestionDescriptor')
    ) {
      let dispatch = store.dispatch;

      if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
        dispatch = localDispatch;
      } else {
        focusTab(mainLayoutId, 'Variable Properties');
      }

      dispatch(Actions.EditorActions.createVariable(i.value, variable));
    }
  }, []);

  const onMenuChoiceSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >((i, e) => {
    if (entityIs(variable, 'ChoiceDescriptor')) {
      const globalDispatch = store.dispatch;
      let dispatch = globalDispatch;
      if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
        dispatch = localDispatch;
      } else {
        focusTab(mainLayoutId, 'Variable Properties');
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
    }
  }, []);

  const onMenuFeedbackSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >((i, e) => {
    if (entityIs(variable, 'EvaluationDescriptorContainer')) {
      const globalDispatch = store.dispatch;
      let dispatch = globalDispatch;
      if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
        dispatch = localDispatch;
      } else {
        focusTab(mainLayoutId, 'Variable Properties');
      }

      const parent = VariableDescriptor.select(
        variable.parentId,
      ) as IPeerReviewDescriptor;

      const path = subPath![0] as 'feedback' | 'fbComments';

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
    }
  }, []);

  if (variable) {
    if (!match) {
      return null;
    }
    return (
      <TreeNode
        acceptTypes={[TREEVIEW_ITEM_TYPE]}
        type={TREEVIEW_ITEM_TYPE}
        forceOpenClose={searching && open ? true : undefined}
        notDraggable={!actionAllowed}
        notDroppable={!actionAllowed}
        label={
          <div
            className={cx(flex, flexBetween, nodeStyle, {
              [globalSelection]: editing,
              [localSelection]: localEditing,
              [actionNodeContentStyle]: actionAllowed,
            })}
            onClick={(e: ModifierKeysEvent) => {
              if (actionAllowed) {
                onEditionChanges(variableId, e, onClickAction);
              }
            }}
          >
            {!noVisibleRoot && (
              <VariableTreeTitle variable={variable} subPath={subPath} />
            )}
            {actionAllowed &&
              (entityIs(variable, 'ListDescriptor') ||
              entityIs(variable, 'QuestionDescriptor') ||
              entityIs(variable, 'WhQuestionDescriptor') ? (
                <AddMenuParent
                  label={noVisibleRoot ? 'Add' : undefined}
                  prefixedLabel={!noVisibleRoot}
                  variable={variable}
                  style={noVisibleRoot ? { marginBottom: '10px' } : undefined}
                  onSelect={(i, e) => {
                    onEditionChanges(0, e, e => onMenuParentSelect(i, e));
                  }}
                />
              ) : entityIs(variable, 'ChoiceDescriptor') ? (
                <AddMenuChoice
                  variable={variable}
                  onSelect={(i, e) => {
                    onEditionChanges(0, e, e => onMenuChoiceSelect(i, e));
                  }}
                />
              ) : entityIs(variable, 'EvaluationDescriptorContainer') ? (
                <AddMenuFeedback
                  variable={variable}
                  onSelect={(i, e) => {
                    onEditionChanges(0, e, e => onMenuFeedbackSelect(i, e));
                  }}
                />
              ) : null)}
          </div>
        }
        data={variable}
        id={String(variable.id)}
      >
        {varIsList(variable)
          ? variable.itemsIds.map(i => (
              <CTree
                key={i}
                variableId={i}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />
            ))
          : entityIs(variable, 'ChoiceDescriptor')
          ? variable.results.map((r, index) => (
              <CTree
                key={r.id}
                variableId={r.parentId!}
                subPath={['results', String(index)]}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />
            ))
          : entityIs(variable, 'PeerReviewDescriptor')
          ? [
              <CTree
                key={0}
                variableId={variableId}
                subPath={['feedback']}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />,
              <CTree
                key={1}
                variableId={variableId}
                subPath={['fbComments']}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />,
            ]
          : entityIs(variable, 'EvaluationDescriptorContainer')
          ? variable.evaluations.map((r, index) => (
              <CTree
                key={r.id}
                variableId={variableId}
                subPath={[
                  ...(subPath ? subPath : []),
                  'evaluations',
                  String(index),
                ]}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                disabled={disabled}
                readOnly={readOnly}
              />
            ))
          : null}
      </TreeNode>
    );
  }
  return <div>{i18nValues.loading}...</div>;
}
