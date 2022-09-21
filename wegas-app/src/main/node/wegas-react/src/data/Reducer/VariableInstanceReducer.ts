import u from 'immer';
import { Reducer } from 'redux';
import {
  IChoiceDescriptor,
  IChoiceInstance,
  IDialogueDescriptor,
  IDialogueTransition,
  IFSMDescriptor,
  IInboxDescriptor,
  IMessage,
  IPlayer,
  IQuestionDescriptor,
  IQuestionInstance,
  IReply,
  IScript,
  ITransition,
  IVariableDescriptor,
  IVariableInstance,
  IWhQuestionDescriptor,
  IWhQuestionInstance,
} from 'wegas-ts-api';
import { FSM_API } from '../../API/FSM.api';
import { InboxAPI } from '../../API/inbox.api';
import { QuestionDescriptorAPI } from '../../API/questionDescriptor.api';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { VariableInstanceAPI } from '../../API/variableInstance.api';
import { createScript } from '../../Helper/wegasEntites';
import { manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { getInstance } from '../methods/VariableDescriptorMethods';
import { Player } from '../selectors';
import { editingStore, EditingThunkResult } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';

export interface VariableInstanceState {
  [id: string]: Readonly<IVariableInstance> | undefined;
}

const variableInstances: Reducer<Readonly<VariableInstanceState>> = u(
  (state: VariableInstanceState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
        const updateList = action.payload.updatedEntities.variableInstances;
        const deletedIds = Object.keys(
          action.payload.deletedEntities.variableInstances,
        );
        Object.keys(updateList).forEach(id => {
          const newElement = updateList[id];
          const oldElement = state[id];
          // merge in update prev var which have a higher version
          if (oldElement == null || newElement.version >= oldElement.version) {
            state[id] = newElement;
          }
        });
        deletedIds.forEach(id => {
          delete state[id];
        });
        return;
      }
    }
  },
  {},
);
export default variableInstances;

//ACTIONS

export function updateInstance(
  variableInstance: IVariableInstance,
): EditingThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableInstanceAPI.update(variableInstance, gameModelId).then(res =>
      // Dispatching changes to global store and passing local store that manages editor state
      editingStore.dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function getAll(): ThunkResult<Promise<StateActions>> {
  return function () {
    return VariableInstanceAPI.getByPlayer().then(res =>
      editingStore.dispatch(manageResponseHandler(res)),
    );
  };
}

export const asyncRunScript = async (
  gameModelId: number,
  script: string | IScript,
  player?: IPlayer,
  context?: IVariableDescriptor,
) => {
  const p = player != null ? player : Player.selectCurrent();
  if (p.id == null) {
    throw Error('Missing persisted player');
  }
  if (gameModelId == null) {
    throw Error('Missing persisted gameModel');
  }
  const finalScript: IScript =
    'string' === typeof script ? createScript(script, 'JavaScript') : script;
  return VariableDescriptorAPI.runScript(
    gameModelId,
    p.id,
    finalScript,
    context,
  );
};

export function runScript(
  script: string | IScript,
  player?: IPlayer,
  context?: IVariableDescriptor,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return asyncRunScript(gameModelId, script, player, context).then(
      res =>
        res != null &&
        dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export async function asyncRunLoadedScript(
  gameModelId: number,
  script: string | IScript,
  player?: IPlayer,
  currentDescriptor?: IVariableDescriptor,
  payload?: { [key: string]: unknown },
) {
  const p = player != null ? player : Player.selectCurrent();
  if (p.id == null) {
    throw Error('Missing persisted player');
  }
  const finalScript: IScript =
    'string' === typeof script ? createScript(script, 'JavaScript') : script;
  return VariableDescriptorAPI.runLoadedScript(
    gameModelId,
    p.id,
    finalScript,
    currentDescriptor,
    payload,
  );
}

export function runLoadedScript(
  script: string | IScript,
  player?: IPlayer,
  currentDescriptor?: IVariableDescriptor,
  payload?: { [key: string]: unknown },
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return asyncRunLoadedScript(
      gameModelId,
      script,
      player,
      currentDescriptor,
      payload,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

// Question specific actions
export function read(
  choice: IChoiceDescriptor | IQuestionDescriptor | IWhQuestionDescriptor,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.read(gameModelId, p.id, choice).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function selectAndValidate(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.selectAndValidate(
      gameModelId,
      p.id,
      choice,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

export function selectChoice(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.selectChoice(gameModelId, p.id, choice).then(
      res => dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function cancelReply(
  reply: IReply,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null || !reply) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.cancelReply(gameModelId, p.id, reply).then(
      res => dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

/**
 * MCQ cbx question
 */
export function toggleReply(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): EditingThunkResult {
  const p = player != null ? player : Player.selectCurrent();

  const ci = getInstance<IChoiceInstance>(choice, p);
  const reply = ci?.replies.find(r => r.choiceName === choice.name);
  if (reply && !reply?.ignored) {
    // cancel not yet validated reply
    return cancelReply(reply, p);
  } else {
    return selectChoice(choice, p);
  }
}

export function validateQuestion(
  question: Readonly<IQuestionDescriptor | IWhQuestionDescriptor>,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    const instance = getInstance<IQuestionInstance | IWhQuestionInstance>(
      question,
    );
    if (p.id == null || instance == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.validateQuestion(
      gameModelId,
      p.id,
      instance,
    ).then(res => dispatch(manageResponseHandler(res, dispatch, getState())));
  };
}

// Message specific actions

export function readMessage(
  message: IMessage,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (message.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessage(message.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function readMessages(
  inbox: IInboxDescriptor,
  player?: IPlayer,
): EditingThunkResult {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (inbox.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessages(inbox.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}

export function applyFSMTransition(
  stateMachine: IFSMDescriptor | IDialogueDescriptor,
  transition: ITransition | IDialogueTransition,
  cbFn?: () => void,
): EditingThunkResult {
  return function (dispatch, getState) {
    if (stateMachine.id == null) {
      throw Error('Missing statemachine id');
    }
    if (transition.id == null) {
      throw Error('Missing transition id');
    }
    return FSM_API.applyTransition(stateMachine.id, transition.id).then(res => {
      dispatch(manageResponseHandler(res, dispatch, getState()));
      cbFn && cbFn();
    });
  };
}

export function getByIds(ids: number[]): EditingThunkResult {
  return function (dispatch, getState) {
    return VariableInstanceAPI.getByIds(ids).then(res =>
      editingStore.dispatch(manageResponseHandler(res, dispatch, getState())),
    );
  };
}
