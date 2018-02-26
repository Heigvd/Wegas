import * as React from 'react';
import PageLoader from '../../../Components/PageLoader';
import { connect, Dispatch } from 'react-redux';
import { State } from '../../../data/Reducer/reducers';
import SrcEditor from '../SrcEditor';
import { Page } from '../../../data/selectors';
import PageEditorHeader from './PageEditorHeader';
import { WithToolbar } from '../Views/Toolbar';
import { Actions } from '../../../data';

interface PageDisplayProps {
  srcMode: boolean;
  defaultPageId: string;
  dispatch: Dispatch<State>;
}
class PageDisplay extends React.Component<
  PageDisplayProps,
  { currentPageId: string }
> {
  editor?: SrcEditor | null;
  constructor(props: PageDisplayProps) {
    super(props);
    this.state = { currentPageId: props.defaultPageId };
  }
  componentWillReceiveProps(nextProps: PageDisplayProps) {
    if (this.props.defaultPageId === undefined) {
      this.setState({
        currentPageId: nextProps.defaultPageId,
      });
    }
  }
  render() {
    return (
      <WithToolbar>
        <WithToolbar.Toolbar>
          <PageEditorHeader key="header" pageId={this.state.currentPageId} />
        </WithToolbar.Toolbar>
        <WithToolbar.Content>
          {this.props.srcMode ? (
            <WithToolbar>
              <WithToolbar.Toolbar>
                <button
                  onClick={() => {
                    if (this.editor) {
                      const p = JSON.parse(this.editor.getValue()!);
                      this.props.dispatch(
                        Actions.PageActions.patch(this.state.currentPageId, p),
                      );
                    }
                  }}
                >
                  Save
                </button>
              </WithToolbar.Toolbar>
              <WithToolbar.Content>
                <SrcEditor
                  ref={n => (this.editor = n)}
                  key="srcEditor"
                  value={JSON.stringify(
                    Page.select(this.state.currentPageId),
                    null,
                    2,
                  )}
                  language="json"
                />
              </WithToolbar.Content>
            </WithToolbar>
          ) : (
            <PageLoader id={this.state.currentPageId} key="pageloader" />
          )}
        </WithToolbar.Content>
      </WithToolbar>
    );
  }
}
export default connect(
  (state: State) => ({
    srcMode: state.global.pageSrc,
    defaultPageId: Page.selectDefaultId(),
  }),
  dispatch => ({ dispatch }),
)(PageDisplay);
