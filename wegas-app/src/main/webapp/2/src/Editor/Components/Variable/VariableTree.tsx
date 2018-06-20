import * as React from 'react';
import { VariableDescriptor, GameModel } from '../../../data/selectors';
import { Actions } from '../../../data';
import { Toolbar } from '../../../Components/Toolbar';
import { varIsList, entityIs } from '../../../data/entities';
import { get } from 'lodash-es';
import { Combobox, Specialization } from '../Views/Combobox';
import { children } from '../../EntitiesConfig/ListDescriptor';
import { Container, Node } from '../Views/TreeView';
import { moveDescriptor } from '../../../data/Reducer/variableDescriptor';
import { getEntityActions } from '../../editionConfig';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { TranslatableContent } from '../../../data/i18n';
import { State } from '../../../data/Reducer/reducers';
import { css, cx } from 'emotion';
import { shallowIs } from '../../../Helper/shallowIs';
// import { Tree } from '../Views/Tree';

interface TreeProps {
  variables: number[];
  dispatch: StoreDispatch;
}
const items = children.map(v => ({
  value: v,
  label: v.slice(0, -10),
}));

const VariableCreate = Combobox as Specialization<{
  value: string;
  label: string;
}>;

function TreeView({ variables, dispatch }: TreeProps) {
  function onSelectCreator(variable: IVariableDescriptor, path?: string[]) {
    return () =>
      getEntityActions(variable).then(({ edit }) =>
        dispatch(edit(variable, path)),
      );
  }
  return (
    <Toolbar>
      <Toolbar.Header>
        <VariableCreate
          items={items}
          searchKeys={['label']}
          itemToMenuItem={i => i.label}
          itemToValue={i => (i ? i.value : '')}
          clearOnSelect
          openOnFocus
          onChange={i =>
            i && dispatch(Actions.EditorActions.createVariable(i.value))
          }
          placeholder={'Create variable'}
        />
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
              {variables ? (
                variables.map(v => (
                  <CTree
                    nodeProps={nodeProps}
                    key={v}
                    variableId={v}
                    onSelectCreator={onSelectCreator}
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
const SELECTED_STYLE_WIDTH = 4;
const editingStyle = css({
  borderLeft: `${SELECTED_STYLE_WIDTH}px solid`,
});
const headerStyle = css({
  borderLeft: `${SELECTED_STYLE_WIDTH}px solid transparent`,
});
function CTree(props: {
  variableId: number;
  subPath?: (string | number)[];
  nodeProps: () => {};
  onSelectCreator: (
    entity: IWegasEntity,
    path?: (string | number)[],
  ) => () => void;
}): JSX.Element {
  return (
    <StoreConsumer
      selector={(state: State) => ({
        variable: VariableDescriptor.select(props.variableId),
        editing:
          state.global.editing != null &&
          state.global.editing.type === 'Variable' &&
          props.variableId === state.global.editing.id &&
          shallowIs(props.subPath || [], state.global.editing.path),
      })}
    >
      {({ state }) => {
        let { variable } = state;
        if (Array.isArray(props.subPath) && props.subPath.length > 0) {
          variable = get(variable, props.subPath) as IVariableDescriptor;
        }
        if (variable) {
          return (
            <Node
              {...props.nodeProps()}
              header={
                <span
                  className={cx(headerStyle, { [editingStyle]: state.editing })}
                  onClick={props.onSelectCreator(variable)}
                >
                  {`${variable['@class']}: ${TranslatableContent.toString(
                    variable.label,
                  )}`}
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
                        onSelectCreator={props.onSelectCreator}
                      />
                    ))
                  : entityIs<IChoiceDescriptor>(variable, 'ChoiceDescriptor')
                    ? variable.results.map((r, index) => (
                        <CTree
                          nodeProps={nodeProps}
                          key={r.id}
                          variableId={r.choiceDescriptorId}
                          subPath={['results', index]}
                          onSelectCreator={function(v: IResult) {
                            return props.onSelectCreator(
                              VariableDescriptor.select(v.choiceDescriptorId)!,
                              ['results', index],
                            );
                          }}
                        />
                      ))
                    : null
              }
            </Node>
          );
        }
        return <div>Loading...</div>;
      }}
    </StoreConsumer>
  );
}
export default function Tree() {
  return (
    <StoreConsumer selector={() => GameModel.selectCurrent().itemsIds}>
      {({ state, dispatch }) => {
        return <TreeView dispatch={dispatch} variables={state} />;
      }}
    </StoreConsumer>
  );
}
