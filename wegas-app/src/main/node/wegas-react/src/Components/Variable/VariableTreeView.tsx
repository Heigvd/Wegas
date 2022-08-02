import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IVariableDescriptor } from 'wegas-ts-api';
import {
  defaultToolboxHeaderStyle,
  flex,
  flexBetween,
  flexRow,
} from '../../css/classes';
import { Actions } from '../../data';
import { createVariable, Edition } from '../../data/Reducer/editingState';
import { moveDescriptor } from '../../data/Reducer/VariableDescriptorReducer';
import {
  editingStore,
  EditingStoreDispatch,
} from '../../data/Stores/editingStore';
import { store, useStore } from '../../data/Stores/store';
import { mainLayoutId } from '../../Editor/layouts';
import { commonTranslations } from '../../i18n/common/common';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { DropMenu } from '../DropMenu';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { deepDifferent } from '../Hooks/storeHookFactory';
import { useDebounceFn } from '../Hooks/useDebounce';
import { useGameModel } from '../Hooks/useGameModel';
import { IconButton } from '../Inputs/Buttons/IconButton';
import { SimpleInput } from '../Inputs/SimpleInput';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { useOnEditionChangesModal } from '../Modal';
import { isActionAllowed } from '../PageComponents/tools/options';
import { themeVar } from '../Theme/ThemeVars';
import { Toolbar } from '../Toolbar';
import { OnMoveFn, TreeView } from '../TreeView/TreeView';
import { IconComp } from '../Views/FontAwesome';
import { buildMenuItems } from './AddMenu';
import { CTree } from './CTree';

const addVariableContainerStyle = css({
  position: 'absolute',
  left: '1.5rem',
  bottom: '5px',
  // zIndex: 1,
});
const addVariableButtonStyle = css({
  height: '2rem',
  boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.5)',
  padding: '5px 5px',
});
const deepSearchButtonOffStyle = css({
  color: themeVar.colors.DisabledColor,
  '&:hover, &:focus': { color: themeVar.colors.DisabledColor },
});
export const TREEVIEW_ITEM_TYPE = 'TREEVIEW_VARIABLE_ITEM';

const TREECONTENTID = 'TREECONTENT';

export interface SharedTreeProps extends DisabledReadonly {
  noHeader?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: EditingStoreDispatch;
  forceLocalDispatch?: boolean;
}

interface TreeProps extends SharedTreeProps {
  root: IParentDescriptor;
  noHeader?: boolean;
  localState?: Readonly<Edition> | undefined;
  localDispatch?: EditingStoreDispatch;
  forceLocalDispatch?: boolean;
}

export function VariableTreeView({
  root,
  noHeader = false,
  localState,
  localDispatch,
  forceLocalDispatch,
  ...options
}: TreeProps) {
  const [openNodes, setOpenNodes] = React.useState<{
    [path: string]: boolean | undefined;
  }>({});

  const data = buildMenuItems(root);

  const i18nValues = useInternalTranslate(commonTranslations);

  const globalDispatch = editingStore.dispatch;
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
      store.dispatch(
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
        let dispatch = editingStore.dispatch;
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

  const onEditionChanges = useOnEditionChangesModal(
    forceLocalDispatch,
    localState,
    localDispatch,
  );

  return (
    <Toolbar>
      <Toolbar.Header className={defaultToolboxHeaderStyle}>
        {!noHeader && actionAllowed && (
          <>
            <div className={cx(flex, flexRow, flexBetween)}>
              <SimpleInput
                value={value}
                placeholder={i18nValues.filter}
                aria-label="Filter"
                onChange={ev => searchFn(String(ev))}
              />
              <IconButton
                icon="search"
                mask="folder"
                transform="shrink-9 down-1"
                className={cx(
                  css({
                    fontSize: '28px',
                    color: themeVar.colors.PrimaryColor,
                    '&:hover, &:focus': { color: themeVar.colors.PrimaryColor },
                  }),
                  { [deepSearchButtonOffStyle]: !deep },
                )}
                tooltip={i18nValues.deepSearch}
                onClick={() => {
                  store.dispatch(Actions.EditorActions.searchSetDeep(!deep));
                }}
              />
            </div>
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content
        id={TREECONTENTID}
        className={css({
          padding: '1px',
          overflowY: 'auto',
          overflowX: 'hidden',
        })}
      >
        <TreeView
          className={css({ paddingBottom: '3rem' })}
          rootId={String(root.id)}
          rootData={root as unknown as IVariableDescriptor}
          onMove={onMove}
          nodeManagement={{
            openNodes,
            setOpenNodes,
          }}
          acceptTypes={[TREEVIEW_ITEM_TYPE]}
        >
          {root.itemsIds ? (
            root.itemsIds.map(id => (
              <CTree
                key={id}
                variableId={id}
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
        <DropMenu
          tooltip={i18nValues.addVariable}
          items={data || []}
          label={<IconComp icon="plus" />}
          onSelect={(i, e) => {
            onEditionChanges(0, e, e => {
              if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
                localDispatch(createVariable(i.value, root));
              } else {
                globalDispatch(createVariable(i.value, root));
                focusTab(mainLayoutId, 'Variable Properties');
              }
            });
          }}
          containerClassName={addVariableContainerStyle}
          buttonClassName={addVariableButtonStyle}
        />
      </Toolbar.Content>
    </Toolbar>
  );
}

export default function TreeWithMeta() {
  const root = useGameModel();
  return (
    <ComponentWithForm>
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
