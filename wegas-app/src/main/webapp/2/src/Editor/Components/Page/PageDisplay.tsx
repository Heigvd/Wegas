import * as React from 'react';
import PageLoader from '../../../Components/AutoImport/PageLoader';
import { State } from '../../../data/Reducer/reducers';
import PageEditorHeader from './PageEditorHeader';
import { Toolbar } from '../../../Components/Toolbar';
import { Actions } from '../../../data';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { Theme } from '../../../Components/Theme';
import SrcEditor from '../ScriptEditors/SrcEditor';

interface PageDisplayProps {
  srcMode: boolean;
  pageId?: string;
  dispatch: StoreDispatch;
}
class PageDisplay extends React.Component<PageDisplayProps> {
  editorValue: string = '';
  onSave = (value: string) => {
    if (this.props.pageId != null) {
      try {
        const p = JSON.parse(value);
        this.props.dispatch(Actions.PageActions.patch(this.props.pageId, p));
      } catch (e) {
        alert(`There's a syntax error in your script : \n${e}`);
      }
    }
  };
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
                <button onClick={() => this.onSave(this.editorValue)}>
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
                    this.editorValue = JSON.stringify(state, null, 2);
                    return (
                      <SrcEditor
                        key="SrcEditor"
                        value={this.editorValue}
                        defaultUri="internal://page.json"
                        language="json"
                        onChange={val => {
                          this.editorValue = val;
                        }}
                        onSave={this.onSave}
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
