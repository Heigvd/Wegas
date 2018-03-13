import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { VariableDescriptor, GameModel } from '../../../data/selectors';
import { State } from '../../../data/Reducer/reducers';
import { Actions } from '../../../data';
import { Toolbar } from '../Views/Toolbar';
import { varIsList, entityIs } from '../../../data/entities';
import { get } from 'lodash-es';
import { Combobox, Specialization } from '../Views/Combobox';
import { children } from '../../EntitiesConfig/ListDescriptor';
import { Container, Node } from '../Views/TreeView';
import { moveDescriptor } from '../../../data/Reducer/variableDescriptor';
// import { Tree } from '../Views/Tree';

interface TreeProps {
  variables?: number[];
  dispatch: Dispatch<State>;
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
    return () => dispatch(Actions.EditorActions.editVariable(variable, path));
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

const CTree = connect(
  (
    _state: State,
    props: {
      variableId: number;
      subPath?: (string | number)[];
    },
  ) => {
    const v = VariableDescriptor.select(props.variableId);
    if (Array.isArray(props.subPath) && props.subPath.length > 0) {
      return {
        variable: get(v, props.subPath),
      };
    }
    return { variable: v };
  },
)(function VTree({
  variable,
  onSelectCreator,
  nodeProps,
}: {
  variable: IVariableDescriptor | undefined;
  nodeProps: () => {};
  onSelectCreator: (
    entity: IWegasEntity,
    path?: (string | number)[],
  ) => () => void;
}): JSX.Element {
  if (variable) {
    return (
      <Node
        {...nodeProps()}
        header={
          <span onClick={onSelectCreator(variable)}>
            {`${variable['@class']}: ${variable.label}`}
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
                  onSelectCreator={onSelectCreator}
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
                      return onSelectCreator(
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
});
export default connect(
  (_state: State) => ({
    variables: GameModel.selectCurrent().itemsIds,
  }),
  dispatch => ({
    dispatch,
  }),
)(TreeView);
