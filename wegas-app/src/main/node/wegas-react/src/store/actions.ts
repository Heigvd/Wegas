/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { createAction } from '@reduxjs/toolkit';
import type { NormalizedData } from '../data/normalize';

/**
 * Shared actions of the store: standalone actions (no state of their own).
 */

/**
 * Managed-mode response, fanned out to the slices.
 *
 * Dispatched by the managed-response funnel (manageResponseHandler in
 * store/managedResponse.ts) for every REST and websocket update. Slices pick only the
 * entity keys they own (e.g. `games`, `gameModels`) in their extraReducers.
 *
 * `events` carries the server-side events of the response (exceptions, script
 * errors), already timestamped and flagged unread by the funnel. The
 * `editorEvents` slice is their only consumer.
 */
export const managedResponseReceived = createAction<{
  updatedEntities: NormalizedData;
  deletedEntities: NormalizedData;
  events: WegasEvent[];
}>('managedResponse/received');
