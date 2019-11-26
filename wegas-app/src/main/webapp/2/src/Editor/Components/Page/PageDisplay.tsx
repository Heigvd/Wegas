import * as React from 'react';
import PageLoader from '../../../Components/AutoImport/PageLoader';
import { State } from '../../../data/Reducer/reducers';
import PageEditorHeader from './PageEditorHeader';
import { Toolbar } from '../../../Components/Toolbar';
import { Actions } from '../../../data';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import {
  JSONandJSEditor,
  OnSaveStatus,
} from '../ScriptEditors/JSONandJSEditor';
import { ThemeProvider } from '../../../Components/Theme';

interface PageDisplayProps {
  srcMode: boolean;
  pageId?: string;
  dispatch: StoreDispatch;
}
class PageDisplay extends React.Component<PageDisplayProps> {
  constructor(props: PageDisplayProps) {
    super(props);
    this.state = { modalState: { type: 'close' } };
  }

  render() {
    const { pageId } = this.props;
    return (
      <Toolbar>
        <Toolbar.Header>
          <PageEditorHeader key="header" pageId={pageId} />
        </Toolbar.Header>
        <Toolbar.Content>
          {this.props.srcMode ? (
            <StoreConsumer<{
              content: Readonly<Page> | undefined;
            }>
              selector={s => {
                return {
                  content: pageId ? s.pages[pageId] : undefined,
                };
              }}
            >
              {({ state, dispatch }) => {
                if (state == null && pageId != null) {
                  dispatch(Actions.PageActions.get(pageId));
                }

                const onSave = (value: string): OnSaveStatus => {
                  if (pageId != null) {
                    try {
                      const p = JSON.parse(value);
                      dispatch(Actions.PageActions.patch(pageId, p));
                      return { status: 'succes', text: 'Page saved' };
                    } catch (e) {
                      const message = String(e.message);
                      const textToFind = 'at position ';
                      const position = Number(
                        message
                          .replace(textToFind, '')
                          .substring(message.indexOf(textToFind)),
                      );
                      const line = String(
                        value.substring(0, position).split('\n').length,
                      );
                      return {
                        status: 'error',
                        text: `Not saved!\n${message}\nLine number : ${line}`,
                      };
                    }
                  } else {
                    return { status: 'warning', text: 'No page selected' };
                  }
                };

                return (
                  <JSONandJSEditor
                    content={JSON.stringify(state.content, null, 2)}
                    onSave={onSave}
                  />
                );
              }}
            </StoreConsumer>
          ) : (
            <ThemeProvider
              contextName="player"
              // @TODO Load user theme!
            >
              <PageLoader id={this.props.pageId} key="pageloader" />
            </ThemeProvider>
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
