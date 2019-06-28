import * as React from 'react';
import PageLoader from '../../../Components/AutoImport/PageLoader';
import { State } from '../../../data/Reducer/reducers';
import PageEditorHeader from './PageEditorHeader';
import { Toolbar } from '../../../Components/Toolbar';
import { Actions } from '../../../data';
import { StoreDispatch, StoreConsumer } from '../../../data/store';
import { Theme } from '../../../Components/Theme';
import SrcEditor from '../ScriptEditors/SrcEditor';
import { css } from 'emotion';
import { KeyMod, KeyCode } from 'monaco-editor';
import { Modal } from '../../../Components/Modal';

const fullHeight = css({
  height: '100%',
});

interface PageDisplayProps {
  srcMode: boolean;
  pageId?: string;
  dispatch: StoreDispatch;
}
interface PageDisplayState {
  jsEditing: boolean;
}

class PageDisplay extends React.Component<PageDisplayProps, PageDisplayState> {
  readonly state: PageDisplayState = {
    jsEditing: false,
  };
  readonly userLibFile = '../../../Components/AutoImport/Userscript.d.ts';

  editorValue: string = '';
  jsContent: string = '';
  cursorOffset: number = 0;
  codeInit: number = 0;
  codeEnd: number = 0;

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
          <PageEditorHeader key="header" pageId={pageId} />
        </Toolbar.Header>
        <Toolbar.Content>
          {this.props.srcMode ? (
            <StoreConsumer<{
              content: Readonly<Page> | undefined;
              editing: boolean;
            }>
              selector={s => {
                return {
                  content: pageId ? s.pages[pageId] : undefined,
                  editing: this.state.jsEditing,
                };
              }}
            >
              {({ state, dispatch }) => {
                if (state == null && pageId != null) {
                  dispatch(Actions.PageActions.get(pageId));
                }
                this.editorValue = this.editorValue
                  ? this.editorValue
                  : JSON.stringify(state.content, null, 2);
                return (
                  <Toolbar className={fullHeight}>
                    <Toolbar.Header>
                      <button onClick={() => this.onSave(this.editorValue)}>
                        Save
                      </button>
                    </Toolbar.Header>
                    <Toolbar.Content>
                      {state.editing && (
                        <Modal>
                          <div
                            style={{
                              height: '50vh',
                              width: '50vw',
                            }}
                          >
                            <SrcEditor
                              value={this.jsContent}
                              language={'typescript'}
                              onChange={value => {
                                this.jsContent = value;
                              }}
                              defaultFocus={true}
                              defaultExtraLibs={[
                                {
                                  content:
                                    'declare function variable(variableName: string): number | string;\n',
                                  name: 'Userscript.d.ts',
                                },
                              ]}
                            />
                            <button
                              onClick={() => {
                                this.cursorOffset =
                                  this.codeInit + this.jsContent.length;
                                this.editorValue =
                                  this.editorValue.substring(0, this.codeInit) +
                                  this.jsContent
                                    .replace(/"/g, '\\"')
                                    .replace(/\r?\n/g, '\u2006') +
                                  this.editorValue.substring(this.codeEnd);
                                this.setState({ jsEditing: false });
                              }}
                            >
                              Accept
                            </button>
                          </div>
                        </Modal>
                      )}
                      <SrcEditor
                        value={this.editorValue}
                        defaultUri="internal://page.json"
                        language="json"
                        onChange={val => {
                          this.editorValue = val;
                        }}
                        onSave={this.onSave}
                        cursorOffset={this.cursorOffset}
                        defaultFocus={true}
                        defaultKeyEvents={[
                          {
                            keys: KeyMod.Alt | KeyCode.RightArrow,
                            event: editor => {
                              const cursorPosition = editor.getPosition();
                              const model = editor.getModel();
                              if (cursorPosition && model) {
                                const editorContent = editor.getValue();
                                const charPosition = model.getOffsetAt(
                                  cursorPosition,
                                );

                                const codeInit =
                                  charPosition -
                                  editorContent
                                    .substring(0, charPosition)
                                    .split('')
                                    .reverse()
                                    .join('')
                                    .search(/"(?!\\)/);
                                const codeEnd =
                                  charPosition +
                                  editorContent
                                    .substr(charPosition)
                                    .search(/(?<!\\)"/);
                                this.codeInit = codeInit;
                                this.codeEnd = codeEnd;
                                this.jsContent = editorContent
                                  .substring(codeInit, codeEnd)
                                  .replace(/\\"/g, '"')
                                  .replace(/\u2006/g, '\r\n');
                                this.setState({ jsEditing: true });
                              }
                            },
                          },
                        ]}
                      />
                    </Toolbar.Content>
                  </Toolbar>
                );
              }}
            </StoreConsumer>
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
