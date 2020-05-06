import * as React from 'react';
import {
  Tree,
  TreeNode,
  DropResult,
} from '../Editor/Components/Views/TreeView/TreeView';
import { flexColumn, flex } from '../css/classes';
import { cx } from 'emotion';

const TREENODE_TEST_TYPE = 'TEST_TYPE';

export default function NewTreeViewTester() {
  const [dropResult, setDropResult] = React.useState<DropResult<string>>();
  return (
    <div className={cx(flex, flexColumn)}>
      <div>Drop result : {JSON.stringify(dropResult)}</div>
      <Tree id={''} type={TREENODE_TEST_TYPE} onDrop={setDropResult}>
        {getParentProps => (
          <>
            <TreeNode {...getParentProps()} id="1" title="Stage 1">
              {getParentProps => (
                <>
                  <TreeNode {...getParentProps()} id="1,1" title="Stage 1 1">
                    Content 1
                  </TreeNode>
                  <TreeNode {...getParentProps()} id="1,2" title="Stage 1 2">
                    {getParentProps => (
                      <TreeNode
                        {...getParentProps()}
                        id="1,2,1"
                        title="Stage 1 2 1"
                      >
                        {getParentProps => (
                          <TreeNode
                            {...getParentProps()}
                            id="1,2,1,1"
                            title="Stage 1 2 1 1"
                          >
                            Content 2
                          </TreeNode>
                        )}
                      </TreeNode>
                    )}
                  </TreeNode>
                  <TreeNode {...getParentProps()} id="1,3" title="Stage 1 3">
                    Content 3
                  </TreeNode>
                </>
              )}
            </TreeNode>
            <TreeNode {...getParentProps()} id="2" title="Stage 2">
              Content 4
            </TreeNode>
          </>
        )}
      </Tree>
    </div>
  );
}