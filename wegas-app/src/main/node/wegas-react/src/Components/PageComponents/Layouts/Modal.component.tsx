import { css } from '@emotion/css';
import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { runLoadedScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { editingStore } from '../../../data/Stores/editingStore';
import { safeClientScriptEval } from '../../Hooks/useScript';
import {
  defaultFlexLayoutOptionsKeys,
  flexlayoutChoices,
  FlexList,
  FlexListProps,
  flexListSchema,
  isVertical,
} from '../../Layouts/FlexList';
import { Modal } from '../../Modal';
import { PAGE_LOADER_DEFAULT_ID } from '../../Page/PageLoader';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  assembleStateAndContext,
  WegasComponentProps,
} from '../tools/EditableComponent';
import {
  classStyleIdShema,
  clientAndServerScriptChoices,
} from '../tools/options';
import { schemaProps } from '../tools/schemaProps';
import { childrenDeserializerFactory } from './FlexList.component';

export const emptyLayoutItemStyle = css({
  display: 'flex',
  textAlign: 'center',
  verticalAlign: 'middle',
  borderStyle: 'solid',
  borderWidth: '1px',
  width: '120px',
  height: 'fit-content',
  overflowWrap: 'normal',
  zIndex: 0,
});

interface PlayerModalProps
  extends FlexListProps,
    WegasComponentProps,
    ClassStyleId {
  /**
   * onExitActions - callback when clicking outside the content of the modal
   */
  onExitActions: { client?: IScript; server?: IScript };
  /**
   * children - the array containing the child components
   */
  children: React.ReactNode[];
  /**
   * attachedTo - the ID of the element to insert the modal (will cover the whole element). By default, gets the last themeCTX provider
   */
  attachedToId?: string;
  /**
   * attachToClosest - CSS selector. Modal will be attached to nearest parent which match the given selector.
   * Ignored if <code>attachedToId</code> is defined
   */
  attachToClosest?: string;
  /**
   * attachToClosest - CSS selector. Modal will be attached to farthest parent which match the given selector
   * Ignored if <code>attachedToId</code> or <code>attachToClosest</code> is defined
   */
  attachToMostDistant?: string;
}

function PlayerModal({
  onExitActions,
  children,
  context,
  editMode,
  attachedToId,
  attachToClosest,
  attachToMostDistant,
  id,
  style,
  className,
  ...flexProps
}: PlayerModalProps) {
  const { client, server } = onExitActions || {};

  const onExit = React.useMemo(() => {
    return client == null && server == null
      ? undefined
      : () => {
          if (client) {
            safeClientScriptEval(client, context, undefined, undefined, {
              injectReturn: false,
            });
          }
          if (server) {
            editingStore.dispatch(
              runLoadedScript(
                server,
                Player.selectCurrent(),
                undefined,
                assembleStateAndContext(context),
              ),
            );
          }
        };
  }, [client, context, server]);

  return (
    <Modal
      attachedToId={attachedToId}
      attachToClosest={attachToClosest}
      attachToMostDistant={attachToMostDistant}
      onExit={onExit}
      style={editMode ? { position: 'relative' } : undefined}
      innerStyle={style}
      innerClassName={className}
      id={id}
    >
      <FlexList style={{ width: '100%', height: '100%' }} {...flexProps}>
        {children}
      </FlexList>
    </Modal>
  );
}

registerComponent(
  pageComponentFactory({
    component: PlayerModal,
    componentType: 'Layout',
    container: {
      isVertical,
      ChildrenDeserializer: childrenDeserializerFactory(),
      childrenLayoutOptionSchema: flexlayoutChoices,
      childrenLayoutKeys: defaultFlexLayoutOptionsKeys,
    },
    id: 'Modal',
    name: 'Modal',
    icon: 'glasses',
    illustration: 'modal',
    schema: {
      onExitActions: schemaProps.hashlist({
        label: 'On Exit Actions',
        required: true,
        choices: clientAndServerScriptChoices,
      }),
      attachedToId: schemaProps.string({ label: 'Attach to id' }),
      attachToClosest: schemaProps.string({
        label: 'Attach to closest matching element',
      }),
      attachToMostDistant: schemaProps.string({
        label: 'Attach to most distant matching element',
      }),
      ...flexListSchema,
      ...classStyleIdShema,
    },
    getComputedPropsFromVariable: () => ({
      children: [],
      attachedToId: PAGE_LOADER_DEFAULT_ID,
    }),
  }),
);
