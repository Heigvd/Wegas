import * as React from 'react';
import { IconButton } from '../../Components/Inputs/Buttons/IconButton';
import { Modal } from '../../Components/Modal';
import { Actions } from '../../data';
import { editorLabel } from '../../data/methods/VariableDescriptorMethods';
import { State } from '../../data/Reducer/reducers';
import { VariableDescriptor } from '../../data/selectors';
import { StoreConsumer, StoreDispatch } from '../../data/store';
import { getEntityActions, getIcon } from '../editionConfig';
import { asyncSFC } from '../../Components/HOC/asyncSFC';
import { withDefault, IconComp } from './Views/FontAwesome';
import { css } from 'emotion';
import { entityIs } from '../../data/entities';
import { focusTabContext } from './LinearTabLayout/LinearLayout';
import { mainLayoutId } from './Layout';

interface SearchPanelProps {
  search: State['global']['search'];
  dispatch: StoreDispatch;
}
const resultStyle = css({
  listStyle: 'none',
  cursor: 'pointer',
});

function SearchResult({
  vId,
  onClick,
  variable,
}: {
  vId: number;
  onClick: () => void;
  variable: IVariableDescriptor;
}) {
  const focusTab = React.useContext(focusTabContext);
  const Title = asyncSFC(async () => (
    <IconComp icon={withDefault(getIcon(variable!), 'question')} />
  ));
  return (
    <li
      key={vId}
      className={resultStyle}
      onClick={() => {
        if (entityIs(variable, 'AbstractStateMachineDescriptor')) {
          focusTab('StateMachine', mainLayoutId);
        }
        onClick();
      }}
    >
      <Title />
      {editorLabel(variable)}
    </li>
  );
}

class SearchPanel extends React.Component<
  SearchPanelProps,
  { show: boolean; searchField: string }
> {
  readonly state = {
    show: false,
    searchField: '',
  };
  togglePanel = () => {
    this.setState(({ show }) => ({ show: !show }));
  };
  searchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchField: e.target.value,
    });
  };
  componentDidUpdate(prevProps: SearchPanelProps) {
    if (
      this.props.search !== prevProps.search &&
      this.props.search.type !== 'NONE'
    ) {
      // Search changed to something
      this.setState({
        show: true,
      });
    }
  }
  searchTitle() {
    const { search } = this.props;
    switch (search.type) {
      case 'NONE':
        return <div>Deep search in variables</div>;
      case 'ONGOING':
        return <div>Search in progress</div>;
      case 'USAGE': {
        const variable = VariableDescriptor.select(search.value);
        return (
          <div>
            Usage of "
            {variable === undefined ? 'undefined' : editorLabel(variable)}"
          </div>
        );
      }
      case 'GLOBAL':
        return <div>Search result "{search.value}"</div>;
    }
  }
  searchResult() {
    const { search } = this.props;
    if (search.type === 'NONE' || search.type === 'ONGOING') {
      return null;
    }
    return search.result.map(vId => {
      const variable = VariableDescriptor.select(vId);
      if (variable === undefined) {
        return (
          <li key={vId} className={resultStyle}>
            Unknown variable with id "{vId}"
          </li>
        );
      }
      return (
        <SearchResult
          key={vId}
          vId={vId}
          onClick={() =>
            this.setState({ show: false }, () =>
              getEntityActions(variable).then(({ edit }) =>
                this.props.dispatch(edit(variable)),
              ),
            )
          }
          variable={variable}
        />
      );
    });
  }
  modalContent() {
    const { search } = this.props;

    return (
      <>
        {this.searchTitle()}
        <form onSubmit={e => e.preventDefault()}>
          {search.type !== 'USAGE' && (
            <>
              <input
                placeholder="Search"
                type="search"
                value={this.state.searchField}
                onChange={this.searchChange}
              />
              <IconButton
                tooltip="Submit"
                icon="check"
                type="submit"
                onClick={() =>
                  this.props.dispatch(
                    Actions.EditorActions.searchGlobal(this.state.searchField),
                  )
                }
              />
            </>
          )}
          {search.type !== 'NONE' && (
            <IconButton
              tooltip="Reset search"
              icon="eraser"
              onClick={() =>
                this.setState({ searchField: '' }, () =>
                  this.props.dispatch(Actions.EditorActions.searchClear()),
                )
              }
            />
          )}
        </form>
        <ul>{this.searchResult()}</ul>
      </>
    );
  }
  render() {
    return (
      <>
        <IconButton
          icon={{ icon: 'search', mask: 'cloud' }}
          tooltip="Cloud search"
          onClick={this.togglePanel}
        />
        {this.state.show && (
          <Modal onExit={this.togglePanel}>{this.modalContent()}</Modal>
        )}
      </>
    );
  }
}
export function SearchTool() {
  return (
    <StoreConsumer selector={(s: State) => s.global.search}>
      {({ state, dispatch }) => (
        <SearchPanel search={state} dispatch={dispatch} />
      )}
    </StoreConsumer>
  );
}
