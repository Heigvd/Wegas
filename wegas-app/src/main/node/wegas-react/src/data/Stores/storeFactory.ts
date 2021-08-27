import u from 'immer';
import { Reducer, createStore, combineReducers, applyMiddleware } from 'redux';
import {
  editorManagement,
  EditingState,
  eventManagement,
  eventHandlersManagement,
} from '../Reducer/globalState';
import { StateActions } from '../actions';
import { composeEnhancers } from './store';
import thunk, { ThunkMiddleware } from 'redux-thunk';

const editing: Reducer<Readonly<EditingState>> = u(
  (state: EditingState, action: StateActions) => {
    state.eventsHandlers = eventHandlersManagement(state, action);
    state.events = eventManagement(state, action);
    state.editing = editorManagement(state, action);
    return state;
  },
  {
    events: [],
    eventsHandlers: {
      ExceptionEvent: {},
      ClientEvent: {},
      CustomEvent: {},
      EntityDestroyedEvent: {},
      EntityUpdatedEvent: {},
      OutdatedEntitiesEvent: {},
    },
  } as EditingState,
);

export interface LocalGlobalState {
  global: Readonly<EditingState>;
}

export const storeFactory = () =>
  createStore(
    combineReducers<LocalGlobalState, StateActions>({ global: editing }),
    composeEnhancers(
      applyMiddleware(thunk as ThunkMiddleware<LocalGlobalState, StateActions>),
    ),
  );
