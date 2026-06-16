/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IAnnouncementWithId } from 'wegas-ts-api';
import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { mapById } from '../../helper';
import { LoadingStatus } from '../store';

export interface AnnouncementState {
  all: {
    status: LoadingStatus;
    announcements: Record<number, IAnnouncementWithId>;
  };
  active: {
    status: LoadingStatus;
    announcements: Record<number, IAnnouncementWithId>;
    dismissedIds: number[];
  };
}

const initialState: AnnouncementState = {
  all: { status: 'NOT_INITIALIZED', announcements: {} },
  active: { status: 'NOT_INITIALIZED', announcements: {}, dismissedIds: [] },
};

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {
    dismissAnnouncement(state, action: { payload: number }) {
      if (!state.active.dismissedIds.includes(action.payload)) {
        state.active.dismissedIds.push(action.payload);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(API.getAllAnnouncements.pending, state => {
        state.all.status = 'LOADING';
      })
      .addCase(API.getAllAnnouncements.fulfilled, (state, action) => {
        state.all.status = 'READY';
        state.all.announcements = { ...state.all.announcements, ...mapById(action.payload) };
      })
      .addCase(API.deleteAnnouncement.fulfilled, (state, action) => {
        delete state.all.announcements[action.meta.arg];
        delete state.active.announcements[action.meta.arg];
      })
      .addCase(API.createAnnouncement.fulfilled, (state, action) => {
        state.all.announcements[action.payload.id] = action.payload;
      })
      .addCase(API.updateAnnouncement.fulfilled, (state, action) => {
        if (state.all.announcements[action.payload.id] !== undefined) {
          state.all.announcements[action.payload.id] = action.payload;
        }
      })
      .addCase(API.getActiveAnnouncements.fulfilled, (state, action) => {
        state.active.status = 'READY';
        state.active.announcements = action.payload;
      })
      .addCase(API.getActiveAnnouncements.pending, state => {
        state.active.status = 'LOADING';
      });
  },
});

export const { dismissAnnouncement } = announcementSlice.actions;
export default announcementSlice.reducer;
