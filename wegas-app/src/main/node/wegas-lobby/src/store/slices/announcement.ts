import { IAnnouncementWithId } from 'wegas-ts-api';
import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';
import { mapById } from '../../helper';

export interface AnnouncementState {
  announcements: Record<number, IAnnouncementWithId>;
  status: 'NOT_INITIALIZED' | 'LOADING' | 'ACTIVE_LOADED' | 'ALL_LOADED';
}

const initialState: AnnouncementState = {
  announcements: {},
  status: 'NOT_INITIALIZED',
};

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(API.getAllAnnouncements.fulfilled, (state, action) => {
        state.status = 'ALL_LOADED';
        state.announcements = { ...state.announcements, ...mapById(action.payload) };
      })
      .addCase(API.getAllAnnouncements.pending, state => {
        state.status = 'LOADING';
      })
      .addCase(API.deleteAnnouncement.fulfilled, (state, action) => {
        delete state.announcements[action.meta.arg];
      })
      .addCase(API.createAnnouncement.fulfilled, (state, action) => {
        state.announcements[action.payload.id] = action.payload;
      })
      .addCase(API.updateAnnouncement.fulfilled, (state, action) => {
        if (state.announcements[action.payload.id] !== undefined) {
          state.announcements[action.payload.id] = action.payload;
        }
      });
  },
});

export default announcementSlice.reducer;
