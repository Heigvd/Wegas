/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { groupBy } from 'lodash-es';
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
import { manageResponseHandler, StateActions } from '../../data/actions';
import { getInstance } from '../../data/methods/VariableDescriptorMethods';
import { Player } from '../../data/selectors';
import { store as oldStore } from '../../data/Stores/store';
import { createScript } from '../../Helper/wegasEntites';
import { managedResponseReceived } from '../actions';
import { createEditingAction } from '../localEdition';
import { AppThunk, dispatch } from '../store';
import { selectEdition } from './edition';
import { setInitStatus } from './initStatus';

type VariableInstanceId = string;
type EventInboxStatus = 'LOADING' | 'UPDATE_REQUIRED' | 'UPTODATE';

export interface VariableInstanceState {
  instances: {
    [id: string]: Readonly<IVariableInstance> | undefined;
  };
  events: {
    [id: VariableInstanceId]: //eventInboxId
    {
      events: IEvent[];
      status: EventInboxStatus;
    };
  };
}

const initialState: VariableInstanceState = { instances: {}, events: {} };

/**
 * TODO global migration: the thunks below read `currentGameModelId` from the old
 * store's `global` slice. Once `global` moves here, `oldStore` can go away.
 */

function updateEventChain(
  events: IEvent[],
  lastEventId: number | undefined | null,
  receivedEvents: IEvent[],
): { sortedEvents: IEvent[]; success: boolean } {
  if (!lastEventId) {
    // no events at all
    return { sortedEvents: [], success: true };
  }

  const existing: Record<number, IEvent> = events.reduce(
    (acc: Record<number, IEvent>, e) => {
      acc[e.id!] = e;
      return acc;
    },
    {},
  );

  const received: Record<number, IEvent> = receivedEvents.reduce(
    (acc: Record<number, IEvent>, e) => {
      acc[e.id!] = e;
      return acc;
    },
    {},
  );

  const all = { ...existing, ...received };

  const sorted: IEvent[] = [];
  let curr: IEvent | undefined = all[lastEventId];
  while (curr) {
    sorted.push(curr);
    curr = curr.previousEventId ? all[curr.previousEventId] : undefined;
  }

  sorted.reverse();
  //success criterion : all events are present and the first one has no previous element
  const success =
    sorted.length === Object.keys(all).length && !sorted[0].previousEventId;

  return { sortedEvents: sorted, success };
}

const variableInstancesSlice = createSlice({
  name: 'variableInstances',
  initialState,
  reducers: {
    /**
     * TODO: unguarded — throws when the event box is not in `state.events` yet.
     * Pre-existing behaviour, ported as-is with the slice.
     */
    setEventLoading(state, action: PayloadAction<number>) {
      state.events[action.payload].status = 'LOADING';
    },
  },
  extraReducers: builder => {
    builder.addCase(managedResponseReceived, (state, action) => {
      // Update instances
      const updateList = action.payload.updatedEntities.variableInstances;
      const deletedIds = Object.keys(
        action.payload.deletedEntities.variableInstances,
      );
      const updatedEventBoxes: IEventInboxInstance[] = [];

      Object.keys(updateList).forEach(id => {
        const newElement = updateList[id];
        const oldElement = state.instances[id];
        // merge in update prev var which have a higher version
        if (oldElement == null || newElement.version >= oldElement.version) {
          state.instances[id] = newElement;
          if (newElement['@class'] === 'EventInboxInstance') {
            updatedEventBoxes.push(newElement as IEventInboxInstance);
          }
        }
      });

      deletedIds.forEach(id => {
        delete state.instances[id];

        // delete event boxes stored events
        if (state.events[id]) {
          delete state.events[id];
        }
      });

      // EVENT BOXES UPDATE

      // init empty event boxes
      updatedEventBoxes.forEach(ebox => {
        const boxId = ebox.id!;
        if (ebox.lastEventId && !state.events[boxId]) {
          state.events[boxId] = { events: [], status: 'UPDATE_REQUIRED' };
        }
        if (!ebox.lastEventId && state.events[boxId]) {
          // after reset case
          // clear the events from the local state
          state.events[boxId] = { events: [], status: 'UPTODATE' };
          ebox.events = [];
        }
      });

      // events are present in two cases
      // - a new event has been added to the event box
      // - a list of events are present by the result of an API call to getEvents(boxId)
      const events = Object.values(action.payload.updatedEntities.events);

      // group by event box id
      const eventBuckets = groupBy(events, e => e.parentId);

      // update the boxes that have received a new event
      Object.entries(eventBuckets).forEach(([boxId, newEvts]) => {
        const eventBox = state.instances[boxId] as IEventInboxInstance;
        if (eventBox) {
          // TODO: `state.events[boxId]` is read unguarded — throws when a bucket
          // references a box absent from `state.events`. Pre-existing behaviour.
          const { sortedEvents, success } = updateEventChain(
            state.events[boxId].events,
            eventBox.lastEventId,
            newEvts,
          );

          if (success) {
            state.events[boxId].events = sortedEvents;
            state.events[boxId].status = 'UPTODATE';
            //bind with eventbox instance
            eventBox.events = state.events[boxId].events;
          } else {
            // if verification fails, fetch all of the events again
            // TODO : more efficient and specific requests for a subset of events
            state.events[boxId].status = 'UPDATE_REQUIRED';
          }
        } //else { // should not be possible
      });
    });
  },
});

