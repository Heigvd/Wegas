import { css, cx } from '@emotion/css';
import { Schema } from 'jsoninput';
import * as React from 'react';
import { IVariableInstance } from 'wegas-ts-api';
import { VariableInstanceAPI } from '../../../API/variableInstance.api';
import { useOnEditionChangesModal } from '../../../Components/Modal';
import { ThemeComponent } from '../../../Components/Theme/Theme';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { Toolbar } from '../../../Components/Toolbar';
import {
  flex,
  flexColumn,
  grow,
  localSelection,
  mediumPadding,
} from '../../../css/classes';
import { ActionCreator } from '../../../data/actions';
import { getScopeEntity } from '../../../data/methods/VariableDescriptorMethods';
import { Edition, VariableEdition } from '../../../data/Reducer/globalState';
import { updateInstance } from '../../../data/Reducer/VariableInstanceReducer';
import { VariableDescriptor } from '../../../data/selectors';
import { store, StoreDispatch } from '../../../data/Stores/store';
import { editorTabsTranslations } from '../../../i18n/editorTabs/editorTabs';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import getEditionConfig from '../../editionConfig';
import {
  AsyncVariableForm,
  EditorProps,
  parseEventFromIndex,
} from '../EntityEditor';
import { AvailableViews } from '../FormView';
import { VariableTreeTitle } from './VariableTreeTitle';

const listBox = css({
  width: '100%',
  maxHeight: '100px',
  overflowY: 'auto',
  border: '1px solid ' + themeVar.colors.PrimaryColor,
  borderRadius: themeVar.dimensions.BorderRadius,
});

const listItem = css({
  padding: '5px',
  width: '100%',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.colors.HoverColor,
  },
});

const titleStyle = css({
  margin: '5px',
  fontWeight: 700,
});

function isEditingVariable(editing?: Edition): editing is VariableEdition {
  return (
    editing != null &&
    (editing.type === 'Variable' || editing.type === 'VariableFSM') &&
    editing.entity.id != null
  );
}

export interface InstancePropertiesProps
  extends ThemeComponent,
    DisabledReadonly {
  editing: Edition;
  events: WegasEvent[];
  dispatch: StoreDispatch | undefined;
  actions?: EditorProps<IVariableInstance>['actions'];
  highlight?: boolean;
}

export function InstanceProperties({
  editing,
  events,
  dispatch,
  actions,
  highlight,
  ...options
}: InstancePropertiesProps) {
  const mounted = React.useRef(false);
  const i18nValues = useInternalTranslate(editorTabsTranslations);
  const instanceState = isEditingVariable(editing)
    ? editing.instanceEditing?.editedInstance
    : undefined;

  const selectedInstance = instanceState?.instance;

  const [instances, setInstances] = React.useState<IVariableInstance[]>([]);
  const instance = instances.find(i => i.id === selectedInstance?.id);

  const descriptor = isEditingVariable(editing)
    ? VariableDescriptor.select(editing.entity.id)
    : undefined;

  const getInstances = React.useCallback((descriptor?: IVariableDescriptor) => {
    if (descriptor != null) {
      VariableInstanceAPI.getByDescriptor(descriptor).then(res => {
        if (mounted.current) {
          setInstances(res);
        }
      });
    }
  }, []);

  React.useEffect(() => {
    mounted.current = true;
    getInstances(descriptor);
    return () => {
      mounted.current = false;
    };
  }, [descriptor, getInstances]);

  const subpath = isEditingVariable(editing) ? editing.path : undefined;
  const title = descriptor ? (
    <VariableTreeTitle
      variable={descriptor}
      subPath={subpath}
      className={cx(grow, titleStyle)}
    />
  ) : (
    i18nValues.instanceProps.noDescriptorEdited
  );

  const onEditionChanges = useOnEditionChangesModal(
    dispatch != null,
    editing,
    dispatch || store.dispatch,
  );

  return (
    <Toolbar className={mediumPadding}>
      <Toolbar.Header>
        <div className={cx(grow, flex, flexColumn)}>
          <div>{title}</div>
          <div className={cx(listBox, grow)}>
            {instances.map(i => {
              if (i) {
                const scope = getScopeEntity(i);
                return (
                  <div
                    key={i.id}
                    className={cx(
                      listItem,
                      i.id === selectedInstance?.id && localSelection,
                    )}
                    onClick={e => {
                      onEditionChanges(i.id!, e, () => {
                        (dispatch || store.dispatch)(
                          ActionCreator.INSTANCE_EDIT({ instance: i }),
                        );
                      });
                    }}
                  >
                    {`#${i.id} - ${
                      scope
                        ? `${scope.name} (#${scope.id})`
                        : i18nValues.instanceProps.currentGameModel
                    }`}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </Toolbar.Header>
      <Toolbar.Content>
        {instance != null && (
          <AsyncVariableForm
            getConfig={si =>
              getEditionConfig(si) as Promise<Schema<AvailableViews>>
            }
            update={(entity: IVariableInstance) =>
              (dispatch || store.dispatch)(updateInstance(entity)).then(() => {
                getInstances(descriptor);
                (dispatch || store.dispatch)(ActionCreator.INSTANCE_SAVE());
              })
            }
            entity={instance}
            error={parseEventFromIndex(events)}
            actions={actions}
            onChange={newEntity => {
              ActionCreator.INSTANCE_EDIT({
                instance: newEntity as IVariableInstance,
              });
            }}
            highlight={highlight}
            localDispatch={dispatch}
            {...options}
          />
        )}
      </Toolbar.Content>
    </Toolbar>
  );
}
