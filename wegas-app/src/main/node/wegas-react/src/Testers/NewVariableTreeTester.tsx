import { css, cx } from '@emotion/css';
import { get } from 'lodash-es';
import * as React from 'react';
import { IEvaluationDescriptorContainer, IResult } from 'wegas-ts-api';
import { DropMenu } from '../Components/DropMenu';
import { asyncSFC } from '../Components/HOC/asyncSFC';
import { deepDifferent } from '../Components/Hooks/storeHookFactory';
import { useAsync } from '../Components/Hooks/useAsync';
import { useDebounceFn } from '../Components/Hooks/useDebounce';
import { useGameModel } from '../Components/Hooks/useGameModel';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';
import { SimpleInput } from '../Components/Inputs/SimpleInput';
import { useOkCancelModal } from '../Components/Modal';
import { isActionAllowed } from '../Components/PageComponents/tools/options';
import { themeVar } from '../Components/Theme/ThemeVars';
import { Toolbar } from '../Components/Toolbar';
import { TreeNode } from '../Components/TreeView/TreeNode';
import { TreeView } from '../Components/TreeView/TreeView';
import {
  componentMarginLeft,
  flex,
  flexBetween,
  flexRow,
  globalSelection,
  localSelection,
  toolboxHeaderStyle,
} from '../css/classes';
import { Actions } from '../data';
import { entityIs, varIsList } from '../data/entities';
import { editorLabel } from '../data/methods/VariableDescriptorMethods';
import { Edition } from '../data/Reducer/globalState';
import { State } from '../data/Reducer/reducers';
import { moveDescriptor } from '../data/Reducer/VariableDescriptorReducer';
import { VariableDescriptor } from '../data/selectors';
import { store, StoreDispatch, useStore } from '../data/Stores/store';
import { ComponentWithForm } from '../Editor/Components/FormView/ComponentWithForm';
import { mainLayoutId } from '../Editor/Components/Layout';
import { focusTab } from '../Editor/Components/LinearTabLayout/LinearLayout';
import {
  AddMenuChoice,
  AddMenuFeedback,
  AddMenuParent,
} from '../Editor/Components/Variable/AddMenu';
import { IconComp, withDefault } from '../Editor/Components/Views/FontAwesome';
import {
  getChildren,
  getClassLabel,
  getEntityActions,
  getIcon,
} from '../Editor/editionConfig';
import { shallowIs } from '../Helper/shallowIs';
import { commonTranslations } from '../i18n/common/common';
import { useInternalTranslate } from '../i18n/internalTranslator';

const TREECONTENTID = 'TREECONTENT';
const nodeStyle = css({
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: 'transparent',
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '2px',
  alignItems: 'center',
});

export const nodeContentStyle = cx(
  css({
    marginRight: '5px',
  }),
  componentMarginLeft,
);

export const actionNodeContentStyle = cx(
  css({
    cursor: 'pointer',
    ':hover': {
      border: '1px solid ' + themeVar.colors.PrimaryColor,
    },
  }),
);

const itemsPromise = getChildren({ '@class': 'ListDescriptor' }).then(
  children =>
    children.map(i => {
      const Label = asyncSFC(async () => {
        const entity = { '@class': i };
        return (
          <>
            <IconComp
              icon={withDefault(getIcon(entity), 'question')}
              className={css({ marginRight: '3px' })}
            />
            {getClassLabel(entity)}
          </>
        );
      });
      return {
        label: <Label />,
        value: i,
      };
    }),
);

interface VariableTreeTitleProps extends ClassStyleId {
  variable?: IVariableDescriptor | IResult | IEvaluationDescriptorContainer;
  subPath?: (string | number)[];
}

