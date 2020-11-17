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
import { classAndStyleShema } from '../tools/options';
import { css } from 'emotion';
import { Modal } from '../../Modal';
import { childrenDeserializerFactory } from './FlexList.component';
import { schemaProps } from '../tools/schemaProps';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import {
  parseAndRunClientScript,
  safeClientScriptEval,
  useScript,
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

interface PlayerModalProps extends FlexListProps, WegasComponentProps {
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
  attachedToId?: IScript;
}

function PlayerModal({
  onExitActions,
  children,
  context,
  editMode,
  attachedToId,
  ...flexProps
}: PlayerModalProps) {
  const attachTo = useScript<string>(attachedToId, context);
  const { client, server } = onExitActions || {};
  return (
    <Modal
      attachedToId={attachTo}
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
    >
      <FlexList {...flexProps}>{children}</FlexList>
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
        choices: [
          {
            label: 'Client script',
            value: {
              prop: 'client',
              schema: schemaProps.customScript({
                label: 'Client script',
                required: true,
                language: 'TypeScript',
              }),
            },
          },
          {
            label: 'Server script',
            value: {
              prop: 'server',
              schema: schemaProps.script({
                label: 'Server script',
                required: true,
                mode: 'SET',
                language: 'TypeScript',
              }),
            },
          },
        ],
      }),
      attachedToId: schemaProps.scriptString({ label: 'Attach to id' }),
      ...flexListSchema,
      ...classAndStyleShema,
    },
    getComputedPropsFromVariable: () => ({ children: [] }),
  }),
);
