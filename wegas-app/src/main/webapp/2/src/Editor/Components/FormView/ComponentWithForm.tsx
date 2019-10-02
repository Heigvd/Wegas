import * as React from 'react';
import { css, cx } from 'emotion';
import { useStore, getDispatch } from '../../../data/store';
import { shallowIs } from '../../../Helper/shallowIs';
import { focusTabContext } from '../LinearTabLayout/LinearLayout';
import {
  closeEditor,
  EditorAction,
  Edition,
  FileEdition,
  VariableEdition,
} from '../../../data/Reducer/globalState';
import { layoutTabs } from '../Layout';
import { StyledLabel } from '../../../Components/AutoImport/String/Label';
import { AsyncVariableForm, EditorMoreAction } from '../EntityEditor';
import getEditionConfig, { getEntityActions } from '../../editionConfig';
import { Schema } from 'jsoninput';
import { AvailableViews } from '.';

const grow = css({
  flex: '1 1 auto',
});
const flex = css({
  display: 'flex',
});
const growBig = css({
  flex: '30 1 auto',
});

type OnClickItemType<T extends IAbstractEntity> = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  entity: T,
  path?: string[],
  onEntityUpdate?: (updatedEntity: T) => void,
) => void;

type OnUserClickItemType<T extends IAbstractEntity> = (
  event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  entity: T,
  onEntityUpdate?: (updatedEntity: T) => void,
) => void;

interface ComponentWithFormProps<T extends IAbstractEntity> {
  onClickItem?: OnUserClickItemType<T>;
  onSaveAction?: (item: T, callback: (sucess: T | string) => void) => void;
  onDeleteAction?: (item: T, callback: (sucess: T | string) => void) => void;
  moreEditorActions?: EditorMoreAction<T>[];
  children: (props: {
    onClickItemHandle: OnClickItemType<T>;
    mainSelectedItem?: T;
    secondarySelectedItem?: T;
  }) => React.ReactElement | null;
}

const isEditingEntity = (
  editing?: Readonly<Edition>,
): editing is VariableEdition | FileEdition =>
  editing !== undefined && 'entity' in editing;

const isSameEntity = <T extends IAbstractEntity>(e1: T, e2: T) =>
  e1.refId === e2.refId;

export default function ComponentWithForm<T extends IAbstractEntity>({
  onClickItem,
  onSaveAction,
  onDeleteAction,
  moreEditorActions,
  children,
}: ComponentWithFormProps<T>) {
  const [localSelectedEntity, setLocalSelectedEntity] = React.useState<T>();
  const [error, setError] = React.useState<string>('');
  const entityUpdate = React.useRef<(updatedEntity: T) => void>(() => {});
  const editing = useStore(
    state => state.global.editing,
    (a, b) => !shallowIs(a, b),
  );
  const dispatch = getDispatch();
  const focusTab = React.useContext(focusTabContext);

  const onSaveCallBack = (sucess: T | string) => {
    if (typeof sucess !== 'string') {
      entityUpdate.current(sucess);
      setLocalSelectedEntity(oldSelectedEntity => {
        if (oldSelectedEntity && sucess.refId === oldSelectedEntity.refId) {
          return sucess;
        }
      });
      getEntityActions(sucess).then(({ edit }) => {
        dispatch(edit(sucess));
      });
    } else {
      setError(sucess);
    }
  };

  const onDeleteCallBack = (sucess: T | string) => {
    if (typeof sucess !== 'string') {
      if (isEditingEntity(editing) && isSameEntity(editing.entity, sucess)) {
        dispatch(closeEditor());
        setLocalSelectedEntity(undefined);
      }
    } else {
      setError(sucess);
    }
  };

  const globalEditorActions: EditorAction<T> = {};
  const localEditorActions: EditorMoreAction<T>[] = [];

  if (onSaveAction) {
    const saveAction = (entity: T) => onSaveAction(entity, onSaveCallBack);
    globalEditorActions['save'] = saveAction;
    localEditorActions.push({
      label: 'Save',
      action: saveAction,
    });
  }
  if (onDeleteAction) {
    const deleteAction = (entity: T) =>
      onDeleteAction(entity, onDeleteCallBack);
    globalEditorActions['more'] = {
      delete: {
        label: 'Delete',
        action: deleteAction,
      },
    };
    localEditorActions.push({
      label: 'Delete',
      action: deleteAction,
    });
  }
  if (moreEditorActions) {
    globalEditorActions['more'] = moreEditorActions.reduce(
      (
        old: EditorAction<T>['more'],
        k: EditorMoreAction<T>,
        index: number,
      ) => ({
        ...old,
        [typeof k.label === 'string' ? k.label : index]: k,
      }),
      globalEditorActions['more'],
    );
    localEditorActions.push(...moreEditorActions);
  }

  const onClickItemHandle: OnClickItemType<T> = (
    event,
    entity,
    path,
    onEntityUpdate,
  ) => {
    onClickItem && onClickItem(event, entity, onEntityUpdate);
    entityUpdate.current = onEntityUpdate ? onEntityUpdate : () => {};
    if (event && event.ctrlKey) {
      setLocalSelectedEntity(oldSelectedEntity => {
        if (!oldSelectedEntity || entity.refId !== oldSelectedEntity.refId) {
          return entity;
        }
        return undefined;
      });
    } else {
      if (isEditingEntity(editing) && isSameEntity(editing.entity, entity)) {
        dispatch(closeEditor());
      } else {
        focusTab(layoutTabs.EntityEditor);
        getEntityActions(entity).then(({ edit }) => {
          return dispatch(edit(entity, path, globalEditorActions));
        });
      }
      return undefined;
    }
  };

  return (
    <div className={cx(flex, grow)}>
      <div className={cx(flex, growBig)}>
        {children({
          onClickItemHandle,
          mainSelectedItem: isEditingEntity(editing)
            ? (editing.entity as T)
            : undefined,
          secondarySelectedItem: localSelectedEntity,
        })}
      </div>
      {localSelectedEntity && (
        <div className={cx(flex, grow)}>
          <StyledLabel
            value={error}
            type={'error'}
            duration={3000}
            onLabelVanish={() => setError('')}
          />
          <div className={cx(flex, grow)}>
            <AsyncVariableForm
              getConfig={entity =>
                getEditionConfig(entity) as Promise<Schema<AvailableViews>>
              }
              entity={localSelectedEntity}
              actions={localEditorActions}
            />
          </div>
        </div>
      )}
    </div>
  );
}
