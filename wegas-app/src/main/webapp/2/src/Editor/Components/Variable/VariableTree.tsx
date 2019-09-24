import * as React from 'react';
import { VariableDescriptor, GameModel } from '../../../data/selectors';
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
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { State } from '../../../data/Reducer/reducers';
import { css, cx } from 'emotion';
import { shallowIs } from '../../../Helper/shallowIs';
import { Menu } from '../../../Components/Menu';
import { FontAwesome, withDefault } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { AddMenuParent, AddMenuChoice } from './AddMenu';
import { editorLabel } from '../../../data/methods/VariableDescriptor';
import { SearchTool } from '../SearchTool';
import { focusTabContext } from '../LinearTabLayout/LinearLayout';
import { useAsync } from '../../../Components/Hooks/useAsync';
import { themeVar } from '../../../Components/Theme';

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

interface TreeProps {
  variables: number[];
  dispatch: StoreDispatch;
}
function TreeView({ variables, dispatch }: TreeProps) {
  const [search, setSearch] = React.useState('');
  const { data } = useAsync(itemsPromise);
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
          onSelect={i =>
            dispatch(Actions.EditorActions.createVariable(i.value))
          }
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
              {variables ? (
                variables.map(v => (
                  <CTree
                    nodeProps={nodeProps}
                    key={v}
                    search={search}
                    variableId={v}
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
// class TreeViews extends React.Component<TreeProps, { search: string }> {
//   state = { search: '' };
//   render() {
//     const { variables, dispatch } = this.props;
//     return (
//       <Toolbar>
//         <Toolbar.Header>
//           <input
//             type="string"
//             value={this.state.search}
//             placeholder="Filter"
//             aria-label="Filter"
//             onChange={ev => {
//               this.setState({ search: ev.target.value });
//             }}
//           />
//           <Menu
//             items={items}
//             icon="plus"
//             onSelect={i =>
//               dispatch(Actions.EditorActions.createVariable(i.value))
//             }
//           />
//           <SearchTool />
//         </Toolbar.Header>
//         <Toolbar.Content>
//           <Container
//             onDropResult={({ source, target, id }) => {
//               if (
//                 source.parent !== target.parent ||
//                 source.index !== target.index
//               ) {
//                 dispatch(
//                   moveDescriptor(
//                     id as IVariableDescriptor,
//                     target.index,
//                     target.parent as IParentDescriptor,
//                   ),
//                 );
//               }
//             }}
//           >
//             {({ nodeProps }) => (
//               <div style={{ height: '100%' }}>
//                 {variables ? (
//                   variables.map(v => (
//                     <CTree
//                       nodeProps={nodeProps}
//                       key={v}
//                       search={this.state.search}
//                       variableId={v}
//                     />
//                   ))
//                 ) : (
//                   <span>Loading ...</span>
//                 )}
//               </div>
//             )}
//           </Container>
//         </Toolbar.Content>
//       </Toolbar>
//     );
//   }
// }
/**
 * test a variable and children's editorLabel against a text
 */
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
const editingStyle = css({
  borderLeft: `${SELECTED_STYLE_WIDTH}px solid`,
});
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
function CTree(props: {
  variableId: number;
  subPath?: (string)[];
  search: string;
  nodeProps: () => {};
}): JSX.Element {
  const focusTab = React.useContext(focusTabContext);
  return (
    <StoreConsumer
      selector={(state: State) => ({
        props,
        variable: VariableDescriptor.select(props.variableId),
        match: isMatch(props.variableId, props.search),
        editing:
          state.global.editing != null &&
          state.global.editing.type === 'Variable' &&
          props.variableId === state.global.editing.id &&
          shallowIs(props.subPath || [], state.global.editing.path),
      })}
    >
      {({ state, dispatch }) => {
        let { variable } = state;
        if (Array.isArray(props.subPath) && props.subPath.length > 0) {
          variable = get(variable, props.subPath) as IVariableDescriptor;
        }
        if (variable) {
          const Title = asyncSFC(async () => {
            const icon = await getIcon(variable!);
            return (
              <FontAwesome icon={withDefault(icon, 'question')} fixedWidth />
            );
          });
          if (!state.match) {
            return null;
          }
          return (
            <Node
              {...props.nodeProps()}
              header={
                <span
                  className={cx(headerStyle, { [editingStyle]: state.editing })}
                  onClick={() => {
                    focusTab('Editor');
                    if (entityIs<IFSMDescriptor>(variable, 'FSMDescriptor')) {
                      focusTab('StateMachine');
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
                  <span className={nodeContentStyle}>
                    <Title />
                    {editorLabel(variable)}
                  </span>
                  {entityIs<IListDescriptor>(variable, 'ListDescriptor') ||
                  entityIs<IQuestionDescriptor>(
                    variable,
                    'QuestionDescriptor',
                  ) ? (
                    <AddMenuParent
                      variable={variable}
                      dispatch={dispatch}
                      onSelect={() => focusTab('Editor')}
                    />
                  ) : entityIs<IChoiceDescriptor>(
                      variable,
                      'ChoiceDescriptor',
                    ) ? (
                    <AddMenuChoice
                      variable={variable}
                      dispatch={dispatch}
                      onSelect={() => focusTab('Editor')}
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
