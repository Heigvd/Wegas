/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { IAnnouncementWithId } from 'wegas-ts-api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LoadingStatus } from '../store';
import { AnnouncementsAPI } from "../../API/announcements.api";

export interface AnnouncementState {
    active: {
        status: LoadingStatus;
        announcements: Record<number, IAnnouncementWithId>;
        dismissedIds: number[];
    };
}

const initialState: AnnouncementState = {
    active: { status: 'NOT_INITIALIZED', announcements: {}, dismissedIds: [] },
};

export const getActiveAnnouncements = createAsyncThunk(
    'announcement/active',
    async () => {
        return await AnnouncementsAPI.getActiveAnnouncements();
    },
);

const announcementSlice = createSlice({
    name: 'announcement',
    initialState,
    reducers: {
        dismissAnnouncement(state, action: PayloadAction<number>) {
            if (!state.active.dismissedIds.includes(action.payload)) {
                state.active.dismissedIds.push(action.payload);
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getActiveAnnouncements.pending, state => {
                state.active.status = 'LOADING';
            })
            .addCase(getActiveAnnouncements.fulfilled, (state, action) => {
                state.active.status = 'READY';
                state.active.announcements = action.payload;
            })
            .addCase(getActiveAnnouncements.rejected, state => {
                // Don't leave the status stuck on LOADING when a request fails.
                state.active.status = 'ERROR';
            });
    },
});

export const { dismissAnnouncement } = announcementSlice.actions;
export default announcementSlice.reducer;
