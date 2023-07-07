import u from 'immer';
import { Reducer } from 'redux';
import {
  IChoiceDescriptor,
  IChoiceInstance,
  IDialogueDescriptor,
  IDialogueTransition,
  IEvent,
  IEventInboxInstance,
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
import { ActionCreator, manageResponseHandler, StateActions } from '../actions';
import { ActionType } from '../actionTypes';
import { getInstance } from '../methods/VariableDescriptorMethods';
import { Player } from '../selectors';
import { createEditingAction, editingStore, EditingThunkResult } from '../Stores/editingStore';
import { store, ThunkResult } from '../Stores/store';

type VariableInstanceId = string;
type EventInboxStatus = 'LOADING' | 'UPDATE_REQUIRED' | 'UNINITIALIZED' | 'UPTODATE';

export interface VariableInstanceState {
  instances: {
    [id: string]: Readonly<IVariableInstance> | undefined;
  },
  events: {
    [id: VariableInstanceId]: //eventInboxId
    {
      events : IEvent [],
      status : EventInboxStatus
    };
  }
}

function updateEventChain(events: IEvent[], lastEventId: number | undefined | null, receivedEvents: IEvent[]): 
  { sortedEvents :IEvent[], success: boolean} {

  if(!lastEventId){ // no events at all
    return {sortedEvents : [], success: true};
  }

  const existing : Record<number, IEvent> = events.reduce((acc : Record<number, IEvent>, e) => {
    acc[e.id || 0] = e;
    return acc;
  }, {});

  const received : Record<number, IEvent> = receivedEvents.reduce((acc : Record<number, IEvent>, e) => {
    acc[e.id || 0] = e;
    return acc;
  }, {});

  const all = Object.assign({}, existing, received);

  const sorted : IEvent[] = [];
  let curr : IEvent | undefined = all[lastEventId];
  while(curr && curr.previousEventId != null){
    sorted.push(curr);
    curr = curr.previousEventId ? all[curr.previousEventId] : undefined;
  }

  sorted.reverse();
  //success criterion : the first event has no parent
  const success = sorted.length > 0 && !!sorted[0].id

  return {sortedEvents: sorted, success};
}

const variableInstances: Reducer<Readonly<VariableInstanceState>> = u(
  (state: VariableInstanceState, action: StateActions) => {
    switch (action.type) {
      case ActionType.MANAGED_RESPONSE_ACTION: {
        // Update instances
        console.log('MANAGED_RESPONSE VI', action.payload.updatedEntities);
        action.payload.events
        const updateList = action.payload.updatedEntities.variableInstances;
        const deletedIds = Object.keys(
          action.payload.deletedEntities.variableInstances,
        );
        const updatedEventBoxes : IEventInboxInstance[] = [];
        if(!state.instances){
          state.instances = {};
        }
        if(!state.events){
          state.events = {};
        }

        Object.keys(updateList).forEach(id => {
          const newElement = updateList[id];
          const oldElement = state.instances[id];
          // merge in update prev var which have a higher version
          if (oldElement == null || newElement.version >= oldElement.version) {
            state.instances[id] = newElement;
            if(newElement['@class'] === 'EventInboxInstance'){
              updatedEventBoxes.push(newElement as IEventInboxInstance)
            }
          }

        });
        deletedIds.forEach(id => {
          delete state.instances[id];

          //TODO check probably wrong
          if(state.events[id]){
            delete state.events[id];
          }
        });

        // init empty event boxes
        updatedEventBoxes.forEach(ebox => {
          
          const boxId = ebox.id!;
          if(!state.events[boxId]){
            state.events[boxId] = {events: [], status:'UPDATE_REQUIRED'}
          }
        });

        // events are present in two possible cases
        // - a new event has been added to the eventBox
        // - only a list of events are present by the result a an API call to getEvents(boxId)
        const events = Object.values(action.payload.updatedEntities.events);
        const eventBuckets = events.reduce<Record<string, IEvent[]>>((acc, e) => {
            const id = e.parentId!;
            if(!acc[id]){
              acc[id] = [];
            }
            acc[id].push(e);
            return acc;
        }, {});

        // update the boxes that have received a new event
        Object.entries(eventBuckets).forEach(([boxId, newEvts]) => {
          state.events[boxId];
          const eventBox = state.instances[boxId] as IEventInboxInstance;
          if(eventBox){
            const {sortedEvents, success} = updateEventChain(state.events[boxId].events, eventBox.lastEventId, newEvts);
            console.log(sortedEvents);
            if(success){
              console.log('successfully updated event list');
              state.events[boxId].events = sortedEvents;
              state.events[boxId].status = 'UPTODATE';
              eventBox.events = state.events[boxId].events;

            } else {
              // if verification fails, fetch all of the events again
              // TODO later : more efficient and specific request
              console.log('event box update needed');
              state.events[boxId].status = 'UPDATE_REQUIRED';
            }
          }else {
            // should not be possible
          }

        })
        // check status of boxes

        // updatedEventBoxes.forEach(ebox => {
          
        //   const boxId = ebox.id!;
        //   // if(!state.events[boxId]){
        //   //   state.events[boxId] = {events: [], status:'UNINITIALIZED'}
        //   //   // ebox.events = state.events[boxId].events;
        //   // }

        //   const status = state.events[boxId].status;

        //   if(status == 'UNINITIALIZED'){
        //     // query all the events
        //     state.events[boxId].status = 'UPDATE_REQUIRED';
        //   } else if(status == 'UPTODATE' || status == 'LOADING'){
            
        //     // console.log('status', status);

        //     // const receivedEvents = Object.values(newEvents).filter((e) => e.parentId === boxId);
            
        //     // const {sortedEvents, success} = updateEventChain(state.events[boxId].events, ebox.lastEventId, receivedEvents);


        //   }

        // });

        return;
      }
      // case ActionType.EVENT_SET_LOADING:{
        
      //   console.log('got EVENT_SET_LOADING action updating', action.payload);
      //   action.payload.eventBoxIds.forEach(boxId => {
      //     state.events[boxId].status = 'LOADING';
      //   })
      // }

    }
  },
  {},
);
export default variableInstances;

//ACTIONS

export function checkAndUpdateEvents(
): EditingThunkResult<Promise<void>> {
  return async function (dispatch, getState) {

    const state = store.getState();
    console.log('checkupdate state', state);
    const evts = state.variableInstances.events;

    if(!evts)
      return;

    const staleBoxes = Object.keys(evts).filter(k => evts[k].status === 'UPDATE_REQUIRED');

    if(staleBoxes.length > 0){
      // update state status to loading
      // editingStore.dispatch())

      // dispatch(ActionCreator.EVENT_SET_LOADING({eventBoxIds:staleBoxes}));
      // editingStore.dispatch(ActionCreator.EVENT_SET_LOADING({eventBoxIds:staleBoxes}));

      staleBoxes.forEach(boxId => {
        const box = state.variableInstances.instances[boxId] as IEventInboxInstance;
        editingStore.dispatch(getEvents(box));
      });
    }

  };
}

function getEvents(
  eventInboxInstance: IEventInboxInstance
  ): EditingThunkResult<Promise<StateActions | void>> {
    return function (dispatch, getState) {
  
      return VariableInstanceAPI.getEvents(eventInboxInstance).then(res =>
        // Dispatching changes to global store and passing local store that manages editor state
        //TODO:  handle Events in manageResponseHandler
        editingStore.dispatch(manageResponseHandler(res, dispatch, getState(), true, undefined, false)),
      );
    };
}

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
  return function (dispatch) {
    return VariableInstanceAPI.getByPlayer().then(res => {
      const result = editingStore.dispatch(manageResponseHandler(res));
      dispatch(ActionCreator.INIT_STATE_SET('instances', true));
      return result;
    });
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

export const selectAndValidate = createEditingAction(async ({player, choice} : {choice: IChoiceDescriptor,
  player?: IPlayer,}, dispatch, getState) => {

    const gameModelId = store.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    const res = await QuestionDescriptorAPI.selectAndValidate(
      gameModelId,
      p.id,
      choice,
    )
    return dispatch(manageResponseHandler(res, dispatch, getState()));
})

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
