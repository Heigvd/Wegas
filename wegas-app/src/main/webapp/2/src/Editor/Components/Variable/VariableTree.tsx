import * as React from 'react';
import { VariableDescriptor } from '../../../data/selectors';
import { Actions } from '../../../data';
import { Toolbar } from '../../../Components/Toolbar';
import { varIsList, entityIs } from '../../../data/entities';
import { get } from 'lodash-es';

import { Container, Node } from '../Views/TreeView';
import { moveDescriptor } from '../../../data/Reducer/VariableDescriptorReducer';
import {
  getEntityActions,
  getIcon,
  getLabel,
  getChildren,
} from '../../editionConfig';
import { StoreDispatch, useStore, store } from '../../../data/store';
import { css, cx } from 'emotion';
import { shallowIs } from '../../../Helper/shallowIs';
import { Menu } from '../../../Components/Menu';
import { withDefault, IconComp } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { AddMenuParent, AddMenuChoice, AddMenuFeedback } from './AddMenu';
import { editorLabel } from '../../../data/methods/VariableDescriptorMethods';
import { SearchTool } from '../SearchTool';
import { focusTabContext } from '../LinearTabLayout/LinearLayout';
import { useAsync } from '../../../Components/Hooks/useAsync';
import {
  themeVar,
  globalSelection,
  localSelection,
  searchSelection,
} from '../../../Components/Style/Theme';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { Edition } from '../../../data/Reducer/globalState';
import { shallowDifferent } from '../../../Components/Hooks/storeHookFactory';
import { mainLayoutId } from '../Layout';

const itemsPromise = getChildren({ '@class': 'ListDescriptor' }).then(
  children =>
    children.map(i => {
      const Label = asyncSFC(async () => {
        const entity = { '@class': i };
        return (
          <>
            <IconComp icon={withDefault(getIcon(entity), 'question')} />
            {getLabel(entity)}
          </>
        );
      });
      return {
        label: <Label />,
        value: i,
      };
    }),
);

interface TreeProps {
  variables: number[];
  localState?: Readonly<Edition> | undefined;
  localDispatch?: StoreDispatch;
}
function TreeView({ variables, localState, localDispatch }: TreeProps) {
  const [search, setSearch] = React.useState('');
  const { data } = useAsync(itemsPromise);
  const globalDispatch = store.dispatch;

  return (
    <Toolbar>
      <Toolbar.Header>
        <input
          type="string"
          value={search}
          placeholder="Filter"
          aria-label="Filter"
          onChange={ev => {
            setSearch(ev.target.value);
          }}
        />
        <Menu
          items={data || []}
          icon="plus"
          onSelect={(i, e) => {
            const dispatch =
              e.ctrlKey && localDispatch ? localDispatch : globalDispatch;
            dispatch(Actions.EditorActions.createVariable(i.value));
          }}
        />
        <SearchTool />
      </Toolbar.Header>
      <Toolbar.Content>
        <Container
          onDropResult={({ source, target, id }) => {
            if (
              source.parent !== target.parent ||
              source.index !== target.index
            ) {
              globalDispatch(
                moveDescriptor(
                  id as IVariableDescriptor,
                  target.index,
                  target.parent as IParentDescriptor,
                ),
              );
            }
          }}
        >
          {({ nodeProps }) => (
            <div style={{ height: '100%' }}>
              {variables ? (
                variables.map(v => (
                  <CTree
                    nodeProps={nodeProps}
                    key={v}
                    search={search}
                    variableId={v}
                    localState={localState}
                    localDispatch={localDispatch}
                  />
                ))
              ) : (
                <span>Loading ...</span>
              )}
            </div>
          )}
        </Container>
      </Toolbar.Content>
    </Toolbar>
  );
}

/**
 * test a variable and children's editorLabel against a text
 */
