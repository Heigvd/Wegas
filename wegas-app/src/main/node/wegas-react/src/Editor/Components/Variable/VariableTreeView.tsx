import * as React from 'react';
import { Actions } from '../../../data';
import { Toolbar } from '../../../Components/Toolbar';
import { moveDescriptor } from '../../../data/Reducer/VariableDescriptorReducer';
import { getIcon, getClassLabel, getChildren } from '../../editionConfig';
import { StoreDispatch, useStore, store } from '../../../data/Stores/store';
import { css, cx } from '@emotion/css';
import { DropMenu } from '../../../Components/DropMenu';
import { withDefault, IconComp } from '../Views/FontAwesome';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { useAsync } from '../../../Components/Hooks/useAsync';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { Edition } from '../../../data/Reducer/globalState';
import { mainLayoutId } from '../Layout';
import {
  flex,
  toolboxHeaderStyle,
  flexRow,
  flexBetween,
} from '../../../css/classes';
import { IVariableDescriptor } from 'wegas-ts-api';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { isActionAllowed } from '../../../Components/PageComponents/tools/options';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { useOkCancelModal } from '../../../Components/Modal';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';
import { Toggler } from '../../../Components/Inputs/Boolean/Toggler';
import { useDebounceFn } from '../../../Components/Hooks/useDebounce';
import { OnMoveFn, TreeView } from '../../../Components/TreeView/TreeView';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { CTree } from './CTree';

export const TREEVIEW_ITEM_TYPE = 'TREEVIEW_VARIABLE_ITEM';

const TREECONTENTID = 'TREECONTENT';

const itemsPromise = getChildren({ '@class': 'ListDescriptor' }).then(
  children =>
    children.map(i => {
      const Label = asyncSFC(async () => {
        const entity = { '@class': i };
        return (
          <>
            <IconComp
              icon={withDefault(getIcon(entity), 'question')}
              className={css({ marginRight: '3px' })}
            />
            {getClassLabel(entity)}
          </>
        );
      });
      return {
        label: <Label />,
        value: i,
      };
    }),
);

export interface SharedTreeProps extends DisabledReadonly {
  noHeader?: boolean;
  noVisibleRoot?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
}

interface TreeProps extends SharedTreeProps {
  root: IParentDescriptor;
  noHeader?: boolean;
  noVisibleRoot?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: StoreDispatch;
  forceLocalDispatch?: boolean;
}

export function VariableTreeView({
  root,
  noHeader = false,
  noVisibleRoot = false,
  localState,
  localDispatch,
  forceLocalDispatch,
  ...options
}: TreeProps) {
  const [onAccept, setOnAccept] = React.useState(() => () => {});
  const [openNodes, setOpenNodes] = React.useState<{
    [path: string]: boolean | undefined;
  }>({});

  const { data } = useAsync(itemsPromise);
  const { showModal, OkCancelModal } = useOkCancelModal(TREECONTENTID);
  const i18nValues = useInternalTranslate(commonTranslations);

  const globalDispatch = store.dispatch;
  const actionAllowed = isActionAllowed(options);
  const { value, deep } = useStore(
    s => ({
      value: s.global.search.value,
      deep: s.global.search.deep,
    }),
    deepDifferent,
  );

  const searchFn = useDebounceFn(
    (value: string) =>
      globalDispatch(
        value.length < 2
          ? Actions.EditorActions.clearSearch()
          : Actions.EditorActions.search(value),
      ),
    500,
  );

  const onMove: OnMoveFn<IVariableDescriptor> = React.useCallback(
    (from, to) => {
      const movedVariable = from.data;
      const index = to.path.pop();
      const parentVariable = to.data;

      if (movedVariable != null && index != null) {
        let dispatch = store.dispatch;
        if (forceLocalDispatch && localDispatch) {
          dispatch = localDispatch;
        }
        dispatch(
          moveDescriptor(
            movedVariable,
            index,
            to.id !== String(root.id)
              ? (parentVariable as unknown as IParentDescriptor)
              : undefined,
          ),
        );
      }
    },
    [forceLocalDispatch, localDispatch, root.id],
  );

  return (
    <Toolbar className={css({ padding: '1.5em' })}>
      <Toolbar.Header className={cx(toolboxHeaderStyle, flexBetween)}>
        {!noHeader && actionAllowed && (
          <>
            <DropMenu
              tooltip={i18nValues.add}
              items={data || []}
              icon="plus"
              onSelect={(i, e) => {
                if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
                  localDispatch(Actions.EditorActions.createVariable(i.value));
                } else {
                  globalDispatch(Actions.EditorActions.createVariable(i.value));
                  focusTab(mainLayoutId, 'Variable Properties');
                }
              }}
            />
            <div className={cx(flex, flexRow)}>
              <SimpleInput
                value={value}
                placeholder={i18nValues.filter}
                aria-label="Filter"
                onChange={ev => searchFn(String(ev))}
              />
              <Toggler
                className={css({
                  fontSize: '14px',
                  lineHeight: '100%',
                  justifyContent: 'flex-end',
                  marginLeft: '5px',
                })}
                label={i18nValues.deepSearch}
                value={deep}
                onChange={value =>
                  globalDispatch(Actions.EditorActions.searchSetDeep(value))
                }
              />
            </div>
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content id={TREECONTENTID} className={css({ padding: '1px' })}>
        <OkCancelModal onOk={onAccept}>
          <p>{i18nValues.changesWillBeLost}</p>
          <p>{i18nValues.areYouSure}</p>
        </OkCancelModal>
        <TreeView
          rootId={String(root.id)}
          rootData={root as unknown as IVariableDescriptor}
          onMove={onMove}
          nodeManagement={{
            openNodes,
            setOpenNodes,
          }}
        >
          {root.itemsIds ? (
            root.itemsIds.map(id => (
              <CTree
                onShowWarning={onOk => {
                  setOnAccept(() => onOk);
                  showModal();
                }}
                key={id}
                variableId={id}
                noVisibleRoot={noVisibleRoot}
                localState={localState}
                localDispatch={localDispatch}
                forceLocalDispatch={forceLocalDispatch}
                {...options}
              />
            ))
          ) : (
            <span>{`${i18nValues.loading} ...`}</span>
          )}
        </TreeView>
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function TreeWithMeta() {
  const root = useGameModel();
  return (
    <ComponentWithForm entityEditor>
      {({ localState, localDispatch }) => {
        return (
          <VariableTreeView
            root={root}
            localState={localState}
            localDispatch={localDispatch}
          />
        );
      }}
    </ComponentWithForm>
  );
}