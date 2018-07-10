import * as React from 'react';
import PageLoader from '../../../Components/PageLoader';
import { State } from '../../../data/Reducer/reducers';
import SrcEditor from '../SrcEditor';
import { Page } from '../../../data/selectors';
import PageEditorHeader from './PageEditorHeader';
import { Toolbar } from '../../../Components/Toolbar';
import { Actions } from '../../../data';
import { StoreDispatch, StoreConsumer } from '../../../data/store';

interface PageDisplayProps {
  srcMode: boolean;
  defaultPageId?: string;
  dispatch: StoreDispatch;
}
class PageDisplay extends React.Component<
  PageDisplayProps,
  { currentPageId?: string; oldProps: PageDisplayProps }
> {
  static getDerivedStateFromProps(
    nextProps: PageDisplayProps,
    { oldProps }: { oldProps: PageDisplayProps },
  ) {
    if (oldProps === nextProps) {
      return null;
    }
    return { oldProps: nextProps, currentPageId: nextProps.defaultPageId };
  }
  editor?: SrcEditor | null;
  constructor(props: PageDisplayProps) {
    super(props);
    this.state = { oldProps: props, currentPageId: props.defaultPageId };
  }
  render() {
    return (
      <Toolbar>
        <Toolbar.Header>
          <PageEditorHeader key="header" pageId={this.state.currentPageId} />
        </Toolbar.Header>
        <Toolbar.Content>
          {this.props.srcMode ? (
            <Toolbar>
              <Toolbar.Header>
                <button
                  onClick={() => {
                    if (this.editor && this.state.currentPageId != null) {
                      const p = JSON.parse(this.editor.getValue()!);
                      this.props.dispatch(
                        Actions.PageActions.patch(this.state.currentPageId, p),
                      );
                    }
                  }}
                >
                  Save
                </button>
              </Toolbar.Header>
              <Toolbar.Content>
                <SrcEditor
                  ref={n => (this.editor = n)}
                  key="srcEditor"
                  value={JSON.stringify(
                    Page.select(this.state.currentPageId),
                    null,
                    2,
                  )}
                  uri="page.json"
                  language="json"
                />
              </Toolbar.Content>
            </Toolbar>
          ) : (
            <PageLoader id={this.state.currentPageId} key="pageloader" />
          )}
        </Toolbar.Content>
      </Toolbar>
    );
  }
}
export default function ConnectedPageDisplay() {
  return (
    <StoreConsumer
      selector={(s: State) => ({
        srcMode: s.global.pageSrc,
        defaultPageId: Page.selectDefaultId(),
      })}
    >
      {({ state, dispatch }) => <PageDisplay {...state} dispatch={dispatch} />}
    </StoreConsumer>
  );
}