function isMatch(variableId: number, search: string): boolean {
  const variable = VariableDescriptor.select(variableId);
  if (variable == null) {
    return false;
  }
  if (editorLabel(variable).toLowerCase().includes(search.toLowerCase())) {
    return true;
  }
  if (varIsList(variable)) {
    return variable.itemsIds.some(id => isMatch(id, search));
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

const SELECTED_STYLE_WIDTH = 4;
const headerStyle = css({
  borderLeft: `${SELECTED_STYLE_WIDTH}px solid transparent`,
});
export const nodeContentStyle = css({
  cursor: 'pointer',
  marginLeft: '5px',
  marginRight: '5px',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});

export const TREEVIEW_ITEM_TYPE = 'TREEVIEW_DRAG_ITEM';

interface CTreeProps {
  variableId: number;
  subPath?: string[];
  search: string;
  nodeProps: () => {};
}

function CTree(
  props: Omit<CTreeProps & TreeProps, 'variables'>,
): JSX.Element | null {
  const focusTab = React.useContext(focusTabContext);
  const { searching, editing, variable, match } = useStore(state => {
    let variable = VariableDescriptor.select(props.variableId);
    if (Array.isArray(props.subPath) && props.subPath.length > 0) {
      variable = get(variable, props.subPath) as IVariableDescriptor;
    }
    return {
      variable: variable,
      match: isMatch(props.variableId, props.search),
      editing: isEditing(props.variableId, props.subPath, state.global.editing),
      searching:
        (variable &&
          state.global.search.type === 'GLOBAL' &&
          state.global.search.value.includes(editorLabel(variable))) ||
        false,
    };
  }, shallowDifferent);

  const localEditing = isEditing(
    props.variableId,
    props.subPath,
    props.localState,
  );
  if (variable) {
    const Title = asyncSFC(async () => {
      const icon = getIcon(variable!);
      return (
        <span className={nodeContentStyle}>
          <IconComp icon={withDefault(icon, 'question')} />
          {entityIs(variable, 'EvaluationDescriptorContainer') &&
          props.subPath &&
          props.subPath.length === 1
            ? props.subPath[0] === 'feedback'
              ? 'Feedback'
              : 'Feedback comment'
            : editorLabel(variable)}
        </span>
      );
    });
    if (!match) {
      return null;
    }
    return (
      <Node
        dragId={TREEVIEW_ITEM_TYPE}
        {...props.nodeProps()}
        header={
          <span
            className={cx(headerStyle, {
              [globalSelection]: editing,
              [localSelection]: localEditing,
              [searchSelection]: searching,
            })}
            onClick={(e: ModifierKeysEvent) => {
              let dispatch = store.dispatch;
              if (e.ctrlKey && props.localDispatch) {
                dispatch = props.localDispatch;
              } else {
                if (
                  entityIs(variable, 'FSMDescriptor') ||
                  entityIs(variable, 'DialogueDescriptor')
                ) {
                  focusTab('StateMachine', mainLayoutId);
                }
                focusTab('Editor', mainLayoutId);
              }
              getEntityActions(variable!).then(({ edit }) =>
                dispatch(
                  edit(
                    VariableDescriptor.select(props.variableId)!,
                    props.subPath,
                  ),
                ),
              );
            }}
          >
            <Title />
            {entityIs(variable, 'ListDescriptor') ||
            entityIs(variable, 'QuestionDescriptor') ||
            entityIs(variable, 'WhQuestionDescriptor') ? (
              <AddMenuParent
                variable={variable}
                localDispatch={props.localDispatch}
                focusTab={tabId => focusTab(tabId, mainLayoutId)}
              />
            ) : entityIs(variable, 'ChoiceDescriptor') ? (
              <AddMenuChoice
                variable={variable}
                localDispatch={props.localDispatch}
                focusTab={tabId => focusTab(tabId, mainLayoutId)}
              />
            ) : entityIs(variable, 'EvaluationDescriptorContainer') ? (
              <AddMenuFeedback
                variable={variable}
                localDispatch={props.localDispatch}
                focusTab={tabId => focusTab(tabId, mainLayoutId)}
                path={props.subPath![0] as 'feedback' | 'fbComments'}
              />
            ) : null}
          </span>
        }
        id={variable}
      >
        {({ nodeProps }) =>
          varIsList(variable)
            ? variable.itemsIds.map(i => (
                <CTree
                  nodeProps={nodeProps}
                  key={i}
                  variableId={i}
                  search={props.search}
                  localState={props.localState}
                  localDispatch={props.localDispatch}
                />
              ))
            : entityIs(variable, 'ChoiceDescriptor')
            ? variable.results.map((r, index) => (
                <CTree
                  nodeProps={nodeProps}
                  key={r.id}
                  search={props.search}
                  variableId={r.parentId!}
                  subPath={['results', String(index)]}
                  localState={props.localState}
                  localDispatch={props.localDispatch}
                />
              ))
            : entityIs(variable, 'PeerReviewDescriptor')
            ? [
                <CTree
                  nodeProps={nodeProps}
                  key={0}
                  search={props.search}
                  variableId={props.variableId}
                  subPath={['feedback']}
                  localState={props.localState}
                  localDispatch={props.localDispatch}
                />,
                <CTree
                  nodeProps={nodeProps}
                  key={1}
                  search={props.search}
                  variableId={props.variableId}
                  subPath={['fbComments']}
                  localState={props.localState}
                  localDispatch={props.localDispatch}
                />,
              ]
            : entityIs(variable, 'EvaluationDescriptorContainer')
            ? variable.evaluations.map((r, index) => (
                <CTree
                  nodeProps={nodeProps}
                  key={r.id}
                  search={props.search}
                  variableId={props.variableId}
                  subPath={[
                    ...(props.subPath ? props.subPath : []),
                    'evaluations',
                    String(index),
                  ]}
                  localState={props.localState}
                  localDispatch={props.localDispatch}
                />
              ))
            : null
        }
      </Node>
    );
  }
  return <div>Loading...</div>;
}
export function Tree() {
  const entities = useGameModel().itemsIds;
  return <TreeView variables={entities} />;
}

export default function TreeWithMeta() {
  const entities = useGameModel().itemsIds;
  return (
    <ComponentWithForm entityEditor>
      {({ localState, localDispatch }) => {
        return (
          <TreeView
            variables={entities}
            localState={localState}
            localDispatch={localDispatch}
          />
        );
      }}
    </ComponentWithForm>
  );
}
