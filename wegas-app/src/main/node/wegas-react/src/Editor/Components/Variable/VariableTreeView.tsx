import { css, cx } from '@emotion/css';
import * as React from 'react';
import { IVariableDescriptor } from 'wegas-ts-api';
import { DropMenu } from '../../../Components/DropMenu';
import { asyncSFC } from '../../../Components/HOC/asyncSFC';
import { deepDifferent } from '../../../Components/Hooks/storeHookFactory';
import { useAsync } from '../../../Components/Hooks/useAsync';
import { useDebounceFn } from '../../../Components/Hooks/useDebounce';
import { useGameModel } from '../../../Components/Hooks/useGameModel';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { SimpleInput } from '../../../Components/Inputs/SimpleInput';
import { isActionAllowed } from '../../../Components/PageComponents/tools/options';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import { OnMoveFn, TreeView } from '../../../Components/TreeView/TreeView';
import {
  defaultPadding,
  flex,
  flexBetween,
  flexRow,
  toolboxHeaderStyle,
} from '../../../css/classes';
import { Actions } from '../../../data';
import { Edition } from '../../../data/Reducer/globalState';
import { moveDescriptor } from '../../../data/Reducer/VariableDescriptorReducer';
import { store, StoreDispatch, useStore } from '../../../data/Stores/store';
import { commonTranslations } from '../../../i18n/common/common';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { getChildren, getClassLabel, getIcon } from '../../editionConfig';
import { mainLayoutId } from '../../layouts';
import { ComponentWithForm } from '../FormView/ComponentWithForm';
import { focusTab } from '../LinearTabLayout/LinearLayout';
import { IconComp, withDefault } from '../Views/FontAwesome';
import { CTree } from './CTree';

const addVariableContainerStyle = css({
  position: 'absolute',
  left: 0,
  bottom: 0,
  width: '100%',
  zIndex: 1,
});
const addVariableButtonStyle = css({
  width: '100%',
  borderRadius: 0,
  height: '2rem',
});
const deepSearchButtonOffStyle = css({
  color: themeVar.colors.DisabledColor,
  '&:hover, &:focus': { color: themeVar.colors.DisabledColor },
});
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
            <p>{getClassLabel(entity)}</p>
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
  // const { showModal } = React.useContext(modalCTX);
  // const [onAccept, setOnAccept] = React.useState(() => () => {});
  const [openNodes, setOpenNodes] = React.useState<{
    [path: string]: boolean | undefined;
  }>({});

  const { data } = useAsync(itemsPromise);
  // const { showModal, OkCancelModal } = useOkCancelModal(TREECONTENTID);
  // const { showModal, closeModal, Modal } = useModal();

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
    <Toolbar>
      <Toolbar.Header
        className={cx(toolboxHeaderStyle, flexBetween, defaultPadding)}
      >
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
                    color: themeVar.colors.SuccessColor,
                    '&:hover, &:focus': { color: themeVar.colors.SuccessColor },
                  }),
                  { [deepSearchButtonOffStyle]: !deep },
                )}
                tooltip={i18nValues.deepSearch}
                onClick={() => {
                  globalDispatch(Actions.EditorActions.searchSetDeep(!deep));
                }}
              />
            </div>
          </>
        )}
      </Toolbar.Header>
      <Toolbar.Content
        id={TREECONTENTID}
        className={css({ padding: '1px', marginBottom: '2rem' })}
      >
        <DropMenu
          tooltip={i18nValues.add}
          items={data || []}
          prefixedLabel
          icon="plus"
          label="Add new variable"
          onSelect={(i, e) => {
            if ((e.ctrlKey || forceLocalDispatch) && localDispatch) {
              localDispatch(Actions.EditorActions.createVariable(i.value));
            } else {
              globalDispatch(Actions.EditorActions.createVariable(i.value));
              focusTab(mainLayoutId, 'Variable Properties');
            }
          }}
          containerClassName={addVariableContainerStyle}
          buttonClassName={addVariableButtonStyle}
        />
        {/* <Modal>
          <div className={cx(flex, flexColumn)}>
            <p>{i18nValues.changesWillBeLost}</p>
            <p>{i18nValues.whatDoYouWantToDo}</p>
            <div className={cx(flex, flexRow, justifyCenter, defaultMarginTop)}>
              <Button
                label={i18nValues.save}
                onClick={() => {
                  const editing = store.getState().global.editing;
                  if (isEditingVariable(editing)) {
                    store.dispatch(
                      ActionCreator.EDITION_CHANGES({
                        newEntity: editing.entity,
                      }),
                    );
                    closeModal();
                  }
                }}
              />
              <Button
                label={i18nValues.deleteChanges}
                onClick={() => {
                  closeModal();
                  onAccept();
                }}
                className={componentMarginLeft}
              />
              <Button
                label={i18nValues.seeChanges}
                onClick={() => {
                  const editing = store.getState().global.editing;
                  if (isEditingVariable(editing) && editing.newEntity) {
                    if (editing.newEntity['@class'].includes('Descriptor')) {
                      focusTab(mainLayoutId, 'Variable Properties');
                    } else {
                      focusTab(mainLayoutId, 'InstancesEditor');
                    }
                    closeModal();
                  }
                }}
                className={componentMarginLeft}
              />
            </div>
          </div>
        </Modal> */}
        <TreeView
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
                // onShowWarning={controls => {
                //   showModal(<EditionModal {...controls} />);
                // }}
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
