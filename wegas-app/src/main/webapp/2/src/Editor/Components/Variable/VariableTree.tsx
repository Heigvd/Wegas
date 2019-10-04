import * as React from 'react';
import { VariableDescriptor } from '../../../data/selectors';
import { Actions } from '../../../data';
import { Toolbar } from '../../../Components/Toolbar';
import { varIsList, entityIs } from '../../../data/entities';
import { get } from 'lodash-es';

import { Container, Node } from '../Views/TreeView';
import { moveDescriptor } from '../../../data/Reducer/variableDescriptor';
import {
  getEntityActions,
  getIcon,
  getLabel,
  getChildren,
} from '../../editionConfig';
import { StoreDispatch, getDispatch, useStore } from '../../../data/store';
import { css, cx } from 'emotion';
import { shallowIs } from '../../../Helper/shallowIs';
import { Menu } from '../../../Components/Menu';
import { FontAwesome, withDefault } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { AddMenuParent, AddMenuChoice, MenuItem } from './AddMenu';
import { editorLabel } from '../../../data/methods/VariableDescriptor';
import { SearchTool } from '../SearchTool';
import { focusTabContext } from '../LinearTabLayout/LinearLayout';
import { useAsync } from '../../../Components/Hooks/useAsync';
import {
  themeVar,
  localSelection,
  globalSelection,
} from '../../../Components/Theme';
import { layoutTabs } from '../Layout';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import ComponentWithForm from '../FormView/ComponentWithForm';
import { wlog } from '../../../Helper/wegaslog';

const itemsPromise = getChildren({ '@class': 'ListDescriptor' }).then(
  children =>
    children.map(i => {
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
    }),
);

