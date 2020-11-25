import * as React from 'react';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
  isVertical,
  flexlayoutChoices,
  defaultFlexLayoutOptionsKeys,
} from '../../Layouts/FlexList';
import { WegasComponentProps } from '../tools/EditableComponent';
import {
  classStyleIdShema,
  clientAndServerScriptChoices,
} from '../tools/options';
import { css } from 'emotion';
import { Modal } from '../../Modal';
import { childrenDeserializerFactory } from './FlexList.component';
import { schemaProps } from '../tools/schemaProps';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import {
  parseAndRunClientScript,
  safeClientScriptEval,
} from '../../Hooks/useScript';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { store } from '../../../data/store';

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
}

function PlayerModal({
  onExitActions,
  children,
  context,
  editMode,
  attachedToId,
  id,
  style,
  className,
  ...flexProps
}: PlayerModalProps) {
  const { client, server } = onExitActions || {};
  return (
    <Modal
      attachedToId={attachedToId}
      onExit={() => {
        if (client) {
          safeClientScriptEval(client, context);
        }
        if (server) {
          store.dispatch(
            runScript(
              parseAndRunClientScript(server, context),
              Player.selectCurrent(),
            ),
          );
        }
      }}
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
      childrenSchema: flexlayoutChoices,
      childrenLayoutKeys: defaultFlexLayoutOptionsKeys,
    },
    name: 'Modal',
    icon: 'glasses',
    schema: {
      onExitActions: schemaProps.hashlist({
        label: 'On Exit Actions',
        required: true,
        choices: clientAndServerScriptChoices,
      }),
      attachedToId: schemaProps.string({ label: 'Attach to id' }),
      ...flexListSchema,
      ...classStyleIdShema,
    },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
