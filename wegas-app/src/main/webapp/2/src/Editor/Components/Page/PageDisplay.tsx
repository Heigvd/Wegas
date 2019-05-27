import * as React from 'react';
import PageLoader from '../../../Components/AutoImport/PageLoader';
import { State } from '../../../data/Reducer/reducers';
import SrcEditor, { EditorProps } from '../ScriptEditors/SrcEditor';
import PageEditorHeader from './PageEditorHeader';
import { Toolbar } from '../../../Components/Toolbar';
import { Actions } from '../../../data';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { Theme } from '../../../Components/Theme';

interface PageDisplayProps {
  srcMode: boolean;
  pageId?: string;
  dispatch: StoreDispatch;
}
class PageDisplay extends React.Component<PageDisplayProps> {
  editor?: (props: EditorProps) => JSX.Element | null;
  render() {
    const { pageId } = this.props;
    return (
      <Toolbar>
        <Toolbar.Header>
          <PageEditorHeader key="header" pageId={this.props.pageId} />
        </Toolbar.Header>
        <Toolbar.Content>
          {this.props.srcMode ? (
            <Toolbar>
              <Toolbar.Header>
                <button
                  onClick={() => {
                    if (this.editor && this.props.pageId != null) {
                      const p = JSON.parse(this.editor.getValue()!); // THIS IS BAD!
                      this.props.dispatch(
                        Actions.PageActions.patch(this.props.pageId, p),
                      );
                    }
                  }}
                >
                  Save
                </button>
              </Toolbar.Header>
              <Toolbar.Content>
                <StoreConsumer<Readonly<Page> | undefined>
                  selector={s => (pageId ? s.pages[pageId] : undefined)}
                >
                  {({ state, dispatch }) => {
                    if (state == null && pageId != null) {
                      dispatch(Actions.PageActions.get(pageId));
                    }
                    return (
                      // Need to find a workaround here....
                      <SrcEditor
                        ref={n => (this.editor = n)}
                        key="srcEditor"
                        value={JSON.stringify(state, null, 2)}
                        uri="internal://page.json"
                        language="json"
                      />
                    );
                  }}
                </StoreConsumer>
              </Toolbar.Content>
            </Toolbar>
          ) : (
            <Theme
            // @TODO Load user theme!
            >
              <PageLoader id={this.props.pageId} key="pageloader" />
            </Theme>
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
        pageId: s.global.currentPageId,
      })}
    >
      {({ state, dispatch }) => <PageDisplay {...state} dispatch={dispatch} />}
    </StoreConsumer>
  );
}