export const { setEventLoading } = variableInstancesSlice.actions;
export default variableInstancesSlice.reducer;

//ACTIONS

/**
 * Fetches all the events of an event box and dispatches
 * @param eventInboxInstance The targetted instance to fetch events from
 */
export function getEvents(
  eventInboxInstance: IEventInboxInstance,
): AppThunk<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    dispatch(setEventLoading(eventInboxInstance.id!));
    return VariableInstanceAPI.getEvents(eventInboxInstance).then(res =>
      // Dispatching changes to global store and passing local store that manages editor state
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

export function updateInstance(
  variableInstance: IVariableInstance,
): AppThunk<Promise<StateActions | void>> {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    return VariableInstanceAPI.update(variableInstance, gameModelId).then(res =>
      // Dispatching changes to global store and passing local store that manages editor state
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

/**
 * Fetch every instance the current player can see.
 */
export const getAll = createAsyncThunk(
  'variableInstances/getAll',
  async (_, thunkAPI) => {
    const res = await VariableInstanceAPI.getByPlayer();
    dispatch(manageResponseHandler(res));
    thunkAPI.dispatch(setInitStatus({ key: 'instances', status: true }));
  },
);

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
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    return asyncRunScript(gameModelId, script, player, context).then(
      res =>
        res != null &&
        dispatch(
          manageResponseHandler(res, dispatch, selectEdition(getState())),
        ),
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
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    return asyncRunLoadedScript(
      gameModelId,
      script,
      player,
      currentDescriptor,
      payload,
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

// Question specific actions
export function read(
  choice: IChoiceDescriptor | IQuestionDescriptor | IWhQuestionDescriptor,
  player?: IPlayer,
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.read(gameModelId, p.id, choice).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

export const selectAndValidate = createEditingAction(
  async (
    { player, choice }: { choice: IChoiceDescriptor; player?: IPlayer },
    dispatch,
    getState,
  ) => {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    const res = await QuestionDescriptorAPI.selectAndValidate(
      gameModelId,
      p.id,
      choice,
    );
    return dispatch(
      manageResponseHandler(res, dispatch, selectEdition(getState())),
    );
  },
);

export function selectChoice(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.selectChoice(gameModelId, p.id, choice).then(
      res =>
        dispatch(
          manageResponseHandler(res, dispatch, selectEdition(getState())),
        ),
    );
  };
}

export function cancelReply(reply: IReply, player?: IPlayer): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
    const p = player != null ? player : Player.selectCurrent();
    if (p.id == null || !reply) {
      throw Error('Missing persisted player');
    }
    return QuestionDescriptorAPI.cancelReply(gameModelId, p.id, reply).then(
      res =>
        dispatch(
          manageResponseHandler(res, dispatch, selectEdition(getState())),
        ),
    );
  };
}

/**
 * MCQ cbx question
 */
export function toggleReply(
  choice: IChoiceDescriptor,
  player?: IPlayer,
): AppThunk {
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
): AppThunk {
  return function (dispatch, getState) {
    const gameModelId = oldStore.getState().global.currentGameModelId;
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
    ).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

// Message specific actions

export function readMessage(message: IMessage, player?: IPlayer): AppThunk {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (message.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessage(message.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

export function readMessages(
  inbox: IInboxDescriptor,
  player?: IPlayer,
): AppThunk {
  return function (dispatch, getState) {
    const p = player != null ? player : Player.selectCurrent();
    if (inbox.id == null) {
      throw Error('Missing message id');
    }
    if (p.id == null) {
      throw Error('Missing persisted player');
    }
    return InboxAPI.readMessages(inbox.id, p.id).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}

export function applyFSMTransition(
  stateMachine: IFSMDescriptor | IDialogueDescriptor,
  transition: ITransition | IDialogueTransition,
  cbFn?: () => void,
): AppThunk {
  return function (dispatch, getState) {
    if (stateMachine.id == null) {
      throw Error('Missing statemachine id');
    }
    if (transition.id == null) {
      throw Error('Missing transition id');
    }
    return FSM_API.applyTransition(stateMachine.id, transition.id).then(res => {
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState())));
      cbFn && cbFn();
    });
  };
}

export function getByIds(ids: number[]): AppThunk {
  return function (dispatch, getState) {
    return VariableInstanceAPI.getByIds(ids).then(res =>
      dispatch(manageResponseHandler(res, dispatch, selectEdition(getState()))),
    );
  };
}
