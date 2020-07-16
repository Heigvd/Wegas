import { Reducer } from 'redux';
import u from 'immer';
import { ActionType, StateActions, manageResponseHandler } from '../actions';
import { VariableInstanceAPI } from '../../API/variableInstance.api';
import { ThunkResult, store } from '../store';
import { Player } from '../selectors';
import { VariableDescriptorAPI } from '../../API/variableDescriptor.api';
import { QuestionDescriptorAPI } from '../../API/questionDescriptor.api';
import { getInstance } from '../methods/VariableDescriptorMethods';
import { createScript } from '../../Helper/wegasEntites';
import { InboxAPI } from '../../API/inbox.api';
import {
  IVariableInstance,
  IScript,
  IPlayer,
  IVariableDescriptor,
  IChoiceDescriptor,
  IChoiceInstance,
  IQuestionDescriptor,
  IMessage,
  IInboxDescriptor,
  IReply,
} from 'wegas-ts-api/typings/WegasEntities';

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
): ThunkResult<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = store.getState().global.currentGameModelId;
    return VariableInstanceAPI.update(variableInstance, gameModelId).then(res =>
      // Dispatching changes to global store and passing local store that manages editor state
      store.dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function getAll(): ThunkResult<Promise<StateActions>> {
  return function (dispatch, getState) {
    return VariableInstanceAPI.getByPlayer().then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function runScript(
  script: string | IScript,
  player?: IPlayer,
  context?: IVariableDescriptor,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    const finalScript: IScript =
      'string' === typeof script ? createScript(script) : script;
    return VariableDescriptorAPI.runScript(
      gameModelId,
      p.id,
      finalScript,
      context,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

// Question specific actions

export function readChoice(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.readChoice(
      gameModelId,
      p.id,
      choice,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function selectAndValidate(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.selectAndValidate(
      gameModelId,
      p.id,
      choice,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function selectChoice(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.selectChoice(
      gameModelId,
      p.id,
      choice,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function cancelReply(reply: IReply, player?: IPlayer): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null || !reply) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.cancelReply(
      gameModelId,
      p.id,
      reply,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

/**
 * MCQ cbx question
 */
export function toggleReply(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): ThunkResult {
  const p = player != null ? player : Player.selectCurrent();

  const ci = getInstance<IChoiceInstance>(choice, p);
  const reply = ci?.replies.find(r => !r.validated);

  if (reply && !reply?.ignored) {
    // cancel not yet validated reply
    return cancelReply(reply, p);
  } else {
    return selectChoice(choice, p);
  }
}

export function validateQuestion(
  question: IQuestionDescriptor,
  player?: IPlayer,
): ThunkResult {
  return function (dispatch, getState) {
    const gameModelId = getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    const instance = getInstance(question);
    if (p.id == null || instance == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.validateQuestion(
      gameModelId,
      p.id,
      instance,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

// Message specific actions

export function readMessage(message: IMessage, player?: IPlayer): ThunkResult {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (message.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessage(message.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}

export function readMessages(
  inbox: IInboxDescriptor,
  player?: IPlayer,
): ThunkResult {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (inbox.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessages(inbox.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, getState().global)),
    );
  };
}
