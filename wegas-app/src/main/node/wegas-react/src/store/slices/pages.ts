/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import {
  createAsyncThunk,
  createSlice,
  isFulfilled,
  PayloadAction,
} from '@reduxjs/toolkit';
import { compare } from 'fast-json-patch';
import { PageAPI } from '../../API/pages.api';
import { getItemFromPath, isPageItem } from '../../Helper/pages';
import type { RootState } from '../store';
import { setInitStatus } from './initStatus';

/**
 * Pages keyed by id, plus the page index under the reserved `index` key.
 *
 * Failed requests are not stored: they surface as `rejected` actions only.
 * (The old store wrote them to `global.pageError`, which nothing ever read.)
 */
export type PageState = AllPages;

const initialState: PageState = {};

/**
 * Fetch the page index then every page.
 *
 * The index is fetched first to force the server to build it for old scenarios.
 */
export const getAll = createAsyncThunk(
  'pages/getAll',
  async (_: void, thunkAPI) => {
    const index = await PageAPI.getIndex();
    thunkAPI.dispatch(indexFetched(index));
    const pages = await PageAPI.getAll();
    thunkAPI.dispatch(pagesFetched(pages));
    thunkAPI.dispatch(setInitStatus({ key: 'pages', status: true }));
  },
);

export const getDefault = createAsyncThunk('pages/getDefault', () =>
  PageAPI.getDefault(),
);

export const get = createAsyncThunk('pages/get', (id: string) =>
  PageAPI.get(id),
);

/**
 * Patch a page with the diff between its stored version and `page`.
 */
export const patch = createAsyncThunk<
  Pages,
  { id: string; page: WegasComponent },
  { state: RootState }
>('pages/patch', ({ id, page }, thunkAPI) => {
  const oldPage = selectPage(thunkAPI.getState(), id);
  if (oldPage === undefined) {
    return thunkAPI.rejectWithValue(`Page ${id} not found`);
  }
  const diff = compare(oldPage, page);
  return PageAPI.patch(JSON.stringify(diff), id, true);
});

export const setDefault = createAsyncThunk(
  'pages/setDefault',
  (pageId: string) => PageAPI.setDefaultPage(pageId),
);

export const createItem = createAsyncThunk(
  'pages/createItem',
  async (
    {
      folderPath,
      newItem,
      pageContent,
    }: {
      folderPath: string[];
      newItem: PageIndexItem;
      pageContent?: WegasComponent;
    },
    thunkAPI,
  ) => {
    const index = await PageAPI.newIndexItem(folderPath, newItem, pageContent);
    const item = getItemFromPath(index, [...folderPath, newItem.name]);
    if (isPageItem(item)) {
      thunkAPI.dispatch(get(item.id!));
    }
    return index;
  },
);

export const deleteIndexItem = createAsyncThunk(
  'pages/deleteIndexItem',
  (itemPath: string[]) => PageAPI.deleteIndexItem(itemPath),
);

export const updateIndexItem = createAsyncThunk(
  'pages/updateIndexItem',
  ({ itemPath, item }: { itemPath: string[]; item: PageIndexItem }) =>
    PageAPI.updateIndexItem(itemPath, item),
);

export const moveIndexItem = createAsyncThunk(
  'pages/moveIndexItem',
  ({
    itemPath,
    folderPath,
    pos,
  }: {
    itemPath: string[];
    folderPath: string[];
    pos?: number;
  }) => PageAPI.moveIndexItem(itemPath, folderPath, pos),
);

export const deletePage = createAsyncThunk('pages/deletePage', (id: string) =>
  PageAPI.deletePage(id),
);

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {
    pagesFetched(state, action: PayloadAction<Pages>) {
      Object.assign(state, action.payload);
    },
    indexFetched(state, action: PayloadAction<PageIndex>) {
      state.index = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(
        isFulfilled(getDefault, get, patch),
        (state, action: PayloadAction<Pages>) => {
          Object.assign(state, action.payload);
        },
      )
      .addMatcher(
        isFulfilled(
          setDefault,
          createItem,
          deleteIndexItem,
          updateIndexItem,
          moveIndexItem,
          deletePage,
        ),
        (state, action: PayloadAction<PageIndex>) => {
          state.index = action.payload;
        },
      );
  },
});

const { pagesFetched, indexFetched } = pagesSlice.actions;

export default pagesSlice.reducer;

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export const selectPages = (state: RootState) => state.pages;

export const selectPageIndex = (state: RootState) => state.pages.index;

export const selectDefaultPageId = (state: RootState) =>
  state.pages.index?.defaultPageId;

export const selectPage = (
  state: RootState,
  pageId?: string,
): Readonly<WegasComponent> | undefined =>
  pageId === undefined ? undefined : state.pages[pageId];