interface TreeViewProps extends TreeProps {
  entities: number[];
}
function TreeView({
  entities,
  onEntityClick,
  onNewEntity,
  outsideSelection,
}: TreeViewProps) {
  const [search, setSearch] = React.useState('');
  const { data } = useAsync(itemsPromise);
  const dispatch: StoreDispatch = getDispatch();
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
            if (onNewEntity) {
              onNewEntity(i.value, e);
            } else {
              dispatch(Actions.EditorActions.createVariable(i.value));
            }
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
              dispatch(
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
              {entities ? (
                entities.map(v => (
                  <CTree
                    nodeProps={nodeProps}
                    key={v}
                    search={search}
                    variableId={v}
                    onEntityClick={onEntityClick}
                    outsideSelection={outsideSelection}
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

function isMatch(variableId: number, search: string): boolean {
  const variable = VariableDescriptor.select(variableId);
  if (variable == null) {
    return false;
  }
  if (
    editorLabel(variable)
      .toLowerCase()
      .includes(search.toLowerCase())
  ) {
    return true;
  }
  if (varIsList(variable)) {
    return variable.itemsIds.some(id => isMatch(id, search));
  }
  return false;
}
const SELECTED_STYLE_WIDTH = 4;

const headerStyle = css({
  borderLeft: `${SELECTED_STYLE_WIDTH}px solid transparent`,
});
const nodeContentStyle = css({
  cursor: 'pointer',
  marginLeft: '5px',
  marginRight: '5px',
  ':hover': {
    backgroundColor: themeVar.primaryHoverColor,
  },
});
function isEditing(
  ctreeVariable: IAbstractEntity,
  selection?: IAbstractEntity,
) {
  return (
    selection !== undefined &&
    selection.refId !== undefined &&
    ctreeVariable.refId !== undefined &&
    selection.refId === ctreeVariable.refId
  );
}
function CTree(
  props: {
    variableId: number;
    subPath?: (string)[];
    search: string;
    nodeProps: () => {};
  } & TreeProps,
): JSX.Element | null {
  const focusTab = React.useContext(focusTabContext);
  let variable = VariableDescriptor.select(props.variableId);
  const internalEditing = useStore(
    state =>
      state.global.editing != null &&
      state.global.editing.type === 'Variable' &&
      props.variableId === state.global.editing.id &&
      shallowIs(props.subPath || [], state.global.editing.path),
    (a, b) => !shallowIs(a, b),
  );

  if (Array.isArray(props.subPath) && props.subPath.length > 0) {
    variable = get(variable, props.subPath) as IVariableDescriptor;
  }
  if (variable) {
    const dispatch = getDispatch();

    const externalEditing =
      props.outsideSelection !== undefined &&
      isEditing(variable, props.outsideSelection.selectedGlobalVariable);
    const editing = props.outsideSelection ? externalEditing : internalEditing;
    const secondaryEditing =
      props.outsideSelection !== undefined &&
      isEditing(variable, props.outsideSelection.selectedLocalVariable);

    const Title = asyncSFC(async () => {
      const icon = await getIcon(variable!);
      return <FontAwesome icon={withDefault(icon, 'question')} fixedWidth />;
    });
    if (!isMatch(props.variableId, props.search)) {
      return null;
    }
    const onSelect = (i: MenuItem, e: ModifierKeysEvent) => {
      props.onNewEntity
        ? props.onNewEntity(i.value, e)
        : focusTab(layoutTabs.EntityEditor);
    };
    return (
      <Node
        {...props.nodeProps()}
        header={
          <span
            className={cx(headerStyle, {
              [globalSelection]: editing,
              [localSelection]: secondaryEditing,
            })}
            onClick={e => {
              if (props.onEntityClick) {
                props.onEntityClick(e, variable!, props.subPath);
              } else {
                focusTab(layoutTabs.EntityEditor);
                if (entityIs<IFSMDescriptor>(variable, 'FSMDescriptor')) {
                  focusTab(layoutTabs.StateMachineEditor);
                }
                getEntityActions(variable!).then(({ edit }) => {
                  return dispatch(
                    edit(
                      VariableDescriptor.select(props.variableId)!,
                      props.subPath,
                    ),
                  );
                });
              }
            }}
          >
            <span className={nodeContentStyle}>
              <Title />
              {editorLabel(variable)}
            </span>
            {entityIs<IListDescriptor>(variable, 'ListDescriptor') ||
            entityIs<IQuestionDescriptor>(variable, 'QuestionDescriptor') ? (
              <AddMenuParent
                variable={variable}
                dispatch={props.onNewEntity ? undefined : dispatch}
                onSelect={onSelect}
              />
            ) : entityIs<IChoiceDescriptor>(variable, 'ChoiceDescriptor') ? (
              <AddMenuChoice
                variable={variable}
                dispatch={props.onNewEntity ? undefined : dispatch}
                onSelect={onSelect}
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
                />
              ))
            : entityIs<IChoiceDescriptor>(variable, 'ChoiceDescriptor')
            ? variable.results.map((r, index) => (
                <CTree
                  nodeProps={nodeProps}
                  key={r.id}
                  search={props.search}
                  variableId={r.parentId!}
                  subPath={['results', String(index)]}
                />
              ))
            : null
        }
      </Node>
    );
  }
  return <div>Loading...</div>;
}

type OnEntityClickFn = (
  event: ModifierKeysEvent,
  entity: IAbstractEntity,
  path?: (string)[],
  onEntityUpdate?: (updatedEntity: IAbstractEntity) => void,
) => void;
type OnNewEntityFn = (type: string, modifierKeys?: ModifierKeysEvent) => void;

interface TreeProps {
  onEntityClick?: OnEntityClickFn;
  onNewEntity?: OnNewEntityFn;
  outsideSelection?: {
    selectedGlobalVariable?: IAbstractEntity;
    selectedLocalVariable?: IAbstractEntity;
  };
}

export function Tree({
  onEntityClick,
  onNewEntity,
  outsideSelection,
}: TreeProps) {
  return (
    <TreeView
      entities={useGameModel().itemsIds}
      onEntityClick={onEntityClick}
      onNewEntity={onNewEntity}
      outsideSelection={outsideSelection}
    />
  );
}

export default function VariableBrowserWithMeta() {
  return (
    <ComponentWithForm
      moreEditorActions={[
        {
          label: 'Test',
          action: () => wlog('This is a test'),
        },
      ]}
    >
      {({
        onClickItemHandle,
        onNewItemHandle,
        mainSelectedItem,
        secondarySelectedItem,
      }) => {
        return (
          <Tree
            onEntityClick={onClickItemHandle}
            onNewEntity={onNewItemHandle}
            outsideSelection={{
              selectedGlobalVariable: mainSelectedItem,
              selectedLocalVariable: secondarySelectedItem,
            }}
          />
        );
      }}
    </ComponentWithForm>
  );
}