export function VariableTreeTitle({
  variable,
  subPath,
  className,
  style,
}: VariableTreeTitleProps) {
  return (
    <div className={className} style={style}>
      <IconComp
        icon={withDefault(getIcon(variable!), 'question')}
        className={css({ marginRight: '2px' })}
      />
      {entityIs(variable, 'EvaluationDescriptorContainer')
        ? subPath && subPath.length === 1
          ? String(subPath[0]) === 'feedback'
            ? 'Feedback'
            : 'Feedback comment'
          : 'Unreachable code'
        : editorLabel(variable)}
    </div>
  );
}

interface SharedTreeProps extends DisabledReadonly {
  noHeader?: boolean;
  noVisibleRoot?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
}

interface TreeProps extends SharedTreeProps {
  root: IParentDescriptor;
  noHeader?: boolean;
  noVisibleRoot?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
}

export function VariableTreeView({
  root,
  noHeader = false,
  noVisibleRoot = false,
  localState,
  localDispatch,
  forceLocalDispatch,
  ...options
}: TreeProps) {
  const [onAccept, setOnAccept] = React.useState(() => () => {});
  const [openNodes, setOpenNodes] = React.useState<{
    [path: string]: boolean | undefined;
  }>({});

  const { data } = useAsync(itemsPromise);
  const { showModal, OkCancelModal } = useOkCancelModal(TREECONTENTID);
  const i18nValues = useInternalTranslate(commonTranslations);

  const globalDispatch = store.dispatch;
  const actionAllowed = isActionAllowed(options);
  const { value, deep } = useStore(
    s => ({
      value: s.global.search.value,
      deep: s.global.search.deep,
    }),
    deepDifferent,
  );

  const searchFn = useDebounceFn(
    (value: string) =>
      globalDispatch(
        value.length < 2
          ? Actions.EditorActions.clearSearch()
          : Actions.EditorActions.search(value),
      ),
    500,
  );

  return (
    <Toolbar className={css({ padding: '1.5em' })}>
      <Toolbar.Header className={cx(toolboxHeaderStyle, flexBetween)}>
        {!noHeader && actionAllowed && (
          <>
            <DropMenu
              tooltip={i18nValues.add}
              items={data || []}
              icon="plus"
              onSelect={(i, e) => {
                if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
                  localDispatch(Actions.EditorActions.createVariable(i.value));
                } else {
                  globalDispatch(Actions.EditorActions.createVariable(i.value));
                  focusTab(mainLayoutId, 'Variable Properties');
                }
              }}
            />
            <div className={cx(flex, flexRow)}>
              <SimpleInput
                value={value}
                placeholder={i18nValues.filter}
                aria-label="Filter"
                onChange={ev => searchFn(String(ev))}
              />
              <Toggler
                className={css({
                  fontSize: '14px',
                  lineHeight: '100%',
                  justifyContent: 'flex-end',
                  marginLeft: '5px',
                })}
                label={i18nValues.deepSearch}
                value={deep}
                onChange={value =>
                  globalDispatch(Actions.EditorActions.searchSetDeep(value))
                }
              />
            </div>
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content id={TREECONTENTID} className={css({ padding: '1px' })}>
        <OkCancelModal onOk={onAccept}>
          <p>{i18nValues.changesWillBeLost}</p>
          <p>{i18nValues.areYouSure}</p>
        </OkCancelModal>
        <TreeView
          rootId={String(root.id)}
          onMove={(from, to) => {
            const movedVariable = from.data as IVariableDescriptor;
            const index = to.path.pop();
            const parentVariable = to.data;

            if (movedVariable != null && index != null) {
              let dispatch = store.dispatch;
              if (forceLocalDispatch && localDispatch) {
                dispatch = localDispatch;
              }
              dispatch(
                moveDescriptor(
                  movedVariable,
                  index,
                  parentVariable as unknown as IParentDescriptor,
                ),
              );
            }
          }}
          nodeManagement={{
            // openNodes: computedOpenNodes,
            openNodes,
            setOpenNodes,
          }}
        >
          {root.itemsIds ? (
            root.itemsIds.map(id => (
              <CTree
                onShowWarning={onOk => {
                  setOnAccept(() => onOk);
                  showModal();
                }}
                key={id}
                variableId={id}
                noVisibleRoot={noVisibleRoot}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                {...options}
              />
            ))
          ) : (
            <span>{`${i18nValues.loading} ...`}</span>
          )}
        </TreeView>
      </Toolbar.Content>
    </Toolbar>
  );
}

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
) {
  return (
    editing !== undefined &&
    (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
    editing.entity &&
    variableId === editing.entity.id &&
    shallowIs(subPath || [], editing.path)
  );
}

export const TREEVIEW_ITEM_TYPE = 'TREEVIEW_DRAG_ITEM';

interface CTreeProps {
  variableId: number;
  subPath?: string[];
  onShowWarning?: (onAccept: () => void) => void;
}

export function CTree({
  variableId,
  disabled,
  forceLocalDispatch,
  localDispatch,
  localState,
  noVisibleRoot,
  onShowWarning,
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

  if (variable) {
    if (!match) {
      return null;
    }
    return (
      <TreeNode
        forceOpenClose={searching && open ? true : undefined}
        notDraggable={!actionAllowed}
        notDroppable={!actionAllowed}
        label={
          <div
            className={cx(flex, nodeStyle, {
              [globalSelection]: editing,
              [localSelection]: localEditing,
              [actionNodeContentStyle]: actionAllowed,
            })}
            onClick={(e: ModifierKeysEvent) => {
              if (actionAllowed) {
                const unsaved =
                  forceLocalDispatch || e.ctrlKey
                    ? localState?.newEntity != null
                    : store.getState().global.editing?.newEntity != null;
                if (unsaved && onShowWarning) {
                  onShowWarning(() => onClickAction(e));
                } else {
                  onClickAction(e);
                }
              }
            }}
          >
            {!noVisibleRoot && (
              <VariableTreeTitle
                variable={variable}
                subPath={subPath}
                className={nodeContentStyle}
              />
            )}
            {actionAllowed &&
              (entityIs(variable, 'ListDescriptor') ||
              entityIs(variable, 'QuestionDescriptor') ||
              entityIs(variable, 'WhQuestionDescriptor') ? (
                <AddMenuParent
                  label={noVisibleRoot ? 'Add' : undefined}
                  prefixedLabel={!noVisibleRoot}
                  variable={variable}
                  localDispatch={localDispatch}
                  focusTab={tabId => focusTab(mainLayoutId, tabId)}
                  forceLocalDispatch={forceLocalDispatch}
                  style={noVisibleRoot ? { marginBottom: '10px' } : undefined}
                />
              ) : entityIs(variable, 'ChoiceDescriptor') ? (
                <AddMenuChoice
                  variable={variable}
                  localDispatch={localDispatch}
                  focusTab={tabId => focusTab(mainLayoutId, tabId)}
                  forceLocalDispatch={forceLocalDispatch}
                />
              ) : entityIs(variable, 'EvaluationDescriptorContainer') ? (
                <AddMenuFeedback
                  variable={variable}
                  localDispatch={localDispatch}
                  focusTab={tabId => focusTab(mainLayoutId, tabId)}
                  path={subPath![0] as 'feedback' | 'fbComments'}
                  forceLocalDispatch={forceLocalDispatch}
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
                onShowWarning={onShowWarning}
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
                onShowWarning={onShowWarning}
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
                onShowWarning={onShowWarning}
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
                onShowWarning={onShowWarning}
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
                onShowWarning={onShowWarning}
              />
            ))
          : null}
      </TreeNode>
    );
  }
  return <div>{i18nValues.loading}...</div>;
}

export default function TreeWithMeta() {
  const root = useGameModel();
  return (
    <ComponentWithForm entityEditor>
      {({ localState, localDispatch }) => {
        return (
          <VariableTreeView
            root={root}
            localState={localState}
            localDispatch={localDispatch}
          />
        );
      }}
    </ComponentWithForm>
  );
}
