import * as React from 'react';
import {
  Tree,
  TreeNode,
  DropResult,
} from '../Editor/Components/Views/TreeView/TreeView';
import {
  flexColumn,
  flex,
  grow,
  flexDistribute,
  itemCenter,
  flexRow,
  expandBoth,
} from '../css/classes';
import { cx } from 'emotion';
import { useDrag, useDrop } from 'react-dnd';
import { wlog } from '../Helper/wegaslog';

const TREENODE_TEST_TYPE = 'TEST_TYPE';
const GREE_TEST_TYPE = 'GREE_TEST_TYPE';
const YELLOW_TEST_TYPE = 'YELLOW_TEST_TYPE';

export default function NewTreeViewTester() {
  const [dropResult, setDropResult] = React.useState<DropResult<string>>();

  const [, greenDrag] = useDrag({
    item: { type: GREE_TEST_TYPE },
  });
  const [, yellowDrag] = useDrag({
    item: { type: YELLOW_TEST_TYPE },
  });

  const [, dropSquare] = useDrop({
    accept: [GREE_TEST_TYPE, YELLOW_TEST_TYPE],
    drop: e => wlog('DROPPED ' + e),
  });

  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div className={cx(flex, flexColumn, grow)}>
        <div>Drop result : {JSON.stringify(dropResult)}</div>
        <Tree
          id={''}
          type={TREENODE_TEST_TYPE}
          onDrop={r => {
            setDropResult(r);
          }}
        >
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
              <TreeNode
                {...getParentProps()}
                id="3"
                title="Multitype dropper"
                acceptType={[
                  TREENODE_TEST_TYPE,
                  GREE_TEST_TYPE,
                  YELLOW_TEST_TYPE,
                ]}
              >
                {getParentProps => (
                  <>
                    <TreeNode
                      {...getParentProps()}
                      id="3"
                      title="Multitype dropper"
                      acceptType={[
                        TREENODE_TEST_TYPE,
                        GREE_TEST_TYPE,
                        YELLOW_TEST_TYPE,
                      ]}
                    >
                      Multitype dropper
                    </TreeNode>
                    <TreeNode
                      {...getParentProps()}
                      id="3"
                      title="Multitype dropper"
                      acceptType={[
                        TREENODE_TEST_TYPE,
                        GREE_TEST_TYPE,
                        YELLOW_TEST_TYPE,
                      ]}
                    >
                      Multitype dropper
                    </TreeNode>
                  </>
                )}
              </TreeNode>
            </>
          )}
        </Tree>
      </div>
      <div className={cx(flex, flexColumn, grow)}>
        <div>Drop result : {JSON.stringify(dropResult)}</div>
        <Tree
          id={''}
          type={TREENODE_TEST_TYPE}
          onDrop={r => {
            setDropResult(r);
          }}
        >
          {getParentProps => (
            <TreeNode {...getParentProps()} id="1" title="Stage 1">
              Single stage
            </TreeNode>
          )}
        </Tree>
      </div>
      <div className={cx(flex, flexDistribute, itemCenter, grow)}>
        <div
          ref={greenDrag}
          style={{ backgroundColor: 'green', width: '50px', height: '50px' }}
        ></div>
        <div
          ref={yellowDrag}
          style={{ backgroundColor: 'yellow', width: '50px', height: '50px' }}
        ></div>
        <div
          ref={dropSquare}
          style={{
            backgroundColor: 'lightpink',
            width: '200px',
            height: '200px',
          }}
        >
          Drop squares here
        </div>
      </div>
    </div>
  );
}
