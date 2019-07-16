import * as React from 'react';
import { css } from 'emotion';
import Header from './Header';
import { DndLinearLayout, Item, Layout } from './LinearTabLayout/LinearLayout';
import StateMachineEditor from './StateMachineEditor';
import PageDisplay from './Page/PageDisplay';
import TreeView from './Variable/VariableTree';
import Editor from './EntityEditor';

const layout = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export default class AppLayout extends React.Component<
  {},
  { editable: boolean }
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      editable: false,
    };
  }
  render() {
    return (
      <div className={layout}>
        <Header />
        <DndLinearLayout
          tabs={[
            <Item key="Variables" label="Variables">
              <TreeView />
            </Item>,
            <Item key="Page" label="Page">
              <PageDisplay />
            </Item>,
            <Item key="StateMachine" label="StateMachine">
              <StateMachineEditor />
            </Item>,
            <Item key="Editor" label="Editor">
              <Editor />
            </Item>,
          ]}
        >
          <Layout>
            <Item key="Variables" label="Variables">
              <TreeView />
            </Item>
          </Layout>
          <Layout>
            <Item key="Page" label="Page">
              <PageDisplay />
            </Item>
            <Item key="StateMachine" label="StateMachine">
              <StateMachineEditor />
            </Item>
          </Layout>
          <Layout>
            <Item key="Editor" label="Editor">
              <Editor />
            </Item>
          </Layout>
        </DndLinearLayout>
      </div>
    );
  }
}
