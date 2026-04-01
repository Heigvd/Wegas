import { IAnnouncementWithId } from 'wegas-ts-api';
import { createSlice } from '@reduxjs/toolkit';
import * as API from '../../API/api';


export interface AnnouncementState {
  announcements: IAnnouncementWithId[];
  status : 'NOT_INITIALIZED' | 'LOADING' | 'ACTIVE_LOADED' | 'ALL_LOADED';
}

const initialState: AnnouncementState = {
  announcements: [],
  status: 'NOT_INITIALIZED'
}

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(API.getAllAnnouncements.fulfilled, (state, action) => {
      state.status = 'ALL_LOADED';
      state.announcements = action.payload;
    }).addCase(API.deleteAnnouncement.fulfilled, (state, action) => {
      state.announcements = state.announcements.filter(a => a.id !== action.meta.arg);
    }).addCase(API.createAnnouncement.fulfilled, (state, action) => {
      state.announcements.push(action.payload);
      state.announcements.sort((a1, a2) => a1.creationTime - a2.creationTime);
      // sort required ?
    }).addCase(API.updateAnnouncement.fulfilled, (state, action) => {
      state.announcements.push(action.payload);
    }).addCase(API.getActiveAnnouncements.fulfilled, (state, action) => {
      state.status = 'ACTIVE_LOADED';
      state.announcements = action.payload;
    }).addCase(API.getAllAnnouncements.pending, (state) => {
      state.status = 'LOADING';
    }).addCase(API.getActiveAnnouncements.pending, (state) => {
      state.status = 'LOADING';
    })
  }
})

export default announcementSlice.reducer;