import { css, cx } from '@emotion/css';
import { get } from 'lodash-es';
import * as React from 'react';
import {
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
import { entityIs, varIsList } from '../../../data/entities';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import {
  createVariable,
  EditingState,
  Edition,
  VariableEdition,
} from '../../../data/Reducer/editingState';
import { State } from '../../../data/Reducer/reducers';
import { VariableDescriptor } from '../../../data/selectors';
import {
  editingStore,
  useEditingStore,
} from '../../../data/Stores/editingStore';
import { useStore } from '../../../data/Stores/store';
import { shallowIs } from '../../../Helper/shallowIs';
import { wwarn } from '../../../Helper/wegaslog';
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
  width: '100%',
});
const nodeLabelStyle = css({
  minWidth: '100px',
  maxWidth: '100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
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

  const globalInfoSelector = React.useCallback(
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
        searching: state.global.search.value != null,
      };
    },
    [subPath, variableId],
  );

  const editingInfoSelector = React.useCallback(
    (state: EditingState) => {
      return {
        editing: isEditing(variableId, subPath, state.editing),
      };
    },
    [subPath, variableId],
  );

  const { variable, match, searching, open } = useStore(globalInfoSelector);
  const { editing } = useEditingStore(editingInfoSelector);

  const localEditing = isEditing(variableId, subPath, localState);

  const onEditionChanges = useOnEditionChangesModal(
    forceLocalDispatch,
    localState,
    localDispatch,
  );

  const onClickAction = React.useCallback(
    (e: ModifierKeysEvent) => {
      let dispatch = editingStore.dispatch;
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

      const { edit } = getEntityActions(variable!)
      dispatch(edit(VariableDescriptor.select(variableId)!, subPath));
      
    },
    [forceLocalDispatch, localDispatch, subPath, variableId, variable],
  );
  const onMenuParentSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >(
    (i, e) => {
      if (
        entityIs(variable, 'ListDescriptor') ||
        entityIs(variable, 'QuestionDescriptor') ||
        entityIs(variable, 'WhQuestionDescriptor')
      ) {
        let dispatch = editingStore.dispatch;

        if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
          dispatch = localDispatch;
        } else {
          focusTab(mainLayoutId, 'Variable Properties');
        }

        dispatch(createVariable(i.value, variable));
      }
    },
    [forceLocalDispatch, localDispatch, variable],
  );

  const onMenuChoiceSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >(
    (i, e) => {
      if (entityIs(variable, 'ChoiceDescriptor')) {
        let dispatch = editingStore.dispatch;
        if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
          dispatch = localDispatch;
        } else {
          focusTab(mainLayoutId, 'Variable Properties');
        }

        dispatch(createVariable(i.value, variable, 'Choice'));
      }
    },
    [forceLocalDispatch, localDispatch, variable],
  );

  const onMenuFeedbackSelect = React.useCallback<
    Exclude<AddMenuProps['onSelect'], undefined>
  >(
    (i, e) => {
      if (entityIs(variable, 'EvaluationDescriptorContainer')) {
        let dispatch = editingStore.dispatch;
        if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
          dispatch = localDispatch;
        } else {
          focusTab(mainLayoutId, 'Variable Properties');
        }

        const parent = VariableDescriptor.select<IPeerReviewDescriptor>(
          variable.parentId,
        );

        const path = subPath![0] as 'feedback' | 'fbComments';
        if (path != null) {
          switch (path) {
            case 'fbComments':
              dispatch(createVariable(i.value, parent, 'Comments'));
              break;
            case 'feedback':
              dispatch(createVariable(i.value, parent, 'Feedback'));
              break;
            default:
              wwarn(
                'A subpath must was set but it refers to an unknown prop ' +
                  path,
              );
          }
        } else {
          wwarn('A subpath must be set but was undefined');
        }
      }
    },
    [forceLocalDispatch, localDispatch, subPath, variable],
  );

  if (variable) {
    if (!match) {
      return null;
    }
    return (
      <TreeNode
        acceptTypes={[TREEVIEW_ITEM_TYPE]}
        type={TREEVIEW_ITEM_TYPE}
        forceOpenClose={searching && open ? true : undefined}
        notDraggable={
          !actionAllowed ||
          entityIs(variable, 'EvaluationDescriptorContainer', true) ||
          entityIs(variable, 'ChoiceDescriptor', true) ||
          entityIs(variable, 'EvaluationDescriptor', true) ||
          entityIs(variable, 'Result', true)
        }
        notDroppable={
          !actionAllowed ||
          entityIs(variable, 'PeerReviewDescriptor', true) ||
          entityIs(variable, 'EvaluationDescriptorContainer', true) ||
          entityIs(variable, 'QuestionDescriptor', true) ||
          entityIs(variable, 'ChoiceDescriptor', true)
        }
        label={open => (
          <div
            className={cx(flex, flexBetween, nodeStyle, {
              [globalSelection]: editing,
              [localSelection]: localEditing,
              [actionNodeContentStyle]: actionAllowed,
            })}
            onClick={(e: ModifierKeysEvent) => {
              if (
                actionAllowed &&
                !entityIs(variable, 'EvaluationDescriptorContainer')
              ) {
                onEditionChanges(variableId, e, onClickAction);
              }
            }}
          >
            <VariableTreeTitle
              open={open}
              variable={variable}
              subPath={subPath}
              className={nodeLabelStyle}
            />
            {actionAllowed &&
              (entityIs(variable, 'ListDescriptor') ||
              entityIs(variable, 'QuestionDescriptor') ||
              entityIs(variable, 'WhQuestionDescriptor') ? (
                <AddMenuParent
                  // label={noVisibleRoot ? 'Add' : undefined}
                  // prefixedLabel={!noVisibleRoot}
                  variable={variable}
                  // style={noVisibleRoot ? { marginBottom: '10px' } : undefined}
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
        )}
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
